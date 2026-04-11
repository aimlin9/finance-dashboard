from rest_framework import serializers
from .models import BankStatement


class BankStatementSerializer(serializers.ModelSerializer):
    class Meta:
        model = BankStatement
        fields = [
            'id', 'file_name', 'file_type', 'bank_name', 'statement_month',
            'total_transactions', 'status', 'error_message', 'uploaded_at', 'processed_at',
        ]
        read_only_fields = fields


class StatementUploadSerializer(serializers.Serializer):
    file = serializers.FileField()

    def validate_file(self, value):
        max_size = 10 * 1024 * 1024  # 10MB
        if value.size > max_size:
            raise serializers.ValidationError('File size must be under 10MB.')
        ext = value.name.rsplit('.', 1)[-1].lower()
        if ext not in ('pdf', 'csv'):
            raise serializers.ValidationError('Only PDF and CSV files are supported.')
        return value