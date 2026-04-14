from django.urls import path
from .views import (
    DashboardView, MonthlyListView, CompareView, InsightsView,
    BudgetView, BudgetSetView, BudgetRemoveView,
    SavingsGoalListView, SavingsGoalDetailView,
)

urlpatterns = [
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
    path('monthly/', MonthlyListView.as_view(), name='monthly-list'),
    path('compare/', CompareView.as_view(), name='compare'),
    path('insights/', InsightsView.as_view(), name='insights'),
    path('budget/', BudgetView.as_view(), name='budget'),
    path('budget/set/', BudgetSetView.as_view(), name='budget-set'),
    path('budget/remove/', BudgetRemoveView.as_view(), name='budget-remove'),
    path('savings-goals/', SavingsGoalListView.as_view(), name='savings-goals'),
    path('savings-goals/<uuid:pk>/', SavingsGoalDetailView.as_view(), name='savings-goal-detail'),
]