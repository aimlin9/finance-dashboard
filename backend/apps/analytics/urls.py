from django.urls import path
from .views import DashboardView, MonthlyListView, CompareView, InsightsView, BudgetView, BudgetSetView

urlpatterns = [
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
    path('monthly/', MonthlyListView.as_view(), name='monthly-list'),
    path('compare/', CompareView.as_view(), name='compare'),
    path('insights/', InsightsView.as_view(), name='insights'),
    path('budget/', BudgetView.as_view(), name='budget'),
    path('budget/set/', BudgetSetView.as_view(), name='budget-set'),
]