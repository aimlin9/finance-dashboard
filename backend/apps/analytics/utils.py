import re
from datetime import date

from rest_framework.exceptions import ValidationError


def parse_month(value, param='month'):
    """'2026-03' (or '2026-03-01') -> date(2026, 3, 1). Raises a 400, not a 500, on bad input."""
    if not value:
        raise ValidationError({param: 'This query param is required (YYYY-MM).'})
    match = re.fullmatch(r'(\d{4})-(\d{1,2})(?:-\d{1,2})?', value.strip())
    if not match or not 1 <= int(match.group(2)) <= 12:
        raise ValidationError({param: 'Use the format YYYY-MM, e.g. 2026-03.'})
    return date(int(match.group(1)), int(match.group(2)), 1)


def previous_month(month_date):
    if month_date.month == 1:
        return date(month_date.year - 1, 12, 1)
    return date(month_date.year, month_date.month - 1, 1)


# Words that say how money moved rather than who it went to.
NOISE_WORDS = {
    'pos', 'purchase', 'payment', 'pmt', 'to', 'from', 'ref', 'trf', 'trx', 'txn',
    'transfer', 'debit', 'credit', 'card', 'visa', 'mastercard', 'momo', 'mobile',
    'money', 'online', 'web', 'via', 'for', 'at', 'the', 'and', 'acct', 'account',
    'branch', 'gh', 'ghs', 'accra', 'kumasi', 'ltd', 'limited', 'send',
}


def payee_name(description):
    """
    Best-effort payee from a raw bank description:
    'POS PURCHASE SHOPRITE ACHIMOTA 0029384' -> 'Shoprite Achimota'.
    Used to group spending by who received it.
    """
    words = re.sub(r'[_/*#:.,-]+', ' ', (description or '').lower()).split()
    kept = [w for w in words if w not in NOISE_WORDS and not any(ch.isdigit() for ch in w) and len(w) > 1]
    if not kept:
        return 'Unlabelled'
    return ' '.join(kept[:3]).title()
