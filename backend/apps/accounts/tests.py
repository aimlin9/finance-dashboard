from django.core import mail
from django.test import override_settings
from rest_framework.test import APITestCase

from .models import User


class AuthFlowTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user('ama@example.com', 'Ama Owusu', 'Str0ng-pass-123')

    def login(self):
        self.client.force_authenticate(self.user)

    def test_register_rejects_duplicate_email_case_insensitively(self):
        res = self.client.post('/api/auth/register/', {
            'email': 'AMA@example.com', 'full_name': 'Ama', 'password': 'An0ther-pass-99',
            'password_confirm': 'An0ther-pass-99',
        })
        self.assertEqual(res.status_code, 400)
        self.assertIn('email', res.data)

    @override_settings(DEBUG=False)
    def test_password_reset_does_not_leak_link_or_account_existence(self):
        known = self.client.post('/api/auth/password-reset/', {'email': 'ama@example.com'})
        unknown = self.client.post('/api/auth/password-reset/', {'email': 'nobody@example.com'})
        self.assertEqual(known.status_code, 200)
        self.assertEqual(known.data, unknown.data)
        self.assertNotIn('reset_url', known.data)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn('/reset-password?uid=', mail.outbox[0].body)

    def test_change_password_requires_current_password(self):
        self.login()
        res = self.client.post('/api/auth/password/change/', {
            'current_password': 'wrong', 'new_password': 'Brand-new-pass-77',
        })
        self.assertEqual(res.status_code, 400)
        res = self.client.post('/api/auth/password/change/', {
            'current_password': 'Str0ng-pass-123', 'new_password': 'Brand-new-pass-77',
        })
        self.assertEqual(res.status_code, 200)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('Brand-new-pass-77'))

    def test_delete_account_needs_password(self):
        self.login()
        self.assertEqual(self.client.post('/api/auth/delete-account/', {'password': 'nope'}).status_code, 400)
        self.assertEqual(self.client.post('/api/auth/delete-account/', {'password': 'Str0ng-pass-123'}).status_code, 204)
        self.assertFalse(User.objects.filter(email='ama@example.com').exists())

    def test_profile_rejects_unknown_currency(self):
        self.login()
        self.assertEqual(self.client.patch('/api/auth/me/', {'currency': 'XYZ'}).status_code, 400)
        self.assertEqual(self.client.patch('/api/auth/me/', {'currency': 'USD'}).status_code, 200)
