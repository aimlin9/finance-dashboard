from django.contrib import admin
from django.urls import path, include

from .health import health

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', health, name='health'),
    path('api/auth/', include('apps.accounts.urls')),
    path('api/statements/', include('apps.statements.urls')),
    path('api/transactions/', include('apps.transactions.urls')),
    path('api/analytics/', include('apps.analytics.urls')),
]