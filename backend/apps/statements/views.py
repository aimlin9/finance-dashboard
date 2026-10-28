import logging
import os
import tempfile
from collections import Counter
from decimal import Decimal

from django.db import transaction as db_transaction
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser
import pikepdf

from .models import BankStatement
from .serializers import BankStatementSerializer, StatementUploadSerializer
from .parsers import CSVParser, PDFParser, BankDetector
from apps.transactions.models import Transaction, CategoryRule
from apps.transactions.categorizer import TransactionCategorizer
from apps.analytics.summarizer import compute_monthly_summary

logger = logging.getLogger(__name__)

NOTHING_FOUND = (
    "We couldn't find any transactions in this file. Supported: GCB, Ecobank and "
    "MTN MoMo statements (PDF or CSV), and CSV exports from any bank that have a "
    "date column plus an amount or debit/credit columns."
)


class StatementParseError(Exception):
    """A problem with the uploaded file that the user can fix."""


def fingerprint(user_id, date, amount, tx_type, description):
    return (user_id, date, Decimal(str(amount)).quantize(Decimal('0.01')), tx_type, description.strip().lower())


def parse_upload(uploaded_file, ext, bank_name):
    """Returns (bank_name, raw_transactions). Raises StatementParseError for user-fixable problems."""
    if ext == 'csv':
        return bank_name, CSVParser(bank_name).extract(uploaded_file.read())

    with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tmp:
        for chunk in uploaded_file.chunks():
            tmp.write(chunk)
        tmp_path = tmp.name

    try:
        try:
            pikepdf.open(tmp_path).close()
        except pikepdf.PasswordError:
            raise StatementParseError(
                'This PDF is password-protected. Please unlock it first and re-upload.'
            )
        except pikepdf.PdfError:
            raise StatementParseError('This file is not a readable PDF.')

        # Detect bank from PDF content if filename didn't match
        if bank_name == 'unknown':
            bank_name = BankDetector.detect_from_pdf(tmp_path)

        return bank_name, PDFParser(bank_name).extract(tmp_path)
    finally:
        os.unlink(tmp_path)


class StatementUploadView(generics.CreateAPIView):
    """POST /api/statements/upload/ — Upload and parse a bank statement."""
    parser_classes = [MultiPartParser]
    serializer_class = StatementUploadSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        uploaded_file = serializer.validated_data['file']
        ext = uploaded_file.name.rsplit('.', 1)[-1].lower()

        # Step 1: Detect which bank from filename and content preview
        content_preview = uploaded_file.read(500).decode('utf-8', errors='ignore')
        uploaded_file.seek(0)
        bank_name = BankDetector.detect(uploaded_file.name, content_preview)

        # Step 2: Create the statement record
        statement = BankStatement.objects.create(
            user=request.user,
            file_name=uploaded_file.name,
            file_type=ext,
            bank_name=bank_name,
            status='processing',
        )

        try:
            # Step 3: Parse the file
            bank_name, raw_transactions = parse_upload(uploaded_file, ext, bank_name)
            statement.bank_name = bank_name
            if not raw_transactions:
                raise StatementParseError(NOTHING_FOUND)

            # Step 4: Categorize, with the user's own rules taking priority
            user_rules = CategoryRule.objects.filter(user=request.user).values_list('pattern', 'category')
            TransactionCategorizer(user_rules=list(user_rules)).categorize_bulk(raw_transactions)

            # Step 5: Skip rows already imported from an overlapping statement.
            # A Counter (not a set) so two genuine identical purchases on the
            # same day in a new file are both kept.
            dates = [tx['date'] for tx in raw_transactions]
            existing = Counter(
                fingerprint(request.user.id, t.date, t.amount, t.type, t.description)
                for t in Transaction.objects.filter(
                    user=request.user, date__gte=min(dates), date__lte=max(dates),
                )
            )

            transactions_to_create = []
            duplicates = 0
            for tx in raw_transactions:
                key = fingerprint(request.user.id, tx['date'], tx['amount'], tx['type'], tx['description'])
                if existing[key] > 0:
                    existing[key] -= 1
                    duplicates += 1
                    continue
                transactions_to_create.append(Transaction(
                    user=request.user,
                    statement=statement,
                    date=tx['date'],
                    description=tx['description'][:500],
                    amount=tx['amount'],
                    type=tx['type'],
                    balance_after=tx.get('balance_after'),
                    category=tx['category'],
                    category_confidence=tx['category_confidence'],
                ))

            with db_transaction.atomic():
                Transaction.objects.bulk_create(transactions_to_create)

                # Step 6: Update statement status
                statement.total_transactions = len(transactions_to_create)
                statement.duplicates_skipped = duplicates
                statement.status = 'done'
                statement.processed_at = timezone.now()
                statement.statement_month = max(dates).replace(day=1)
                statement.save()

                # Step 7: Compute monthly summaries
                for month_date in {tx.date.replace(day=1) for tx in transactions_to_create}:
                    compute_monthly_summary(request.user, month_date)

        except StatementParseError as e:
            return self._fail(statement, str(e))
        except Exception:
            logger.exception('Failed to parse statement %s', statement.id)
            return self._fail(
                statement,
                "Something went wrong reading this statement. If it's a scanned image "
                "rather than a downloaded statement, try exporting a CSV from your bank instead.",
            )

        return Response(
            BankStatementSerializer(statement).data,
            status=status.HTTP_201_CREATED,
        )

    def _fail(self, statement, message):
        statement.status = 'failed'
        statement.error_message = message
        statement.save()
        return Response({'error': message}, status=status.HTTP_400_BAD_REQUEST)


class StatementListView(generics.ListAPIView):
    """GET /api/statements/ — List all statements for current user."""
    serializer_class = BankStatementSerializer

    def get_queryset(self):
        return BankStatement.objects.filter(user=self.request.user)


class StatementDetailView(generics.RetrieveDestroyAPIView):
    """GET/DELETE /api/statements/{id}/"""
    serializer_class = BankStatementSerializer

    def get_queryset(self):
        return BankStatement.objects.filter(user=self.request.user)

    def perform_destroy(self, instance):
        affected_months = {
            d.replace(day=1)
            for d in Transaction.objects.filter(statement=instance).values_list('date', flat=True)
        }

        instance.delete()

        for month_date in affected_months:
            compute_monthly_summary(self.request.user, month_date)


class StatementStatusView(generics.RetrieveAPIView):
    """GET /api/statements/{id}/status/ — Polling endpoint."""

    def get_queryset(self):
        return BankStatement.objects.filter(user=self.request.user)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        return Response({
            'status': instance.status,
            'error_message': instance.error_message,
            'total_transactions': instance.total_transactions,
        })