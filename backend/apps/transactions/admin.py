from django.contrib import admin
from .models import Transaction, CategoryRule


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ['date', 'description', 'amount', 'type', 'category', 'category_confidence']
    list_filter = ['category', 'type', 'is_manually_edited']
    search_fields = ['description', 'merchant']

@admin.register(CategoryRule)
class CategoryRuleAdmin(admin.ModelAdmin):
    list_display = ['pattern', 'category', 'user', 'created_at']
    search_fields = ['pattern']
