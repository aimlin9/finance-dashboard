import csv
from datetime import date

from django.db import transaction as db_transaction
from django.http import HttpResponse
from rest_framework import generics
from rest_framework.exceptions import ValidationError
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.analytics.summarizer import compute_monthly_summary
from apps.analytics.utils import parse_month, payee_name
from .categories import CATEGORIES, CATEGORY_SLUGS
from .categorizer import normalize
from .models import Transaction, CategoryRule
from .serializers import TransactionSerializer, CategoryRuleSerializer

ORDERINGS = {'date', '-date', 'amount', '-amount'}


class TransactionPagination(PageNumberPagination):
    """25 per page by default; reports and exports may ask for up to 1000."""
    page_size = 25
    page_size_query_param = 'page_size'
    max_page_size = 1000


def parse_date_param(params, name):
    value = params.get(name)
    if not value:
        return None
    try:
        return date.fromisoformat(value)
    except ValueError:
        raise ValidationError({name: 'Use the format YYYY-MM-DD.'})


def filter_transactions(user, params):
    """Shared by the list, export and print views so they always agree."""
    qs = Transaction.objects.filter(user=user).select_related('statement')

    if month := params.get('month'):
        month_date = parse_month(month)
        qs = qs.filter(date__year=month_date.year, date__month=month_date.month)
    if date_from := parse_date_param(params, 'date_from'):
        qs = qs.filter(date__gte=date_from)
    if date_to := parse_date_param(params, 'date_to'):
        qs = qs.filter(date__lte=date_to)
    if category := params.get('category'):
        qs = qs.filter(category__in=category.split(','))
    if tx_type := params.get('type'):
        qs = qs.filter(type=tx_type)
    if search := params.get('search'):
        qs = qs.filter(description__icontains=search.strip())
    try:
        if min_amount := params.get('min_amount'):
            qs = qs.filter(amount__gte=float(min_amount))
        if max_amount := params.get('max_amount'):
            qs = qs.filter(amount__lte=float(max_amount))
    except ValueError:
        raise ValidationError({'amount': 'Amounts must be numbers.'})

    ordering = params.get('ordering')
    if ordering in ORDERINGS:
        qs = qs.order_by(ordering, '-created_at')
    return qs


def refresh_summaries(user, dates):
    for month_date in {d.replace(day=1) for d in dates}:
        compute_monthly_summary(user, month_date)


def validate_category(value):
    if value not in CATEGORY_SLUGS:
        raise ValidationError({'category': f'Unknown category "{value}".'})
    return value


class CategoryListView(APIView):
    """GET /api/transactions/categories/ — The category list the app uses everywhere."""

    def get(self, request):
        return Response(CATEGORIES)


class TransactionListView(generics.ListAPIView):
    """GET /api/transactions/ — Filterable list of user transactions."""
    serializer_class = TransactionSerializer
    pagination_class = TransactionPagination

    def get_queryset(self):
        return filter_transactions(self.request.user, self.request.query_params)


class TransactionDetailView(generics.RetrieveAPIView):
    """GET /api/transactions/{id}/ — Single transaction."""
    serializer_class = TransactionSerializer

    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user)


class TransactionUpdateView(generics.UpdateAPIView):
    """
    PATCH /api/transactions/{id}/edit/ — Correct a category or add a note.

    Optional flags with a category change:
      apply_to_similar: also recategorize this user's other transactions with
                        the same payee
      remember:         save a rule so future uploads are categorized the same way
    """
    serializer_class = TransactionSerializer

    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user)

    def update(self, request, *args, **kwargs):
        tx = self.get_object()
        old_category = tx.category
        response = super().update(request, *args, **kwargs)
        tx.refresh_from_db()

        updated_similar = 0
        rule = None
        if tx.category != old_category:
            affected_dates = [tx.date]
            pattern = normalize(payee_name(tx.description))
            has_pattern = pattern and pattern != 'unlabelled'

            if request.data.get('apply_to_similar') and has_pattern:
                similar = [
                    t for t in Transaction.objects.filter(user=request.user, type=tx.type).exclude(id=tx.id)
                    if normalize(payee_name(t.description)) == pattern and t.category != tx.category
                ]
                Transaction.objects.filter(id__in=[t.id for t in similar]).update(
                    category=tx.category, category_confidence=1.0, is_manually_edited=True,
                )
                updated_similar = len(similar)
                affected_dates += [t.date for t in similar]

            if request.data.get('remember') and has_pattern:
                rule, _ = CategoryRule.objects.update_or_create(
                    user=request.user, pattern=pattern, defaults={'category': tx.category},
                )

            # The dashboard's category breakdown is stored per month,
            # so it must be recomputed or it shows the old category.
            refresh_summaries(request.user, affected_dates)

        response.data = {
            **TransactionSerializer(tx).data,
            'updated_similar': updated_similar,
            'rule': CategoryRuleSerializer(rule).data if rule else None,
        }
        return response

    def perform_update(self, serializer):
        if 'category' in serializer.validated_data:
            validate_category(serializer.validated_data['category'])
            serializer.save(is_manually_edited=True, category_confidence=1.0)
        else:
            serializer.save()


class TransactionBulkCategorizeView(APIView):
    """POST /api/transactions/bulk-categorize/ {ids: [...], category} — Recategorize many at once."""

    def post(self, request):
        ids = request.data.get('ids') or []
        category = validate_category(request.data.get('category'))
        if not isinstance(ids, list) or not ids or len(ids) > 1000:
            raise ValidationError({'ids': 'Send a list of 1 to 1000 transaction ids.'})

        with db_transaction.atomic():
            qs = Transaction.objects.filter(user=request.user, id__in=ids)
            dates = list(qs.values_list('date', flat=True))
            updated = qs.update(category=category, category_confidence=1.0, is_manually_edited=True)
            refresh_summaries(request.user, dates)

        return Response({'updated': updated, 'category': category})


class CategoryRuleListView(generics.ListAPIView):
    """GET /api/transactions/rules/ — Rules learned from the user's corrections."""
    serializer_class = CategoryRuleSerializer
    pagination_class = None

    def get_queryset(self):
        return CategoryRule.objects.filter(user=self.request.user)


class CategoryRuleDetailView(generics.DestroyAPIView):
    """DELETE /api/transactions/rules/{id}/"""

    def get_queryset(self):
        return CategoryRule.objects.filter(user=self.request.user)


class TransactionExportView(APIView):
    """GET /api/transactions/export/?month=2026-03 — Download transactions as CSV (accepts list filters)."""

    def get(self, request):
        qs = filter_transactions(request.user, request.query_params)
        month = request.query_params.get('month')

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="fintrack_transactions_{month or "all"}.csv"'

        writer = csv.writer(response)
        writer.writerow(['Date', 'Description', 'Amount', 'Type', 'Category', 'Balance After', 'Note'])

        for tx in qs.iterator():
            writer.writerow([tx.date, tx.description, tx.amount, tx.type, tx.category, tx.balance_after, tx.note])

        return response


class RecurringTransactionsView(APIView):
    """
    GET /api/transactions/recurring/ — Payments that repeat.

    Groups by payee rather than exact description, because banks append a new
    reference number every time ("ECG PREPAID 39201", "ECG PREPAID 40876").
    A payee counts as recurring when it appears in at least two different
    months; the typical gap between payments gives the cadence and next date.
    """

    def get(self, request):
        groups = {}
        for tx in Transaction.objects.filter(user=request.user).order_by('date'):
            name = payee_name(tx.description)
            if name == 'Unlabelled':
                continue
            groups.setdefault((name, tx.type), []).append(tx)

        results = []
        for (name, tx_type), txns in groups.items():
            months = {(t.date.year, t.date.month) for t in txns}
            if len(txns) < 2 or len(months) < 2:
                continue

            gaps = sorted((b.date - a.date).days for a, b in zip(txns, txns[1:]) if b.date != a.date)
            typical_gap = gaps[len(gaps) // 2] if gaps else None
            if typical_gap is None:
                cadence = 'irregular'
            elif 5 <= typical_gap <= 9:
                cadence = 'weekly'
            elif 12 <= typical_gap <= 17:
                cadence = 'fortnightly'
            elif 25 <= typical_gap <= 35:
                cadence = 'monthly'
            else:
                cadence = 'irregular'

            amounts = [float(t.amount) for t in txns]
            average = sum(amounts) / len(amounts)
            first, last = txns[0], txns[-1]
            next_expected = None
            if cadence != 'irregular':
                next_expected = str(last.date.fromordinal(last.date.toordinal() + typical_gap))

            results.append({
                'description': name,
                'sample_description': last.description,
                'count': len(txns),
                'category': last.category,
                'type': tx_type,
                'average_amount': str(round(average, 2)),
                'last_amount': str(last.amount),
                'cadence': cadence,
                'first_seen': str(first.date),
                'last_seen': str(last.date),
                'next_expected': next_expected,
            })

        # Fixed-cadence bills first, then by how much they cost per year-ish
        results.sort(key=lambda r: (r['cadence'] == 'irregular', -float(r['average_amount']) * r['count']))
        return Response(results)
