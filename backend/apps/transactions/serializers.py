from rest_framework import serializers
from .models import Transaction


class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = [
            'id', 'date', 'description', 'amount', 'type', 'category',
            'category_confidence', 'is_manually_edited', 'merchant',
            'reference', 'balance_after', 'created_at',
        ]
        read_only_fields = [
            'id', 'date', 'description', 'amount', 'type',
            'category_confidence', 'merchant', 'reference',
            'balance_after', 'created_at',
        ]