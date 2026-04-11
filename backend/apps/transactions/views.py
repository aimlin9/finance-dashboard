from rest_framework import generics
from .models import Transaction
from .serializers import TransactionSerializer


class TransactionListView(generics.ListAPIView):
    """GET /api/transactions/ — Filterable list of user transactions."""
    serializer_class = TransactionSerializer

    def get_queryset(self):
        qs = Transaction.objects.filter(user=self.request.user)
        params = self.request.query_params

        if month := params.get('month'):
            year, m = month.split('-')
            qs = qs.filter(date__year=int(year), date__month=int(m))
        if category := params.get('category'):
            qs = qs.filter(category=category)
        if tx_type := params.get('type'):
            qs = qs.filter(type=tx_type)
        if search := params.get('search'):
            qs = qs.filter(description__icontains=search)

        return qs


class TransactionDetailView(generics.RetrieveAPIView):
    """GET /api/transactions/{id}/ — Single transaction."""
    serializer_class = TransactionSerializer

    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user)


class TransactionUpdateView(generics.UpdateAPIView):
    """PATCH /api/transactions/{id}/ — Manual category correction."""
    serializer_class = TransactionSerializer

    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user)

    def perform_update(self, serializer):
        serializer.save(is_manually_edited=True, category_confidence=1.0)