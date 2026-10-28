from django.urls import path
from .views import (
    TransactionListView, TransactionDetailView, TransactionUpdateView, TransactionExportView,
    RecurringTransactionsView, TransactionBulkCategorizeView, CategoryListView,
    CategoryRuleListView, CategoryRuleDetailView,
)

urlpatterns = [
    path('', TransactionListView.as_view(), name='transaction-list'),
    path('categories/', CategoryListView.as_view(), name='transaction-categories'),
    path('export/', TransactionExportView.as_view(), name='transaction-export'),
    path('recurring/', RecurringTransactionsView.as_view(), name='transaction-recurring'),
    path('bulk-categorize/', TransactionBulkCategorizeView.as_view(), name='transaction-bulk-categorize'),
    path('rules/', CategoryRuleListView.as_view(), name='category-rules'),
    path('rules/<uuid:pk>/', CategoryRuleDetailView.as_view(), name='category-rule-detail'),
    path('<uuid:pk>/', TransactionDetailView.as_view(), name='transaction-detail'),
    path('<uuid:pk>/edit/', TransactionUpdateView.as_view(), name='transaction-update'),
]
