import os
import tempfile
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser
import pikepdf

from .models import BankStatement
from .serializers import BankStatementSerializer, StatementUploadSerializer
from .parsers import CSVParser, PDFParser, BankDetector
from apps.transactions.models import Transaction
from apps.transactions.categorizer import TransactionCategorizer
from apps.analytics.summarizer import compute_monthly_summary

class StatementUploadView(generics.CreateAPIView):
    """POST /api/statements/upload/ — Upload and parse a bank statement."""
    parser_classes = [MultiPartParser]
    serializer_class = StatementUploadSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        uploaded_file = serializer.validated_data['file']
        ext = uploaded_file.name.rsplit('.', 1)[-1].lower()

        # Step 1: Detect which bank
        content_preview = uploaded_file.read(500).decode('utf-8', errors='ignore')
        uploaded_file.seek(0)  # Reset file pointer to beginning
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
            if ext == 'csv':
                content = uploaded_file.read().decode('utf-8')
                parser = CSVParser(bank_name)
                raw_transactions = parser.extract(content)
            elif ext == 'pdf':
                with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tmp:
                    for chunk in uploaded_file.chunks():
                        tmp.write(chunk)
                    tmp_path = tmp.name

                # Try to open — if encrypted, return helpful error
                try:
                    test_pdf = pikepdf.open(tmp_path)
                    test_pdf.close()
                except pikepdf.PasswordError:
                    os.unlink(tmp_path)
                    statement.status = 'failed'
                    statement.error_message = 'This PDF is password-protected. Please unlock it first and re-upload.'
                    statement.save()
                    return Response({
                        'error': 'This PDF is password-protected. Please unlock it first and re-upload.'
                    }, status=status.HTTP_400_BAD_REQUEST)

                parser = PDFParser(bank_name)
                raw_transactions = parser.extract(tmp_path)
                os.unlink(tmp_path)

            # Step 4: Categorize transactions
            categorizer = TransactionCategorizer()
            categorizer.categorize_bulk(raw_transactions)

            # Step 5: Save transactions to database
            transactions_to_create = []
            for tx in raw_transactions:
                transactions_to_create.append(Transaction(
                    user=request.user,
                    statement=statement,
                    date=tx['date'],
                    description=tx['description'],
                    amount=tx['amount'],
                    type=tx['type'],
                    balance_after=tx.get('balance_after'),
                    category=tx['category'],
                    category_confidence=tx['category_confidence'],
                ))

            Transaction.objects.bulk_create(transactions_to_create)

            # Step 5: Update statement status
            statement.total_transactions = len(transactions_to_create)
            statement.status = 'done'
            statement.processed_at = timezone.now()
            statement.save()

            # Step 6: Compute monthly summaries
            months_seen = set()
            for tx in raw_transactions:
                month_date = tx['date'].replace(day=1)
                months_seen.add(month_date)

            for month_date in months_seen:
                compute_monthly_summary(request.user, month_date)

        except Exception as e:
            statement.status = 'failed'
            statement.error_message = str(e)
            statement.save()
            return Response({
                'error': f'Failed to parse statement: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            BankStatementSerializer(statement).data,
            status=status.HTTP_201_CREATED,
        )


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
        from apps.analytics.summarizer import compute_monthly_summary
        from apps.transactions.models import Transaction

        # Get affected months before deletion
        affected_months = set()
        transactions = Transaction.objects.filter(statement=instance)
        for tx in transactions:
            affected_months.add(tx.date.replace(day=1))

        # Delete the statement (cascades to transactions)
        instance.delete()

        # Recompute summaries for affected months
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