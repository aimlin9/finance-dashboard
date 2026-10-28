from datetime import date

from django.core.management import call_command
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.statements.models import BankStatement
from apps.transactions.models import Transaction
from .models import MonthlySummary
from .summarizer import compute_monthly_summary
from .utils import payee_name


class AnalyticsTestBase(APITestCase):
    def setUp(self):
        call_command('seed_categories', stdout=open('/dev/null', 'w'))
        self.user = User.objects.create_user('kojo@example.com', 'Kojo Mensah', 'Str0ng-pass-123')
        self.client.force_authenticate(self.user)
        self.statement = BankStatement.objects.create(user=self.user, file_name='s.csv', file_type='csv', status='done')

    def add(self, day, amount, tx_type='debit', category='food', description='SHOPRITE ACHIMOTA'):
        return Transaction.objects.create(
            user=self.user, statement=self.statement, date=day, amount=amount,
            type=tx_type, category=category, description=description,
        )


class MonthParamTest(AnalyticsTestBase):
    def test_bad_month_is_400_not_500(self):
        for url in ['/api/analytics/dashboard/?month=march', '/api/analytics/budget/?month=2026-13',
                    '/api/analytics/insights/?month=', '/api/transactions/?month=abc']:
            self.assertEqual(self.client.get(url).status_code, 400, url)


class DashboardTest(AnalyticsTestBase):
    def test_dashboard_includes_daily_payees_and_previous_month(self):
        self.add(date(2026, 2, 3), 100)
        self.add(date(2026, 3, 1), 3000, 'credit', 'income', 'SALARY MARCH')
        self.add(date(2026, 3, 2), 200)
        self.add(date(2026, 3, 2), 50, description='UBER TRIP 8823')
        for m in (date(2026, 2, 1), date(2026, 3, 1)):
            compute_monthly_summary(self.user, m)

        res = self.client.get('/api/analytics/dashboard/?month=2026-03')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['daily_spending'], [{'date': '2026-03-02', 'amount': 250.0}])
        self.assertEqual(res.data['top_payees'][0]['name'], 'Shoprite Achimota')
        self.assertEqual(res.data['previous']['total_expenses'], '100.00')
        self.assertEqual(sum(d['amount'] for d in res.data['weekday_spending']), 250.0)

    def test_trend_returns_all_months_oldest_first(self):
        self.add(date(2026, 3, 2), 200)
        self.add(date(2026, 1, 2), 100)
        for m in (date(2026, 1, 1), date(2026, 3, 1)):
            compute_monthly_summary(self.user, m)
        res = self.client.get('/api/analytics/trend/')
        self.assertEqual([r['month'] for r in res.data], ['2026-01-01', '2026-03-01'])

    def test_empty_month_summary_is_removed(self):
        tx = self.add(date(2026, 3, 2), 200)
        compute_monthly_summary(self.user, date(2026, 3, 1))
        tx.delete()
        self.assertIsNone(compute_monthly_summary(self.user, date(2026, 3, 1)))
        self.assertFalse(MonthlySummary.objects.filter(user=self.user).exists())


class InsightTest(AnalyticsTestBase):
    def test_failure_is_not_cached_as_insight(self):
        self.add(date(2026, 3, 2), 200)
        compute_monthly_summary(self.user, date(2026, 3, 1))
        with self.settings():
            import os
            os.environ.pop('GEMINI_API_KEY', None)
            res = self.client.get('/api/analytics/insights/?month=2026-03')
        self.assertEqual(res.status_code, 503)
        self.assertEqual(MonthlySummary.objects.get(user=self.user).ai_insight, '')


class BudgetTest(AnalyticsTestBase):
    def test_zero_spend_with_budget_reports_zero_progress(self):
        self.assertEqual(self.client.post('/api/analytics/budget/set/', {'category': 'transport', 'budget_limit': '300'}).status_code, 200)
        res = self.client.get('/api/analytics/budget/?month=2026-03')
        transport = next(c for c in res.data if c['slug'] == 'transport')
        self.assertEqual(transport['progress'], 0)
        self.assertNotIn('income', [c['slug'] for c in res.data])

    def test_invalid_budget_amount_rejected(self):
        for bad in ['abc', '-5', '0']:
            res = self.client.post('/api/analytics/budget/set/', {'category': 'food', 'budget_limit': bad})
            self.assertEqual(res.status_code, 400, bad)


class SavingsGoalTest(AnalyticsTestBase):
    def test_goal_completion_follows_amount_both_ways(self):
        goal = self.client.post('/api/analytics/savings-goals/', {'name': 'Laptop', 'target_amount': '1000'}).data
        url = f"/api/analytics/savings-goals/{goal['id']}/"
        self.assertTrue(self.client.patch(url, {'add_amount': '1000'}).data['is_completed'])
        self.assertFalse(self.client.patch(url, {'current_amount': '400'}).data['is_completed'])

    def test_monthly_needed_is_computed_for_deadline(self):
        goal = self.client.post('/api/analytics/savings-goals/', {
            'name': 'Rent advance', 'target_amount': '1200', 'deadline': '2099-01-01',
        }).data
        self.assertGreater(goal['months_left'], 0)
        self.assertLess(goal['monthly_needed'], 1200)

    def test_rejects_bad_input(self):
        self.assertEqual(self.client.post('/api/analytics/savings-goals/', {'name': 'X', 'target_amount': 'lots'}).status_code, 400)
        self.assertEqual(self.client.post('/api/analytics/savings-goals/', {'name': 'X', 'target_amount': '10', 'deadline': 'soon'}).status_code, 400)


class PayeeNameTest(APITestCase):
    def test_strips_noise_and_reference_numbers(self):
        self.assertEqual(payee_name('POS PURCHASE SHOPRITE ACHIMOTA 0029384'), 'Shoprite Achimota')
        self.assertEqual(payee_name('PAYMENT_SEND to KOFI MENSAH 233244'), 'Kofi Mensah')
        self.assertEqual(payee_name('0029384 *** 11'), 'Unlabelled')
