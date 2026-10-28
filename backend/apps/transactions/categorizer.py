import os
import re

import spacy

from .categories import CATEGORY_SLUGS, CREDIT_ONLY


def normalize(text):
    """Lowercase and turn separators (MoMo uses CASH_OUT, TRANSFER-IN...) into spaces."""
    text = (text or '').lower()
    text = re.sub(r'[_\-/\\|,.:;()#*]+', ' ', text)
    return ' '.join(text.split())


def keyword_pattern(keyword):
    """Match a keyword as whole words, so 'pos' no longer matches 'deposit'."""
    return re.compile(r'(?<![a-z0-9])' + re.escape(normalize(keyword)) + r'(?![a-z0-9])')


class TransactionCategorizer:
    """
    Categorizes transactions in four layers:
    1. The user's own rules, learned from their manual corrections
    2. Keyword rules (fast, 100% confidence), matched on whole words
    3. Direction: money coming in is income or a transfer, never "food"
    4. spaCy NLP classifier, trusted only for words it saw in training
    """

    # Checked in order: specific merchants before generic words, so
    # "BOLT FOOD" is food and "KFC POS PURCHASE" is not shopping.
    RULES = [
        ('food', [
            'shoprite', 'melcom food', 'pizza', 'pizzaman', 'kfc', 'restaurant',
            'chop bar', 'food', 'groceries', 'grocery', 'bakery', 'cafe', 'chicken',
            'burger', 'kitchen', 'eatery', 'canteen', 'papaye', 'marwako',
            'chicken republic', 'starbites', 'jumia food', 'bolt food', 'glovo',
            'max mart', 'maxmart', 'palace mall', 'koala', 'all needs', 'waakye',
            'kenkey', 'supermarket',
        ]),
        ('transport', [
            'uber', 'bolt', 'yango', 'trotro', 'fuel', 'petrol', 'diesel', 'goil',
            'total filling', 'totalenergies', 'total energies', 'star oil', 'puma',
            'shell', 'frimps', 'taxi', 'bus', 'stc', 'vip bus', 'intercity',
            'metro mass', 'transport', 'parking', 'toll', 'okada',
        ]),
        ('utilities', [
            'ecg', 'gwcl', 'ghana water', 'water bill', 'electricity', 'prepaid',
            'mtn bill', 'vodafone', 'telecel', 'airteltigo', 'airtel', 'airtime',
            'data bundle', 'bundle', 'internet', 'wifi', 'surfline', 'dstv', 'gotv',
            'startimes', 'multichoice',
        ]),
        ('housing', [
            'rent', 'landlord', 'house rent', 'estate', 'property', 'caretaker',
        ]),
        ('education', [
            'school fees', 'school', 'tuition', 'university', 'college', 'knust',
            'legon', 'wassce', 'waec', 'textbook', 'books', 'exam fee',
        ]),
        ('health', [
            'pharmacy', 'chemist', 'chemists', 'clinic', 'hospital', 'medical',
            'lab', 'laboratory', 'diagnostic', 'doctor', 'dental', 'optician',
            'optical', 'drug store', 'nhis',
        ]),
        ('entertainment', [
            'netflix', 'cinema', 'silverbird', 'spotify', 'apple music', 'boomplay',
            'audiomack', 'youtube', 'showmax', 'club', 'bar', 'lounge', 'games',
            'playstation', 'betting', 'sportybet', 'betway', '1xbet',
        ]),
        ('giving', [
            'church', 'tithe', 'offering', 'donation', 'funeral', 'wedding', 'welfare',
        ]),
        ('charges', [
            'e levy', 'elevy', 'bank charge', 'bank charges', 'sms alert',
            'sms charge', 'maintenance fee', 'service charge', 'stamp duty',
            'ledger fee', 'cot', 'commission', 'card fee', 'withholding tax',
        ]),
        ('cash', [
            'atm', 'cash out', 'cashout', 'cash withdrawal', 'withdrawal',
        ]),
        ('income', [
            'salary', 'payroll', 'wage', 'wages', 'allowance', 'stipend', 'bonus',
            'dividend', 'interest earned', 'refund', 'reversal', 'cash in',
            'momo received', 'payment received', 'credit alert', 'transfer in',
            'deposit', 'employer',
        ]),
        ('savings', [
            'savings', 'bank transfer', 'mobile money send', 'momo transfer',
            'visa card top up', 'card top up', 'fixed deposit', 'treasury bill',
            't bill', 'mutual fund', 'investment', 'susu', 'transfer',
        ]),
        ('shopping', [
            'melcom', 'jumia', 'game stores', 'accra mall', 'west hills',
            'kumasi mall', 'marina mall', 'franko', 'compu ghana', 'telefonika',
            'clothing', 'electronics', 'market', 'shop', 'store', 'purchase', 'pos',
        ]),
    ]

    # Minimum confidence to trust the NLP model
    NLP_THRESHOLD = 0.7

    def __init__(self, user_rules=None):
        """
        user_rules: iterable of (pattern, category) pairs, checked before
        everything else so a user's correction always wins.
        """
        self.compiled_rules = [
            (category, [keyword_pattern(kw) for kw in keywords])
            for category, keywords in self.RULES
        ]
        self.user_rules = [
            (keyword_pattern(pattern), category)
            for pattern, category in (user_rules or [])
            if normalize(pattern)
        ]

        self.nlp_model = None
        self.known_words = set()
        model_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
            'models', 'categorizer'
        )
        if os.path.exists(model_path):
            try:
                self.nlp_model = spacy.load(model_path)
                from .training_data import TRAIN_DATA
                for text, _ in TRAIN_DATA:
                    self.known_words.update(
                        w for w in normalize(text).split() if len(w) > 2 and w.isalpha()
                    )
            except Exception:
                self.nlp_model = None  # Fall back to keywords only

    def categorize(self, description, tx_type=None):
        """
        Categorize a single transaction description.
        tx_type ('credit' / 'debit') is optional but sharpens the result.
        Returns (category, confidence) tuple.
        """
        text = normalize(description)

        # Layer 1: the user's own corrections
        for pattern, category in self.user_rules:
            if pattern.search(text):
                return category, 1.0

        # Layer 2: keyword rules
        for category, patterns in self.compiled_rules:
            if tx_type == 'debit' and category in CREDIT_ONLY:
                continue
            if tx_type == 'credit' and category not in ('income', 'savings'):
                continue
            if any(p.search(text) for p in patterns):
                return category, 1.0

        # Layer 3: money in with no better signal is income
        if tx_type == 'credit':
            return 'income', 0.9

        # Layer 4: NLP, but only when the description shares vocabulary with
        # the training data. Without this guard the model is ~90% "confident"
        # about random reference numbers.
        if self.nlp_model and self._looks_familiar(text):
            doc = self.nlp_model(description)
            cats = {k: v for k, v in doc.cats.items() if k in CATEGORY_SLUGS}
            if tx_type == 'debit':
                cats = {k: v for k, v in cats.items() if k not in CREDIT_ONLY}
            if cats:
                best_cat = max(cats, key=cats.get)
                confidence = cats[best_cat]
                if confidence >= self.NLP_THRESHOLD:
                    return best_cat, round(confidence, 2)

        # Nothing matched with enough confidence
        return 'other', 0.5

    def _looks_familiar(self, text):
        return any(word in self.known_words for word in text.split())

    def categorize_bulk(self, transactions):
        """
        Categorize a list of transaction dicts in place.
        Adds 'category' and 'category_confidence' to each dict.
        """
        for tx in transactions:
            category, confidence = self.categorize(tx.get('description', ''), tx.get('type'))
            tx['category'] = category
            tx['category_confidence'] = confidence
        return transactions
