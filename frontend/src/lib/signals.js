import { category } from './categories';
import { toNumber } from './format';

/**
 * Plain, checkable observations computed from the user's own numbers.
 * Each has a tone ('good' | 'watch' | 'info') that the UI pairs with an
 * icon and words, never colour alone.
 */
export function computeSignals(summary, format) {
  if (!summary) return [];
  const signals = [];
  const income = toNumber(summary.total_income);
  const expenses = toNumber(summary.total_expenses);
  const breakdown = summary.category_breakdown || {};

  // 1. Savings rate
  if (income > 0) {
    const rate = toNumber(summary.savings_rate);
    if (rate >= 20) {
      signals.push({ tone: 'good', title: `You kept ${Math.round(rate)}% of what came in`, body: 'Above the 20% many planners aim for.' });
    } else if (rate < 0) {
      signals.push({ tone: 'watch', title: `You spent ${format(expenses - income)} more than came in`, body: 'Money out exceeded money in this month.' });
    } else if (rate < 10) {
      signals.push({ tone: 'watch', title: `Only ${Math.round(rate)}% of income was left over`, body: 'A budget on your top category is the quickest lever.' });
    }
  }

  // 2. Fees, charges and E-levy
  const fees = toNumber(breakdown.charges);
  if (fees > 0 && expenses > 0) {
    signals.push({
      tone: fees / expenses > 0.02 ? 'watch' : 'info',
      title: `${format(fees)} went on fees and charges`,
      body: `${((fees / expenses) * 100).toFixed(1)}% of spending: SMS alerts, E-levy, account fees.`,
    });
  }

  // 3. Cash is a blind spot
  const cash = toNumber(breakdown.cash);
  if (expenses > 0 && cash / expenses > 0.15) {
    signals.push({
      tone: 'info',
      title: `${Math.round((cash / expenses) * 100)}% of spending was cash withdrawals`,
      body: "Cash leaves no trail. Paying by MoMo or card shows where it actually went.",
    });
  }

  // 4. Biggest mover vs last month (needs the previous month's breakdown)
  if (summary.previousBreakdown) {
    let best = null;
    for (const slug of new Set([...Object.keys(breakdown), ...Object.keys(summary.previousBreakdown)])) {
      const change = toNumber(breakdown[slug]) - toNumber(summary.previousBreakdown[slug]);
      if (!best || Math.abs(change) > Math.abs(best.change)) best = { slug, change };
    }
    if (best && Math.abs(best.change) >= 20) {
      const up = best.change > 0;
      signals.push({
        tone: up ? 'watch' : 'good',
        title: `${category(best.slug).name} ${up ? 'up' : 'down'} ${format(Math.abs(best.change))}`,
        body: 'The biggest change from last month.',
      });
    }
  }

  // 5. Concentration
  const top = Object.entries(breakdown).sort((a, b) => b[1] - a[1])[0];
  if (top && expenses > 0 && top[1] / expenses > 0.4 && top[0] !== 'savings') {
    signals.push({
      tone: 'info',
      title: `${category(top[0]).name} took ${Math.round((top[1] / expenses) * 100)}% of spending`,
      body: 'Most of your money went to one place.',
    });
  }

  return signals.slice(0, 4);
}

/** Split Gemini's reply into clean lines (it sometimes adds bullets or numbering). */
export function insightLines(text) {
  return (text || '')
    .split('\n')
    .map((l) => l.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '').trim())
    .filter(Boolean);
}
