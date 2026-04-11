from django.urls import path
from .views import StatementUploadView, StatementListView, StatementDetailView, StatementStatusView

urlpatterns = [
    path('upload/', StatementUploadView.as_view(), name='statement-upload'),
    path('', StatementListView.as_view(), name='statement-list'),
    path('<uuid:pk>/', StatementDetailView.as_view(), name='statement-detail'),
    path('<uuid:pk>/status/', StatementStatusView.as_view(), name='statement-status'),
]