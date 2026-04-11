import uuid
from django.db import models
from django.conf import settings


class Category(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True, related_name='categories')
    name = models.CharField(max_length=100)
    slug = models.CharField(max_length=50)
    color = models.CharField(max_length=7)
    icon = models.CharField(max_length=50)
    budget_limit = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    is_system = models.BooleanField(default=False)

    class Meta:
        app_label = 'analytics'
        unique_together = ['user', 'slug']
        verbose_name_plural = 'categories'

    def __str__(self):
        return self.name


class MonthlySummary(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='summaries')
    month = models.DateField()
    total_income = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_expenses = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    net_savings = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    savings_rate = models.FloatField(default=0)
    top_category = models.CharField(max_length=50, blank=True)
    top_category_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True)
    category_breakdown = models.JSONField(default=dict)
    ai_insight = models.TextField(blank=True)
    insight_generated_at = models.DateTimeField(null=True, blank=True)
    computed_at = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = 'analytics'
        unique_together = ['user', 'month']
        ordering = ['-month']

    def __str__(self):
        return f"{self.user.email} — {self.month}"


class BudgetAlert(models.Model):
    ALERT_TYPES = [('warning', 'Warning'), ('exceeded', 'Exceeded')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='budget_alerts')
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    month = models.DateField()
    alert_type = models.CharField(max_length=20, choices=ALERT_TYPES)
    amount_spent = models.DecimalField(max_digits=12, decimal_places=2)
    budget_limit = models.DecimalField(max_digits=12, decimal_places=2)
    is_read = models.BooleanField(default=False)
    triggered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = 'analytics'