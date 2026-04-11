import uuid
from django.db import models
from django.conf import settings


class BankStatement(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('done', 'Done'),
        ('failed', 'Failed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='statements')
    file_name = models.CharField(max_length=255)
    file_url = models.CharField(max_length=500, blank=True)
    file_type = models.CharField(max_length=10)  # 'pdf' or 'csv'
    bank_name = models.CharField(max_length=100, blank=True)
    statement_month = models.DateField(null=True, blank=True)
    total_transactions = models.IntegerField(default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    error_message = models.TextField(blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        app_label = 'statements'
        ordering = ['-uploaded_at']

    def __str__(self):
        return f"{self.file_name} ({self.status})"