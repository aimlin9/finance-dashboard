import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowUpRight, CheckCircle2, Download, Eye, FileUp, Info, RefreshCw, Sparkles, TriangleAlert, UploadCloud,
} from 'lucide-react';
import { toast } from 'sonner';
import api, { errorMessage } from '../lib/api';
import { invalidate, useQuery } from '../lib/query';
import { date, firstName, greeting, monthLabel, toNumber } from '../lib/format';
import { computeSignals, insightLines } from '../lib/signals';
import useAuth from '../store/auth';
import useMonths from '../hooks/useMonths';
import useMoney from '../hooks/useMoney';
import {
  Button, Card, CategoryIcon, Delta, EmptyState, ErrorState, MonthSwitcher, PageSkeleton, Skeleton,
} from '../components/ui';
import CashflowChart from '../components/charts/CashflowChart';
import CategoryBreakdown from '../components/charts/CategoryBreakdown';
import SpendingCalendar from '../components/charts/SpendingCalendar';
import WeekdayChart from '../components/charts/WeekdayChart';
import Sparkline from '../components/charts/Sparkline';

const rise = {
  hidden: { opacity: 0, y: 12 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] } }),
};

function Onboarding({ name }) {
  return (
    <div className="mx-auto max-w-3xl py-6">
      <p className="eyebrow">Welcome</p>
      <h1 className="display mt-2 text-[36px] leading-tight text-ink sm:text-[46px]">Akwaaba, {name}.<br />Let's read your first statement.</h1>
      <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-ink-2">
        Download a statement from your bank or MoMo app and drop it here. FinTrack sorts every line into
        categories, so you'll see where the month went in about a minute.
      </p>
      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {[
          ['01', 'Get your statement', 'GCB, Ecobank or MTN MoMo as PDF or CSV, or a CSV export from any bank.'],
          ['02', 'Upload it here', 'Password-protected PDFs need unlocking first. Nothing is shared.'],
          ['03', 'Read your month', 'Categories, budgets, recurring bills and a plain-English summary.'],
        ].map(([n, title, body]) => (
          <div key={n} className="card p-5">
            <p className="font-mono text-xs text-gold">{n}</p>
            <p className="mt-3 font-medium text-ink">{title}</p>
            <p className="mt-1 text-sm leading-relaxed text-ink-3">{body}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button to="/upload" icon={UploadCloud} size="lg">Upload a statement</Button>
        <Button href="/sample-statement.csv" download variant="secondary" size="lg" icon={Download}>Get a sample statement</Button>
      </div>
    </div>
  );
}

function SignalIcon({ tone }) {
  if (tone === 'good') return <CheckCircle2 size={17} className="text-pos" aria-label="Good" />;
  if (tone === 'watch') return <TriangleAlert size={17} className="text-warn" aria-label="Worth watching" />;
  return <Info size={17} className="text-ink-3" aria-label="Note" />;
}

function AdvisorCard({ month, summary }) {
  const [loading, setLoading] = useState(false);
  const lines = insightLines(summary.ai_insight);

  const generate = async () => {
    setLoading(true);
    try {
      await api.get(`/analytics/insights/?month=${month}&force=true`);
      invalidate('/analytics/dashboard/');
      toast.success('Fresh advice is ready');
    } catch (error) {
      toast.error(errorMessage(error, "Couldn't generate advice right now."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      className="relative h-full"
      eyebrow={<span className="inline-flex items-center gap-1.5 text-gold"><Sparkles size={12} /> Advisor note</span>}
      title={`What to change after ${monthLabel(month, 'MMMM')}`}
      action={
        <Button variant="ghost" size="sm" icon={RefreshCw} loading={loading} onClick={generate}>
          {lines.length ? 'Refresh' : 'Generate'}
        </Button>
      }
    >
      {lines.length ? (
        <ol className="space-y-3.5">
          {lines.map((line, i) => (
            <li key={i} className="flex gap-3 text-[14px] leading-relaxed text-ink-2">
              <span className="num mt-0.5 font-mono text-xs text-gold">{String(i + 1).padStart(2, '0')}</span>
              <span>{line}</span>
            </li>
          ))}
        </ol>
      ) : (
        <div className="space-y-3">
          <p className="text-sm leading-relaxed text-ink-3">
            Get three specific suggestions based on this month's totals. Only the totals per category are sent to
            Google Gemini, never your individual transactions or account details.
          </p>
          {loading && <><Skeleton className="h-4 w-11/12" /><Skeleton className="h-4 w-9/12" /><Skeleton className="h-4 w-10/12" /></>}
        </div>
      )}
      {summary.insight_generated_at && lines.length > 0 && (
        <p className="mt-4 text-xs text-ink-3">Written {date(summary.insight_generated_at, "d MMM 'at' HH:mm")} · not financial advice</p>
      )}
    </Card>
  );
}

export default function Dashboard() {
  const user = useAuth((s) => s.user);
  const format = useMoney();
  const { months, month, setMonth, older, newer, loading: monthsLoading, hasData, error: monthsError, refetch } = useMonths();
  const summaryQ = useQuery(month ? `/analytics/dashboard/?month=${month}` : null);
  const trendQ = useQuery(hasData ? '/analytics/trend/' : null);
  const recurringQ = useQuery(hasData ? '/transactions/recurring/' : null);

  const summary = summaryQ.data;
  const trend = useMemo(() => trendQ.data || [], [trendQ.data]);

  const signals = useMemo(() => {
    if (!summary) return [];
    const prev = trend.find((t) => t.month === summary.previous?.month);
    return computeSignals({ ...summary, previousBreakdown: prev?.category_breakdown }, format);
  }, [summary, trend, format]);

  if (monthsError) return <ErrorState error={monthsError} onRetry={refetch} />;
  if (monthsLoading) return <PageSkeleton />;
  if (!hasData) return <Onboarding name={firstName(user?.full_name)} />;
  if (summaryQ.error) return <ErrorState error={summaryQ.error} onRetry={summaryQ.refetch} />;
  if (!summary) return <PageSkeleton />;

  const income = toNumber(summary.total_income);
  const expenses = toNumber(summary.total_expenses);
  const net = toNumber(summary.net_savings);
  const prev = summary.previous;
  const upToMonth = trend.filter((t) => t.month.slice(0, 7) <= month);
  const spark = (key) => upToMonth.slice(-6).map((t) => toNumber(t[key]));
  const recurring = (recurringQ.data || []).filter((r) => r.type === 'debit').slice(0, 4);
  const keptShare = income > 0 ? Math.max(0, Math.min(100, (net / income) * 100)) : 0;

  return (
    <div>
      <header className="mb-7 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow mb-2">Overview · {monthLabel(month)}</p>
          <h1 className="display text-[32px] leading-[1.06] text-ink sm:text-[42px]">
            {greeting()}, {firstName(user?.full_name)}.
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <MonthSwitcher months={months} month={month} onChange={setMonth} older={older} newer={newer} />
          <Button to="/upload" icon={FileUp} variant="secondary" className="hidden sm:inline-flex">Upload</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Hero: what was left */}
        <motion.section variants={rise} initial="hidden" animate="show" custom={0} className="card relative overflow-hidden lg:col-span-7">
          <div className="ledger-rule pointer-events-none absolute inset-0 opacity-40" aria-hidden />
          <div className="relative p-5 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow">{net >= 0 ? 'Left over' : 'Overspent'} in {monthLabel(month, 'MMMM')}</p>
                <p className={`display num mt-3 text-[46px] font-normal leading-none tracking-[-0.035em] sm:text-[60px] ${net < 0 ? 'text-neg' : 'text-ink'}`}>
                  {format(net)}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
                  {income > 0 && (
                    <span className="text-sm text-ink-2">
                      {net >= 0 ? `You kept ${Math.round(keptShare)}% of what came in` : 'More went out than came in'}
                    </span>
                  )}
                  {prev && <Delta current={net} previous={prev.net_savings} goodWhen="up" label="vs last month" />}
                </div>
              </div>
            </div>

            {income > 0 && (
              <div className="mt-6" aria-hidden>
                <div className="flex h-2.5 overflow-hidden rounded-full bg-surface-3">
                  <motion.div
                    className="h-full bg-expense"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (expenses / income) * 100)}%` }}
                    transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                  />
                  <span className="w-[2px] bg-surface" />
                  <motion.div className="h-full flex-1 bg-income" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} />
                </div>
              </div>
            )}

            <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line">
              {[
                { label: 'Money in', value: income, prev: prev?.total_income, good: 'up', key: 'total_income', swatch: 'bg-income' },
                { label: 'Money out', value: expenses, prev: prev?.total_expenses, good: 'down', key: 'total_expenses', swatch: 'bg-expense' },
              ].map((s) => (
                <div key={s.label} className="bg-surface p-4 sm:p-5">
                  <p className="flex items-center gap-2 text-[13px] text-ink-3">
                    <span className={`h-2 w-2 rounded-[3px] ${s.swatch}`} aria-hidden />{s.label}
                  </p>
                  <div className="mt-2 flex items-end justify-between gap-2">
                    <p className="num text-[19px] font-semibold tracking-[-0.01em] text-ink sm:text-[22px]">{format(s.value)}</p>
                    <span className="hidden sm:block"><Sparkline values={spark(s.key)} /></span>
                  </div>
                  {s.prev !== undefined && <Delta className="mt-1.5" current={s.value} previous={s.prev} goodWhen={s.good} label="vs last month" />}
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-ink-3">
              {summary.transaction_count} transactions ·{' '}
              <Link to={`/transactions?month=${month}`} className="font-medium text-accent hover:underline">See them all</Link>
            </p>
          </div>
        </motion.section>

        <motion.div variants={rise} initial="hidden" animate="show" custom={1} className="lg:col-span-5">
          <AdvisorCard month={month} summary={summary} />
        </motion.div>

        <motion.div variants={rise} initial="hidden" animate="show" custom={2} className="lg:col-span-8">
          <Card eyebrow="Cash flow" title="Money in and out by month" className="h-full">
            {trendQ.loading ? <Skeleton className="h-[300px]" /> : (
              <CashflowChart trend={trend} selected={month} onSelect={setMonth} height={330} />
            )}
          </Card>
        </motion.div>

        <motion.div variants={rise} initial="hidden" animate="show" custom={3} className="lg:col-span-4">
          <Card
            eyebrow="Where it went"
            title="Spending by category"
            className="h-full"
            action={<Link to="/budget" className="text-xs font-medium text-accent hover:underline">Budgets</Link>}
          >
            <CategoryBreakdown breakdown={summary.category_breakdown} month={month} />
          </Card>
        </motion.div>

        <motion.div variants={rise} initial="hidden" animate="show" custom={4} className="md:col-span-1 lg:col-span-5">
          <Card eyebrow="Daily" title="Spending calendar" className="h-full">
            <SpendingCalendar month={month} daily={summary.daily_spending} />
          </Card>
        </motion.div>

        <motion.div variants={rise} initial="hidden" animate="show" custom={5} className="lg:col-span-4">
          <Card eyebrow="Signals" title="Worth knowing" className="h-full">
            {signals.length ? (
              <ul className="space-y-4">
                {signals.map((s) => (
                  <li key={s.title} className="flex gap-3">
                    <span className="mt-0.5 shrink-0"><SignalIcon tone={s.tone} /></span>
                    <span>
                      <span className="block text-sm font-medium leading-snug text-ink">{s.title}</span>
                      <span className="mt-0.5 block text-[13px] leading-relaxed text-ink-3">{s.body}</span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-3">Nothing unusual this month.</p>
            )}
          </Card>
        </motion.div>

        <motion.div variants={rise} initial="hidden" animate="show" custom={6} className="lg:col-span-3">
          <Card eyebrow="Rhythm" title="By day of week" className="h-full">
            <WeekdayChart data={summary.weekday_spending} />
          </Card>
        </motion.div>

        <motion.div variants={rise} initial="hidden" animate="show" custom={7} className="lg:col-span-4">
          <Card eyebrow="Payees" title="Who you paid most" className="h-full">
            <ul className="space-y-1">
              {summary.top_payees.map((p, i) => (
                <li key={p.name} className="flex items-center gap-3 py-1.5">
                  <span className="num w-5 font-mono text-xs text-ink-3">{i + 1}</span>
                  <span className="min-w-0 flex-1">
                    <Link to={`/transactions?search=${encodeURIComponent(p.name)}&month=${month}`} className="block truncate text-sm font-medium text-ink hover:text-accent">{p.name}</Link>
                    <span className="text-xs text-ink-3">{p.count} {p.count === 1 ? 'payment' : 'payments'}</span>
                  </span>
                  <span className="num text-sm text-ink">{format(p.amount)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-ink-3">Grouped from statement descriptions, so names are a best guess.</p>
          </Card>
        </motion.div>

        <motion.div variants={rise} initial="hidden" animate="show" custom={8} className="lg:col-span-4">
          <Card eyebrow="Biggest" title="Largest payments" className="h-full">
            <ul className="divide-y divide-line">
              {summary.largest_expenses.map((t) => (
                <li key={t.id} className="flex items-center gap-3 py-2.5 first:pt-0">
                  <CategoryIcon slug={t.category} size={34} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-ink">{t.description}</span>
                    <span className="text-xs text-ink-3">{date(t.date, 'EEE d MMM')}</span>
                  </span>
                  <span className="num text-sm font-medium text-ink">{format(t.amount)}</span>
                </li>
              ))}
            </ul>
          </Card>
        </motion.div>

        <motion.div variants={rise} initial="hidden" animate="show" custom={9} className="lg:col-span-4">
          <Card
            eyebrow="Recurring"
            title="Bills that repeat"
            className="h-full"
            action={<Link to="/recurring" className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline">All <ArrowUpRight size={12} /></Link>}
          >
            {recurringQ.loading ? <Skeleton className="h-40" /> : recurring.length ? (
              <ul className="space-y-3">
                {recurring.map((r) => (
                  <li key={r.description} className="flex items-center gap-3">
                    <CategoryIcon slug={r.category} size={34} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink">{r.description}</span>
                      <span className="text-xs capitalize text-ink-3">
                        {r.cadence}{r.next_expected ? ` · next ~${date(r.next_expected, 'd MMM')}` : ''}
                      </span>
                    </span>
                    <span className="num text-sm text-ink">{format(r.average_amount)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState art={false} title="None yet" className="py-6">
                Repeat payments show up once you have two months of statements.
              </EmptyState>
            )}
          </Card>
        </motion.div>
      </div>

      <p className="mt-8 flex items-center justify-center gap-2 text-xs text-ink-3">
        <Eye size={13} /> Only you can see this. Amounts come straight from your uploaded statements.
      </p>
    </div>
  );
}
