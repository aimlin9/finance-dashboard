from django.urls import path
from .views import TransactionListView, TransactionDetailView, TransactionUpdateView, TransactionExportView

urlpatterns = [
    path('', TransactionListView.as_view(), name='transaction-list'),
    path('export/', TransactionExportView.as_view(), name='transaction-export'),
    path('<uuid:pk>/', TransactionDetailView.as_view(), name='transaction-detail'),
    path('<uuid:pk>/edit/', TransactionUpdateView.as_view(), name='transaction-update'),
]