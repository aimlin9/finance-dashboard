import logging

from django.db.models import Sum
from apps.transactions.models import Transaction
from .models import MonthlySummary

logger = logging.getLogger(__name__)


def compute_monthly_summary(user, month_date):
    """
    Aggregate all transactions for a given user and month.
    Creates or updates a MonthlySummary record.

    Args:
        user: User instance
        month_date: date object (first day of month, e.g. 2026-03-01)

    Returns:
        MonthlySummary instance, or None when the month has no transactions
        (its summary is removed so the month drops out of the month picker).
    """
    txns = Transaction.objects.filter(
        user=user,
        date__year=month_date.year,
        date__month=month_date.month,
    )

    if not txns.exists():
        MonthlySummary.objects.filter(user=user, month=month_date).delete()
        return None

    # Calculate totals
    income = txns.filter(type='credit').aggregate(
        total=Sum('amount')
    )['total'] or 0

    expenses = txns.filter(type='debit').aggregate(
        total=Sum('amount')
    )['total'] or 0

    net = income - expenses
    rate = (float(net) / float(income) * 100) if income else 0

    # Build category breakdown for debits only
    breakdown = {}
    category_totals = (
        txns.filter(type='debit')
        .values('category')
        .annotate(total=Sum('amount'))
    )
    for row in category_totals:
        breakdown[row['category']] = float(row['total'])

    # Find top spending category
    top_cat = max(breakdown, key=breakdown.get) if breakdown else ''
    top_amt = breakdown.get(top_cat, 0)

    # Create or update the summary
    summary, created = MonthlySummary.objects.update_or_create(
        user=user,
        month=month_date,
        defaults={
            'total_income': income,
            'total_expenses': expenses,
            'net_savings': net,
            'savings_rate': round(rate, 1),
            'top_category': top_cat,
            'top_category_amount': top_amt,
            'category_breakdown': breakdown,
        }
    )

    logger.info(
        '%s summary for %s: income=%s expenses=%s',
        'Created' if created else 'Updated', month_date, income, expenses,
    )

    return summary