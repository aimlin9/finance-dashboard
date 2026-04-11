from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.accounts.urls')),
    path('api/statements/', include('apps.statements.urls')),
    path('api/transactions/', include('apps.transactions.urls')),
]