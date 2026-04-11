from django.contrib import admin
from .models import Category, MonthlySummary, BudgetAlert


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'color', 'is_system', 'budget_limit']


@admin.register(MonthlySummary)
class MonthlySummaryAdmin(admin.ModelAdmin):
    list_display = ['user', 'month', 'total_income', 'total_expenses', 'net_savings', 'savings_rate']


@admin.register(BudgetAlert)
class BudgetAlertAdmin(admin.ModelAdmin):
    list_display = ['user', 'category', 'month', 'alert_type', 'is_read']