import json
import logging
import os

from google import genai

logger = logging.getLogger(__name__)


class InsightUnavailable(Exception):
    """Raised instead of returning an error string, so failures are never saved as advice."""


def generate_insight(summary, previous=None):
    """
    Send monthly summary data to Gemini and get back
    3 plain-English financial insights.
    """
    api_key = os.environ.get('GEMINI_API_KEY', '')
    if not api_key:
        raise InsightUnavailable('AI insights are not configured on this server.')

    client = genai.Client(api_key=api_key)

    comparison = ''
    if previous:
        comparison = f"""
Previous month ({previous.month.strftime('%B %Y')}) for comparison:
- Income: GHS {previous.total_income}
- Expenses: GHS {previous.total_expenses}
- Spending breakdown: {json.dumps(previous.category_breakdown)}
"""

    prompt = f"""
You are a friendly personal finance advisor for someone in Ghana.
Analyze this spending summary for {summary.month.strftime('%B %Y')}
and give exactly 3 specific, actionable insights.

Keep each insight to 1-2 sentences. Be encouraging but honest.
Use Ghana cedis (GHS) for all amounts.

Summary:
- Total income: GHS {summary.total_income}
- Total expenses: GHS {summary.total_expenses}
- Net savings: GHS {summary.net_savings} ({summary.savings_rate:.1f}%)
- Spending breakdown: {json.dumps(summary.category_breakdown)}
{comparison}
Rules:
- Output exactly 3 lines, one insight per line, no numbering, no bullets, no emoji
- Be specific about numbers and categories
- Where a previous month is given, mention the most meaningful change
- Suggest practical ways to save money in Ghana
- If savings rate is above 20%, praise them
- If savings rate is below 10%, gently flag it
- "savings" in the breakdown means savings and transfers out, not necessarily saved money
"""

    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
    except Exception:
        logger.exception('Gemini request failed')
        raise InsightUnavailable('The AI service did not respond. Try again in a minute.')

    text = (response.text or '').strip()
    if not text:
        raise InsightUnavailable('The AI service returned an empty answer. Try again.')
    return text
