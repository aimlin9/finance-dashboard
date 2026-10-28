from collections import defaultdict
from datetime import date
from decimal import Decimal, InvalidOperation

from django.db.models import Sum
from django.db.models.functions import ExtractWeekDay
from django.utils import timezone
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.transactions.models import Transaction
from .ai_insights import generate_insight, InsightUnavailable
from .models import MonthlySummary, Category, SavingsGoal
from .summarizer import compute_monthly_summary
from .utils import parse_month, previous_month, payee_name


def parse_money(value, field, allow_zero=True):
    """Validate a user-entered amount; returns (Decimal, None) or (None, error Response)."""
    try:
        amount = Decimal(str(value)).quantize(Decimal('0.01'))
    except (InvalidOperation, TypeError, ValueError):
        return None, Response({field: 'Enter a valid amount.'}, status=400)
    if amount < 0 or (amount == 0 and not allow_zero) or amount >= Decimal('10000000000'):
        return None, Response({field: 'Enter an amount greater than zero.'}, status=400)
    return amount, None


def summary_totals(summary):
    return {
        'month': str(summary.month),
        'total_income': str(summary.total_income),
        'total_expenses': str(summary.total_expenses),
        'net_savings': str(summary.net_savings),
        'savings_rate': summary.savings_rate,
    }


class DashboardView(APIView):
    """GET /api/analytics/dashboard/?month=2026-03"""

    def get(self, request):
        month_date = parse_month(request.query_params.get('month'))

        summary = MonthlySummary.objects.filter(
            user=request.user, month=month_date
        ).first() or compute_monthly_summary(request.user, month_date)

        if not summary:
            return Response({'detail': 'No transactions for this month.'}, status=404)

        txns = Transaction.objects.filter(
            user=request.user, date__year=month_date.year, date__month=month_date.month,
        )
        debits = txns.filter(type='debit')

        daily = [
            {'date': str(row['date']), 'amount': float(row['total'])}
            for row in debits.values('date').annotate(total=Sum('amount')).order_by('date')
        ]

        # Django: 1 = Sunday ... 7 = Saturday. Reorder to Monday-first.
        by_weekday = {
            row['wd']: float(row['total'])
            for row in debits.annotate(wd=ExtractWeekDay('date')).values('wd').annotate(total=Sum('amount'))
        }
        weekday_spending = [
            {'day': name, 'amount': by_weekday.get(wd, 0.0)}
            for name, wd in zip(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], [2, 3, 4, 5, 6, 7, 1])
        ]

        payees = defaultdict(lambda: {'amount': 0.0, 'count': 0})
        for description, amount in debits.values_list('description', 'amount'):
            entry = payees[payee_name(description)]
            entry['amount'] += float(amount)
            entry['count'] += 1
        top_payees = sorted(
            ({'name': name, **values} for name, values in payees.items()),
            key=lambda p: p['amount'], reverse=True,
        )[:6]

        largest = [
            {
                'id': str(t.id), 'date': str(t.date), 'description': t.description,
                'amount': str(t.amount), 'category': t.category,
            }
            for t in debits.order_by('-amount')[:5]
        ]

        previous = MonthlySummary.objects.filter(
            user=request.user, month=previous_month(month_date)
        ).first()

        return Response({
            **summary_totals(summary),
            'top_category': summary.top_category,
            'top_category_amount': str(summary.top_category_amount or 0),
            'category_breakdown': summary.category_breakdown,
            'ai_insight': summary.ai_insight,
            'insight_generated_at': summary.insight_generated_at,
            'transaction_count': txns.count(),
            'debit_count': debits.count(),
            'daily_spending': daily,
            'weekday_spending': weekday_spending,
            'top_payees': top_payees,
            'largest_expenses': largest,
            'previous': summary_totals(previous) if previous else None,
        })


class MonthlyListView(APIView):
    """GET /api/analytics/monthly/ — All available months."""

    def get(self, request):
        months = (
            MonthlySummary.objects
            .filter(user=request.user)
            .values_list('month', flat=True)
        )
        return Response({'months': [str(m) for m in months]})


class TrendView(APIView):
    """GET /api/analytics/trend/ — Every month's totals, oldest first, in one request."""

    def get(self, request):
        summaries = MonthlySummary.objects.filter(user=request.user).order_by('month')
        return Response([
            {**summary_totals(s), 'category_breakdown': s.category_breakdown}
            for s in summaries
        ])


class InsightsView(APIView):
    """GET /api/analytics/insights/?month=2026-03 — Generate AI insight."""

    def get(self, request):
        month_date = parse_month(request.query_params.get('month'))
        force = request.query_params.get('force', 'false') == 'true'

        summary = MonthlySummary.objects.filter(
            user=request.user, month=month_date
        ).first()

        if not summary:
            return Response({'detail': 'No data for this month.'}, status=404)

        if not summary.ai_insight or force:
            previous = MonthlySummary.objects.filter(
                user=request.user, month=previous_month(month_date)
            ).first()
            try:
                insight = generate_insight(summary, previous)
            except InsightUnavailable as e:
                # Not saved: a failure must not be cached as if it were advice.
                return Response({'detail': str(e)}, status=503)
            summary.ai_insight = insight
            summary.insight_generated_at = timezone.now()
            summary.save(update_fields=['ai_insight', 'insight_generated_at'])

        return Response({
            'month': str(summary.month),
            'insight': summary.ai_insight,
            'generated_at': summary.insight_generated_at,
        })


class CompareView(APIView):
    """GET /api/analytics/compare/?month1=2026-02&month2=2026-03"""

    def get(self, request):
        month1 = parse_month(request.query_params.get('month1'), 'month1')
        month2 = parse_month(request.query_params.get('month2'), 'month2')

        sum1 = MonthlySummary.objects.filter(user=request.user, month=month1).first()
        sum2 = MonthlySummary.objects.filter(user=request.user, month=month2).first()

        if not sum1 or not sum2:
            return Response({'detail': 'Data not available for one or both months.'}, status=404)

        return Response({
            'month1': {**summary_totals(sum1), 'category_breakdown': sum1.category_breakdown},
            'month2': {**summary_totals(sum2), 'category_breakdown': sum2.category_breakdown},
        })


def user_categories(user):
    """The user's customised categories plus system defaults they haven't customised."""
    user_cats = list(Category.objects.filter(user=user))
    custom_slugs = {c.slug for c in user_cats}
    system_cats = Category.objects.filter(is_system=True, user=None).exclude(slug__in=custom_slugs)
    return user_cats + list(system_cats)


class BudgetView(APIView):
    """GET /api/analytics/budget/?month=2026-03 — Get budgets with current spending."""

    def get(self, request):
        month_date = parse_month(request.query_params.get('month'))

        spending = {
            row['category']: float(row['total'])
            for row in Transaction.objects.filter(
                user=request.user,
                type='debit',
                date__year=month_date.year,
                date__month=month_date.month,
            ).values('category').annotate(total=Sum('amount'))
        }

        data = []
        for cat in user_categories(request.user):
            if cat.slug == 'income':
                continue  # You don't budget money coming in
            spent = spending.get(cat.slug, 0)
            limit = float(cat.budget_limit) if cat.budget_limit else None
            progress = (spent / limit * 100) if limit else None

            data.append({
                'name': cat.name,
                'slug': cat.slug,
                'color': cat.color,
                'icon': cat.icon,
                'budget_limit': limit,
                'amount_spent': spent,
                'progress': round(progress, 1) if progress is not None else None,
                'status': 'exceeded' if progress is not None and progress >= 100
                    else 'warning' if progress is not None and progress >= 80
                    else 'ok',
            })

        data.sort(key=lambda c: (c['budget_limit'] is None, -c['amount_spent']))
        return Response(data)


class BudgetSetView(APIView):
    """POST /api/analytics/budget/set/ — Set budget limit for a category."""

    def post(self, request):
        slug = request.data.get('category')
        if not slug or request.data.get('budget_limit') in (None, ''):
            return Response(
                {'detail': 'category and budget_limit are required.'},
                status=400,
            )
        limit, error = parse_money(request.data.get('budget_limit'), 'budget_limit', allow_zero=False)
        if error:
            return error

        cat = Category.objects.filter(slug=slug, user=request.user).first()

        if not cat:
            system_cat = Category.objects.filter(slug=slug, is_system=True, user=None).first()
            if not system_cat:
                return Response({'detail': 'Category not found.'}, status=404)

            cat = Category.objects.create(
                user=request.user,
                name=system_cat.name,
                slug=system_cat.slug,
                color=system_cat.color,
                icon=system_cat.icon,
                budget_limit=limit,
                is_system=False,
            )
        else:
            cat.budget_limit = limit
            cat.save()

        return Response({
            'category': cat.slug,
            'budget_limit': str(cat.budget_limit),
            'status': 'updated',
        })


class BudgetRemoveView(APIView):
    """POST /api/analytics/budget/remove/ — Remove budget limit for a category."""

    def post(self, request):
        slug = request.data.get('category')
        if not slug:
            return Response({'detail': 'category is required.'}, status=400)

        cat = Category.objects.filter(slug=slug, user=request.user).first()
        if not cat:
            return Response({'detail': 'No custom budget found.'}, status=404)

        cat.budget_limit = None
        cat.save()

        return Response({'category': slug, 'status': 'removed'})


def serialize_goal(goal):
    target = float(goal.target_amount)
    current = float(goal.current_amount)
    progress = (current / target * 100) if target else 0

    # What it takes to finish on time, spread over the whole months remaining.
    monthly_needed = None
    months_left = None
    if goal.deadline and not goal.is_completed:
        today = timezone.localdate()
        months_left = max((goal.deadline.year - today.year) * 12 + goal.deadline.month - today.month, 0)
        remaining = max(target - current, 0)
        monthly_needed = round(remaining / months_left, 2) if months_left else round(remaining, 2)

    return {
        'id': str(goal.id),
        'name': goal.name,
        'target_amount': str(goal.target_amount),
        'current_amount': str(goal.current_amount),
        'deadline': str(goal.deadline) if goal.deadline else None,
        'is_completed': goal.is_completed,
        'progress': round(progress, 1),
        'months_left': months_left,
        'monthly_needed': monthly_needed,
        'created_at': str(goal.created_at),
    }


def validate_deadline(value):
    if not value:
        return None, None
    try:
        return date.fromisoformat(str(value)), None
    except ValueError:
        return None, Response({'deadline': 'Use the format YYYY-MM-DD.'}, status=400)


class SavingsGoalListView(APIView):
    """GET/POST /api/analytics/savings-goals/"""

    def get(self, request):
        goals = SavingsGoal.objects.filter(user=request.user)
        return Response([serialize_goal(g) for g in goals])

    def post(self, request):
        name = (request.data.get('name') or '').strip()
        if not name or request.data.get('target_amount') in (None, ''):
            return Response({'detail': 'name and target_amount are required.'}, status=400)

        target, error = parse_money(request.data.get('target_amount'), 'target_amount', allow_zero=False)
        if error:
            return error
        deadline, error = validate_deadline(request.data.get('deadline'))
        if error:
            return error

        goal = SavingsGoal.objects.create(
            user=request.user,
            name=name[:200],
            target_amount=target,
            deadline=deadline,
        )
        return Response({**serialize_goal(goal), 'status': 'created'}, status=201)


class SavingsGoalDetailView(APIView):
    """PATCH/DELETE /api/analytics/savings-goals/{id}/"""

    def patch(self, request, pk):
        try:
            goal = SavingsGoal.objects.get(id=pk, user=request.user)
        except SavingsGoal.DoesNotExist:
            return Response({'detail': 'Goal not found.'}, status=404)

        if 'current_amount' in request.data:
            amount, error = parse_money(request.data['current_amount'], 'current_amount')
            if error:
                return error
            goal.current_amount = amount
        if 'add_amount' in request.data:
            amount, error = parse_money(request.data['add_amount'], 'add_amount', allow_zero=False)
            if error:
                return error
            goal.current_amount += amount
        if 'name' in request.data and (request.data['name'] or '').strip():
            goal.name = request.data['name'].strip()[:200]
        if 'target_amount' in request.data:
            target, error = parse_money(request.data['target_amount'], 'target_amount', allow_zero=False)
            if error:
                return error
            goal.target_amount = target
        if 'deadline' in request.data:
            goal.deadline, error = validate_deadline(request.data['deadline'])
            if error:
                return error

        # Recomputed both ways: lowering the amount re-opens a finished goal.
        goal.is_completed = goal.current_amount >= goal.target_amount
        goal.save()
        return Response({**serialize_goal(goal), 'status': 'updated'})

    def delete(self, request, pk):
        try:
            goal = SavingsGoal.objects.get(id=pk, user=request.user)
        except SavingsGoal.DoesNotExist:
            return Response({'detail': 'Goal not found.'}, status=404)

        goal.delete()
        return Response({'status': 'deleted'})
