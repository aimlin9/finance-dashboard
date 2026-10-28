"""
Single source of truth for spending categories.

The frontend reads this list from GET /api/transactions/categories/ and the
seed_categories command uses it to create the system Category rows, so a
category only ever needs to be added here.

`icon` is a lucide-react icon name rendered by the frontend.
"""

CATEGORIES = [
    {'slug': 'food', 'name': 'Food & Groceries', 'icon': 'utensils'},
    {'slug': 'transport', 'name': 'Transport', 'icon': 'bus'},
    {'slug': 'utilities', 'name': 'Bills & Airtime', 'icon': 'zap'},
    {'slug': 'housing', 'name': 'Rent & Housing', 'icon': 'home'},
    {'slug': 'education', 'name': 'Education', 'icon': 'graduation-cap'},
    {'slug': 'health', 'name': 'Health', 'icon': 'heart-pulse'},
    {'slug': 'shopping', 'name': 'Shopping', 'icon': 'shopping-bag'},
    {'slug': 'entertainment', 'name': 'Entertainment', 'icon': 'clapperboard'},
    {'slug': 'giving', 'name': 'Church & Giving', 'icon': 'hand-heart'},
    {'slug': 'charges', 'name': 'Fees & Charges', 'icon': 'receipt'},
    {'slug': 'cash', 'name': 'Cash Withdrawal', 'icon': 'banknote'},
    {'slug': 'savings', 'name': 'Savings & Transfers', 'icon': 'piggy-bank'},
    {'slug': 'income', 'name': 'Income', 'icon': 'arrow-down-left'},
    {'slug': 'other', 'name': 'Other', 'icon': 'circle-dashed'},
]

CATEGORY_SLUGS = [c['slug'] for c in CATEGORIES]

# Categories that only make sense for money coming in.
CREDIT_ONLY = {'income'}
