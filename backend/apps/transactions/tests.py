from django.test import TestCase
from apps.transactions.categorizer import TransactionCategorizer


class CategorizerTest(TestCase):
    """Tests for the transaction categorizer."""

    def setUp(self):
        self.categorizer = TransactionCategorizer()

    def test_categorizes_food(self):
        cat, conf = self.categorizer.categorize('KFC OSTAMEL BRANCH POS PURCHASE')
        self.assertEqual(cat, 'food')
        self.assertEqual(conf, 1.0)

    def test_categorizes_transport(self):
        cat, conf = self.categorizer.categorize('UBER TRIP ACCRA')
        self.assertEqual(cat, 'transport')
        self.assertEqual(conf, 1.0)

    def test_categorizes_utilities(self):
        cat, conf = self.categorizer.categorize('ECG PREPAID PURCHASE')
        self.assertEqual(cat, 'utilities')
        self.assertEqual(conf, 1.0)

    def test_categorizes_income(self):
        cat, conf = self.categorizer.categorize('SALARY PAYMENT FROM EMPLOYER LTD')
        self.assertEqual(cat, 'income')
        self.assertEqual(conf, 1.0)

    def test_categorizes_savings(self):
        cat, conf = self.categorizer.categorize('VISA Card Top Up DMRWZZUZ')
        self.assertEqual(cat, 'savings')
        self.assertEqual(conf, 1.0)

    def test_categorizes_shopping(self):
        cat, conf = self.categorizer.categorize('ACCRA MALL ELECTRONICS STORE')
        self.assertEqual(cat, 'shopping')
        self.assertEqual(conf, 1.0)

    def test_categorizes_health(self):
        cat, conf = self.categorizer.categorize('KORLE BU HOSPITAL PAYMENT')
        self.assertEqual(cat, 'health')
        self.assertEqual(conf, 1.0)

    def test_categorizes_entertainment(self):
        cat, conf = self.categorizer.categorize('NETFLIX SUBSCRIPTION')
        self.assertEqual(cat, 'entertainment')
        self.assertEqual(conf, 1.0)

    def test_unknown_returns_other(self):
        cat, conf = self.categorizer.categorize('300304******0000 RANDOM REF')
        self.assertEqual(cat, 'other')
        self.assertEqual(conf, 0.5)

    def test_case_insensitive(self):
        cat, conf = self.categorizer.categorize('SHOPRITE accra MALL')
        self.assertEqual(cat, 'food')

    def test_bulk_categorize(self):
        transactions = [
            {'description': 'UBER TRIP'},
            {'description': 'KFC PURCHASE'},
            {'description': 'ECG PREPAID'},
        ]
        result = self.categorizer.categorize_bulk(transactions)
        self.assertEqual(result[0]['category'], 'transport')
        self.assertEqual(result[1]['category'], 'food')
        self.assertEqual(result[2]['category'], 'utilities')