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

class CategorizerRegressionTest(TestCase):
    """Bugs from substring matching and the over-confident NLP layer."""

    def setUp(self):
        self.categorizer = TransactionCategorizer()

    def test_keywords_match_whole_words_only(self):
        # 'deposit' used to match 'pos' (shopping), 'business' matched 'bus' (transport)
        self.assertEqual(self.categorizer.categorize('CASH DEPOSIT', 'credit')[0], 'income')
        self.assertNotEqual(self.categorizer.categorize('BUSINESS CENTRE', 'debit')[0], 'transport')

    def test_gibberish_is_other_not_a_confident_guess(self):
        self.assertEqual(self.categorizer.categorize('QWERTY ZXCV', 'debit'), ('other', 0.5))

    def test_debits_are_never_income(self):
        self.assertNotEqual(self.categorizer.categorize('SALARY ADVANCE REPAYMENT', 'debit')[0], 'income')

    def test_credits_default_to_income(self):
        self.assertEqual(self.categorizer.categorize('300304 JOHN DOE REF 0736', 'credit')[0], 'income')

    def test_ghana_specific_categories(self):
        cases = {
            'E-LEVY CHARGE': 'charges', 'CASH_OUT AGENT 2201': 'cash', 'SCHOOL FEES KNUST': 'education',
            'TITHE PAYMENT': 'giving', 'BOLT FOOD ORDER': 'food', 'TELECEL AIRTIME': 'utilities',
        }
        for description, expected in cases.items():
            self.assertEqual(self.categorizer.categorize(description, 'debit')[0], expected, description)

    def test_user_rules_win(self):
        categorizer = TransactionCategorizer(user_rules=[('kofi mensah', 'housing')])
        self.assertEqual(categorizer.categorize('TRANSFER TO KOFI MENSAH', 'debit'), ('housing', 1.0))


from datetime import date  # noqa: E402

from django.core.files.uploadedfile import SimpleUploadedFile  # noqa: E402
from rest_framework.test import APITestCase  # noqa: E402

from apps.accounts.models import User  # noqa: E402
from apps.analytics.models import MonthlySummary  # noqa: E402
from apps.transactions.models import Transaction, CategoryRule  # noqa: E402

CSV = (
    'Date,Debit,Credit,Balance,Remarks\n'
    '2026-03-01,,3000.00,3000.00,SALARY MARCH EMPLOYER\n'
    '2026-03-02,45.00,,2955.00,TRANSFER TO KOFI MENSAH 2331\n'
    '2026-03-03,45.00,,2910.00,TRANSFER TO KOFI MENSAH 2398\n'
    '2026-03-04,120.00,,2790.00,SHOPRITE ACHIMOTA\n'
)


class UploadAndEditTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user('esi@example.com', 'Esi Asante', 'Str0ng-pass-123')
        self.client.force_authenticate(self.user)

    def upload(self, content=CSV, name='gcb_march.csv'):
        return self.client.post('/api/statements/upload/', {
            'file': SimpleUploadedFile(name, content.encode('utf-8'), content_type='text/csv'),
        }, format='multipart')

    def test_upload_with_excel_bom(self):
        res = self.upload('﻿' + CSV)
        self.assertEqual(res.status_code, 201, res.data)
        self.assertEqual(res.data['total_transactions'], 4)

    def test_reupload_skips_duplicates(self):
        self.upload()
        res = self.upload()
        self.assertEqual(res.data['total_transactions'], 0)
        self.assertEqual(res.data['duplicates_skipped'], 4)
        self.assertEqual(Transaction.objects.filter(user=self.user).count(), 4)

    def test_unreadable_csv_fails_with_helpful_message(self):
        res = self.upload('hello,world\n1,2\n', name='notes.csv')
        self.assertEqual(res.status_code, 400)
        self.assertIn('any transactions', res.data['error'])

    def test_category_edit_refreshes_summary_and_learns_rule(self):
        self.upload()
        tx = Transaction.objects.get(description='TRANSFER TO KOFI MENSAH 2331')
        res = self.client.patch(f'/api/transactions/{tx.id}/edit/', {
            'category': 'housing', 'apply_to_similar': True, 'remember': True,
        }, format='json')
        self.assertEqual(res.status_code, 200, res.data)
        self.assertEqual(res.data['updated_similar'], 1)
        self.assertEqual(res.data['rule']['pattern'], 'kofi mensah')

        summary = MonthlySummary.objects.get(user=self.user, month=date(2026, 3, 1))
        self.assertEqual(summary.category_breakdown.get('housing'), 90.0)

        # The rule applies to the next upload
        self.upload(CSV.replace('2026-03', '2026-04'), name='gcb_april.csv')
        april = Transaction.objects.get(description='TRANSFER TO KOFI MENSAH 2331', date__month=4)
        self.assertEqual(april.category, 'housing')

    def test_rejects_unknown_category(self):
        self.upload()
        tx = Transaction.objects.first()
        res = self.client.patch(f'/api/transactions/{tx.id}/edit/', {'category': 'yachts'}, format='json')
        self.assertEqual(res.status_code, 400)

    def test_page_size_and_filters(self):
        self.upload()
        res = self.client.get('/api/transactions/?page_size=2&type=debit&ordering=-amount')
        self.assertEqual(res.data['count'], 3)
        self.assertEqual(len(res.data['results']), 2)
        self.assertEqual(res.data['results'][0]['amount'], '120.00')
        res = self.client.get('/api/transactions/?min_amount=100&date_from=2026-03-02')
        self.assertEqual(res.data['count'], 1)

    def test_bulk_categorize(self):
        self.upload()
        ids = [str(t.id) for t in Transaction.objects.filter(type='debit')]
        res = self.client.post('/api/transactions/bulk-categorize/', {'ids': ids, 'category': 'other'}, format='json')
        self.assertEqual(res.data['updated'], 3)

    def test_recurring_groups_by_payee_across_months(self):
        self.upload()
        self.upload(CSV.replace('2026-03', '2026-04'), name='gcb_april.csv')
        res = self.client.get('/api/transactions/recurring/')
        names = [r['description'] for r in res.data]
        self.assertIn('Kofi Mensah', names)

    def test_users_cannot_see_each_others_data(self):
        self.upload()
        other = User.objects.create_user('x@example.com', 'X', 'Str0ng-pass-123')
        self.client.force_authenticate(other)
        self.assertEqual(self.client.get('/api/transactions/').data['count'], 0)
        tx = Transaction.objects.filter(user=self.user).first()
        self.assertEqual(self.client.patch(f'/api/transactions/{tx.id}/edit/', {'category': 'food'}, format='json').status_code, 404)
