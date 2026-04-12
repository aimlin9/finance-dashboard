from datetime import date
from django.db import models
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import MonthlySummary, Category
from .summarizer import compute_monthly_summary
from .ai_insights import generate_insight


class DashboardView(APIView):
    """GET /api/analytics/dashboard/?month=2026-03"""

    def get(self, request):
        month_str = request.query_params.get('month')
        if not month_str:
            return Response({'detail': 'month query param required (YYYY-MM).'}, status=400)

        year, m = month_str.split('-')
        month_date = date(int(year), int(m), 1)

        # Compute summary if it doesn't exist yet
        summary = MonthlySummary.objects.filter(
            user=request.user, month=month_date
        ).first()

        if not summary:
            summary = compute_monthly_summary(request.user, month_date)

        return Response({
            'month': str(summary.month),
            'total_income': str(summary.total_income),
            'total_expenses': str(summary.total_expenses),
            'net_savings': str(summary.net_savings),
            'savings_rate': summary.savings_rate,
            'top_category': summary.top_category,
            'top_category_amount': str(summary.top_category_amount),
            'category_breakdown': summary.category_breakdown,
            'ai_insight': summary.ai_insight,
        })


class MonthlyListView(APIView):
    """GET /api/analytics/monthly/ — All available months."""

    def get(self, request):
        months = (
            MonthlySummary.objects
            .filter(user=request.user)
            .values_list('month', flat=True)
        )
        return Response({'months': [str(m) for m in months]})


class InsightsView(APIView):
    """GET /api/analytics/insights/?month=2026-03 — Generate AI insight."""

    def get(self, request):
        month_str = request.query_params.get('month')
        if not month_str:
            return Response({'detail': 'month query param required.'}, status=400)

        year, m = month_str.split('-')
        month_date = date(int(year), int(m), 1)

        summary = MonthlySummary.objects.filter(
            user=request.user, month=month_date
        ).first()

        if not summary:
            return Response({'detail': 'No data for this month.'}, status=404)

        # Generate insight if not already done
        if not summary.ai_insight:
            from django.utils import timezone
            summary.ai_insight = generate_insight(summary)
            summary.insight_generated_at = timezone.now()
            summary.save()

        return Response({
            'month': str(summary.month),
            'insight': summary.ai_insight,
        })


class CompareView(APIView):
    """GET /api/analytics/compare/?month1=2026-02&month2=2026-03"""

    def get(self, request):
        month1_str = request.query_params.get('month1')
        month2_str = request.query_params.get('month2')

        if not month1_str or not month2_str:
            return Response({'detail': 'month1 and month2 params required.'}, status=400)

        y1, m1 = month1_str.split('-')
        y2, m2 = month2_str.split('-')

        sum1 = MonthlySummary.objects.filter(
            user=request.user, month=date(int(y1), int(m1), 1)
        ).first()
        sum2 = MonthlySummary.objects.filter(
            user=request.user, month=date(int(y2), int(m2), 1)
        ).first()

        if not sum1 or not sum2:
            return Response({'detail': 'Data not available for one or both months.'}, status=404)

        return Response({
            'month1': {
                'month': str(sum1.month),
                'total_income': str(sum1.total_income),
                'total_expenses': str(sum1.total_expenses),
                'net_savings': str(sum1.net_savings),
                'category_breakdown': sum1.category_breakdown,
            },
            'month2': {
                'month': str(sum2.month),
                'total_income': str(sum2.total_income),
                'total_expenses': str(sum2.total_expenses),
                'net_savings': str(sum2.net_savings),
                'category_breakdown': sum2.category_breakdown,
            },
        })