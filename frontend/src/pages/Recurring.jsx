import { CalendarClock, Repeat } from 'lucide-react';
import { differenceInCalendarDays } from 'date-fns';
import { useQuery } from '../lib/query';
import { date, parseDate, plural, toNumber } from '../lib/format';
import useMoney from '../hooks/useMoney';
import { Badge, Button, Card, CategoryIcon, EmptyState, ErrorState, PageHeader, PageSkeleton } from '../components/ui';

const PER_YEAR = { weekly: 52, fortnightly: 26, monthly: 12 };

function when(next) {
  if (!next) return null;
  const days = differenceInCalendarDays(parseDate(next), new Date());
  if (days < -3) return { text: `was due ${date(next, 'd MMM')}`, tone: 'neutral' };
  if (days < 0) return { text: 'due about now', tone: 'warn' };
  if (days === 0) return { text: 'due today', tone: 'warn' };
  if (days <= 7) return { text: `in ${plural(days, 'day')}`, tone: 'warn' };
  return { text: date(next, 'd MMM'), tone: 'neutral' };
}

function Row({ r }) {
  const format = useMoney();
  const due = when(r.next_expected);
  const yearly = PER_YEAR[r.cadence] ? toNumber(r.average_amount) * PER_YEAR[r.cadence] : null;
  return (
    <li className="flex items-center gap-3 py-3.5">
      <CategoryIcon slug={r.category} size={40} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{r.description}</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-3">
          <span className="capitalize">{r.cadence}</span>
          <span aria-hidden>·</span>
          <span>{plural(r.count, 'payment')} since {date(r.first_seen, 'MMM yyyy')}</span>
          {due && <Badge tone={due.tone === 'warn' ? 'warn' : 'neutral'} icon={CalendarClock}>Next {due.text}</Badge>}
        </p>
      </div>
      <div className="text-right">
        <p className="num text-sm font-semibold text-ink">{format(r.average_amount)}</p>
        {yearly && <p className="num text-xs text-ink-3">≈ {format(yearly, { decimals: 0 })}/yr</p>}
      </div>
    </li>
  );
}

export default function Recurring() {
  const format = useMoney();
  const { data, loading, error, refetch } = useQuery('/transactions/recurring/');
  if (loading) return <PageSkeleton />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  const bills = (data || []).filter((r) => r.type === 'debit');
  const incoming = (data || []).filter((r) => r.type === 'credit');
  const monthly = bills.reduce((s, r) => s + (PER_YEAR[r.cadence] ? (toNumber(r.average_amount) * PER_YEAR[r.cadence]) / 12 : 0), 0);

  return (
    <div>
      <PageHeader
        eyebrow="Insight"
        title="Recurring payments"
        description="Payments to the same payee across several months: rent, data bundles, subscriptions, transfers home."
      />

      {!data?.length ? (
        <div className="card">
          <EmptyState title="Nothing repeating yet" action={<Button to="/upload">Upload another month</Button>}>
            A payment counts as recurring once it appears in at least two different months.
          </EmptyState>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr]">
          <Card eyebrow={`${bills.length} found`} title="Going out">
            {bills.length ? <ul className="divide-y divide-line">{bills.map((r) => <Row key={r.description} r={r} />)}</ul> : <p className="text-sm text-ink-3">None found.</p>}
          </Card>
          <div className="space-y-6">
            <div className="card p-6">
              <Repeat size={20} className="text-accent" />
              <p className="eyebrow mt-4">Committed each month</p>
              <p className="display num mt-2 text-[40px] leading-none tracking-[-0.03em] text-ink">{format(monthly, { decimals: 0 })}</p>
              <p className="mt-3 text-[13px] leading-relaxed text-ink-3">
                The monthly cost of payments with a regular weekly, fortnightly or monthly rhythm. Irregular repeats aren't counted.
              </p>
            </div>
            {incoming.length > 0 && (
              <Card eyebrow="Coming in" title="Regular income">
                <ul className="divide-y divide-line">{incoming.map((r) => <Row key={r.description} r={r} />)}</ul>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
