import { differenceInCalendarDays } from 'date-fns';
import { useQuery } from '../lib/query';
import { parseDate } from '../lib/format';
import useMonths from './useMonths';

export default function useAlerts() {
  const { month } = useMonths();
  const budgets = useQuery(month ? `/analytics/budget/?month=${month}` : null);
  const recurring = useQuery('/transactions/recurring/');
  const today = new Date();

  const budgetAlerts = (budgets.data || []).filter((b) => b.status !== 'ok');
  const upcoming = (recurring.data || []).filter((r) => {
    if (!r.next_expected || r.type !== 'debit') return false;
    const days = differenceInCalendarDays(parseDate(r.next_expected), today);
    return days >= 0 && days <= 10;
  });
  return { month, budgetAlerts, upcoming };
}

export function useAlertCount() {
  const { budgetAlerts, upcoming } = useAlerts();
  return budgetAlerts.length + upcoming.length;
}
