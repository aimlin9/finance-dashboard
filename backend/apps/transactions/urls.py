from django.urls import path
from .views import TransactionListView, TransactionDetailView, TransactionUpdateView

urlpatterns = [
    path('', TransactionListView.as_view(), name='transaction-list'),
    path('<uuid:pk>/', TransactionDetailView.as_view(), name='transaction-detail'),
    path('<uuid:pk>/edit/', TransactionUpdateView.as_view(), name='transaction-update'),
]