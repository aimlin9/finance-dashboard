import json
from decouple import config
from google import genai


def generate_insight(summary):
    """
    Send monthly summary data to Gemini and get back
    3 plain-English financial insights.
    """
    api_key = config('GEMINI_API_KEY', default='')
    if not api_key:
        return 'AI insights unavailable — no API key configured.'

    client = genai.Client(api_key=api_key)

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

Rules:
- Start each insight with an emoji
- Be specific about numbers and categories
- Suggest practical ways to save money in Ghana
- If savings rate is above 20%, praise them
- If savings rate is below 10%, gently flag it
"""

    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        return response.text
    except Exception as e:
        return f'AI insight generation failed: {str(e)}' 