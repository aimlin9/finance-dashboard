from django.contrib import admin
from .models import Transaction


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ['date', 'description', 'amount', 'type', 'category', 'category_confidence']
    list_filter = ['category', 'type', 'is_manually_edited']
    search_fields = ['description', 'merchant']