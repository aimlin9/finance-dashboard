import uuid
from django.db import models
from django.conf import settings


class Transaction(models.Model):
    TYPE_CHOICES = [('credit', 'Credit'), ('debit', 'Debit')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='transactions')
    statement = models.ForeignKey('statements.BankStatement', on_delete=models.CASCADE, related_name='transactions')
    date = models.DateField(db_index=True)
    description = models.CharField(max_length=500)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    category = models.CharField(max_length=50, db_index=True)
    category_confidence = models.FloatField(default=0.0)
    is_manually_edited = models.BooleanField(default=False)
    merchant = models.CharField(max_length=200, blank=True)
    reference = models.CharField(max_length=200, blank=True)
    balance_after = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = 'transactions'
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f"{self.date} | {self.description[:40]} | {self.amount}"