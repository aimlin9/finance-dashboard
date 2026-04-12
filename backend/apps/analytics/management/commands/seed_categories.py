from django.core.management.base import BaseCommand
from apps.analytics.models import Category


class Command(BaseCommand):
    help = 'Create default spending categories'

    def handle(self, *args, **kwargs):
        categories = [
            {'name': 'Food & Dining', 'slug': 'food', 'color': '#10B981', 'icon': '🍔'},
            {'name': 'Transport', 'slug': 'transport', 'color': '#6366F1', 'icon': '🚗'},
            {'name': 'Utilities', 'slug': 'utilities', 'color': '#F59E0B', 'icon': '💡'},
            {'name': 'Entertainment', 'slug': 'entertainment', 'color': '#EC4899', 'icon': '🎬'},
            {'name': 'Health', 'slug': 'health', 'color': '#EF4444', 'icon': '🏥'},
            {'name': 'Shopping', 'slug': 'shopping', 'color': '#8B5CF6', 'icon': '🛍️'},
            {'name': 'Income', 'slug': 'income', 'color': '#22D3EE', 'icon': '💰'},
            {'name': 'Savings & Transfer', 'slug': 'savings', 'color': '#64748B', 'icon': '🏦'},
            {'name': 'Other', 'slug': 'other', 'color': '#94A3B8', 'icon': '📋'},
        ]

        created_count = 0
        for cat_data in categories:
            _, created = Category.objects.get_or_create(
                slug=cat_data['slug'],
                user=None,
                defaults={
                    'name': cat_data['name'],
                    'color': cat_data['color'],
                    'icon': cat_data['icon'],
                    'is_system': True,
                }
            )
            if created:
                created_count += 1

        self.stdout.write(f'Created {created_count} categories ({len(categories) - created_count} already existed)')