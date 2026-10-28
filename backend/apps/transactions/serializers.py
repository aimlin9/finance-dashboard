from rest_framework import serializers
from .models import Transaction, CategoryRule


class TransactionSerializer(serializers.ModelSerializer):
    statement_name = serializers.CharField(source='statement.file_name', read_only=True)

    class Meta:
        model = Transaction
        fields = [
            'id', 'date', 'description', 'amount', 'type', 'category',
            'category_confidence', 'is_manually_edited', 'merchant',
            'reference', 'balance_after', 'note', 'statement_name', 'created_at',
        ]
        read_only_fields = [
            'id', 'date', 'description', 'amount', 'type',
            'category_confidence', 'is_manually_edited', 'merchant', 'reference',
            'balance_after', 'statement_name', 'created_at',
        ]


class CategoryRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = CategoryRule
        fields = ['id', 'pattern', 'category', 'created_at']
        read_only_fields = fields
