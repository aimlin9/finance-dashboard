from django.contrib import admin
from .models import BankStatement


@admin.register(BankStatement)
class BankStatementAdmin(admin.ModelAdmin):
    list_display = ['file_name', 'user', 'bank_name', 'status', 'total_transactions', 'uploaded_at']
    list_filter = ['status', 'bank_name', 'file_type']
    search_fields = ['file_name', 'user__email']