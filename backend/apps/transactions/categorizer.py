import os
import spacy


class TransactionCategorizer:
    """
    Categorizes transactions using two layers:
    1. Keyword rules (fast, 100% confidence)
    2. spaCy NLP classifier (catches what keywords miss)
    """

    RULES = {
        'food': [
            'shoprite', 'melcom food', 'pizza', 'kfc', 'restaurant',
            'chop bar', 'food', 'groceries', 'bakery', 'cafe',
            'chicken', 'burger', 'kitchen', 'eatery', 'canteen',
            'papaye',
        ],
        'transport': [
            'uber', 'bolt', 'trotro', 'fuel', 'petrol', 'goil',
            'total filling', 'shell', 'taxi', 'bus', 'transport',
            'parking', 'toll',
        ],
        'utilities': [
            'ecg', 'ghana water', 'mtn bill', 'vodafone', 'airtel',
            'dstv', 'startimes', 'gotv', 'electricity', 'water bill',
            'internet', 'wifi', 'prepaid',
        ],
        'entertainment': [
            'netflix', 'cinema', 'spotify', 'youtube', 'showmax',
            'club', 'bar', 'lounge', 'games', 'betting',
        ],
        'health': [
            'pharmacy', 'clinic', 'hospital', 'medical', 'lab',
            'doctor', 'dental', 'optician', 'drug store', 'nhis',
        ],
        'shopping': [
            'melcom', 'jumia', 'accra mall', 'clothing', 'electronics',
            'market', 'shop', 'store', 'purchase', 'pos',
        ],
        'income': [
            'salary', 'payroll', 'transfer in', 'credit alert',
            'momo received', 'payment received', 'deposit',
            'employer', 'wage',
        ],
        'savings': [
            'bank transfer', 'mobile money send', 'savings deposit',
            'momo transfer', 'visa card top up',
        ],
    }

    # Minimum confidence to trust the NLP model
    NLP_THRESHOLD = 0.6

    def __init__(self):
        self.nlp_model = None
        model_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
            'models', 'categorizer'
        )
        if os.path.exists(model_path):
            try:
                self.nlp_model = spacy.load(model_path)
            except Exception:
                pass  # Fall back to keywords only

    def categorize(self, description):
        """
        Categorize a single transaction description.
        Returns (category, confidence) tuple.
        """
        desc_lower = description.lower()

        # Layer 1: Keyword rules (100% confidence)
        for category, keywords in self.RULES.items():
            if any(kw in desc_lower for kw in keywords):
                return category, 1.0

        # Layer 2: spaCy NLP classifier
        if self.nlp_model:
            doc = self.nlp_model(description)
            best_cat = max(doc.cats, key=doc.cats.get)
            confidence = doc.cats[best_cat]

            if confidence >= self.NLP_THRESHOLD:
                return best_cat, round(confidence, 2)

        # Nothing matched with enough confidence
        return 'other', 0.5

    def categorize_bulk(self, transactions):
        """
        Categorize a list of transaction dicts in place.
        Adds 'category' and 'category_confidence' to each dict.
        """
        for tx in transactions:
            category, confidence = self.categorize(tx.get('description', ''))
            tx['category'] = category
            tx['category_confidence'] = confidence
        return transactions