from django.core.management.base import BaseCommand
from apps.analytics.models import Category
from apps.transactions.categories import CATEGORIES

# Kept for the admin and older clients; the web app styles categories itself.
NEUTRAL = '#8A8B83'


class Command(BaseCommand):
    help = 'Create or refresh the default spending categories'

    def handle(self, *args, **kwargs):
        created_count = 0
        for cat_data in CATEGORIES:
            _, created = Category.objects.update_or_create(
                slug=cat_data['slug'],
                user=None,
                defaults={
                    'name': cat_data['name'],
                    'color': NEUTRAL,
                    'icon': cat_data['icon'],
                    'is_system': True,
                }
            )
            if created:
                created_count += 1

        self.stdout.write(f'Created {created_count} categories ({len(CATEGORIES) - created_count} refreshed)')
