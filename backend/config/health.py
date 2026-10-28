from django.db import connection
from django.http import JsonResponse


def health(request):
    """GET /api/health/ — Public liveness check for the host and for waking a sleeping server."""
    try:
        connection.ensure_connection()
        database = 'ok'
    except Exception:
        database = 'unavailable'
    return JsonResponse({'status': 'ok', 'database': database}, status=200 if database == 'ok' else 503)
