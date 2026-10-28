import { Link } from 'react-router-dom';
import { AlertTriangle, CalendarClock, OctagonAlert, BellOff } from 'lucide-react';
import { Sheet } from './ui';
import { category } from '../lib/categories';
import { date, percent } from '../lib/format';
import useAlerts from '../hooks/useAlerts';
import useMoney from '../hooks/useMoney';

export default function Notifications({ open, onOpenChange }) {
  const { budgetAlerts, upcoming } = useAlerts();
  const format = useMoney();
  const close = () => onOpenChange(false);
  const empty = !budgetAlerts.length && !upcoming.length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Alerts" description="Budgets near their limit and bills coming up.">
      {empty ? (
        <div className="flex flex-col items-center py-12 text-center">
          <BellOff size={28} className="text-ink-3" />
          <p className="mt-3 text-sm font-medium text-ink">All quiet</p>
          <p className="mt-1 max-w-xs text-sm text-ink-3">Set budgets to get warned at 80% of a limit. Recurring bills show here 10 days ahead.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {budgetAlerts.length > 0 && (
            <section>
              <p className="eyebrow mb-2">Budgets</p>
              <ul className="space-y-2">
                {budgetAlerts.map((b) => {
                  const over = b.status === 'exceeded';
                  const Icon = over ? OctagonAlert : AlertTriangle;
                  return (
                    <li key={b.slug}>
                      <Link to="/budget" onClick={close} className="flex items-start gap-3 rounded-2xl border border-line p-3.5 hover:bg-surface-2">
                        <span className={`mt-0.5 ${over ? 'text-neg' : 'text-warn'}`}><Icon size={18} /></span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium text-ink">
                            {category(b.slug).name} {over ? 'is over budget' : 'is close to its limit'}
                          </span>
                          <span className="num mt-0.5 block text-[13px] text-ink-3">
                            {format(b.amount_spent)} of {format(b.budget_limit)} · {percent(b.progress)}
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
          {upcoming.length > 0 && (
            <section>
              <p className="eyebrow mb-2">Coming up</p>
              <ul className="space-y-2">
                {upcoming.map((r) => (
                  <li key={r.description}>
                    <Link to="/recurring" onClick={close} className="flex items-start gap-3 rounded-2xl border border-line p-3.5 hover:bg-surface-2">
                      <span className="mt-0.5 text-ink-2"><CalendarClock size={18} /></span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-ink">{r.description}</span>
                        <span className="num mt-0.5 block text-[13px] text-ink-3">
                          About {format(r.average_amount)} expected {date(r.next_expected, 'EEE d MMM')}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </Sheet>
  );
}
