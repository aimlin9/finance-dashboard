import { useMemo, useState } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { useQuery } from '../lib/query';
import { category } from '../lib/categories';
import { monthLabel, percent, toNumber } from '../lib/format';
import useMonths from '../hooks/useMonths';
import useMoney from '../hooks/useMoney';
import { Button, Card, Delta, EmptyState, ErrorState, PageHeader, PageSkeleton, Select, Skeleton } from '../components/ui';
import DivergingBars from '../components/charts/DivergingBars';

export default function Compare() {
  const format = useMoney();
  const { months, month, loading } = useMonths();
  const [picked, setPicked] = useState({ a: '', b: '' });
  const i = Math.max(months.indexOf(month), 0);
  const a = picked.a || months[i + 1] || months[i - 1] || '';
  const b = picked.b || months[i] || '';
  const setA = (v) => setPicked((p) => ({ ...p, a: v, b }));
  const setB = (v) => setPicked((p) => ({ ...p, b: v, a }));

  const q = useQuery(a && b && a !== b ? `/analytics/compare/?month1=${a}&month2=${b}` : null);

  const rows = useMemo(() => {
    if (!q.data) return [];
    const b1 = q.data.month1.category_breakdown || {};
    const b2 = q.data.month2.category_breakdown || {};
    return [...new Set([...Object.keys(b1), ...Object.keys(b2)])]
      .map((slug) => ({ slug, before: toNumber(b1[slug]), after: toNumber(b2[slug]), change: toNumber(b2[slug]) - toNumber(b1[slug]) }))
      .sort((x, y) => Math.abs(y.change) - Math.abs(x.change));
  }, [q.data]);

  if (loading) return <PageSkeleton />;
  if (months.length < 2) {
    return (
      <>
        <PageHeader eyebrow="Insight" title="Compare months" />
        <div className="card"><EmptyState title="Two months needed" action={<Button to="/upload">Upload another statement</Button>}>Upload statements covering at least two months to compare them side by side.</EmptyState></div>
      </>
    );
  }

  const m1 = q.data?.month1;
  const m2 = q.data?.month2;
  const stats = m1 && m2 ? [
    { label: 'Money in', before: m1.total_income, after: m2.total_income, good: 'up' },
    { label: 'Money out', before: m1.total_expenses, after: m2.total_expenses, good: 'down' },
    { label: 'Left over', before: m1.net_savings, after: m2.net_savings, good: 'up' },
    { label: 'Savings rate', before: m1.savings_rate, after: m2.savings_rate, good: 'up', pct: true },
  ] : [];

  return (
    <div>
      <PageHeader
        eyebrow="Insight"
        title="Compare months"
        description="See exactly what changed between two months, category by category."
      />

      <div className="card mb-6 grid items-end gap-3 p-4 sm:grid-cols-[1fr_auto_1fr] sm:p-5">
        <Select label="From" value={a} onChange={(e) => setA(e.target.value)}>
          {months.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
        </Select>
        <button type="button" onClick={() => setPicked({ a: b, b: a })} className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-line text-ink-2 hover:bg-surface-2" aria-label="Swap months">
          <ArrowLeftRight size={17} />
        </button>
        <Select label="To" value={b} onChange={(e) => setB(e.target.value)}>
          {months.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
        </Select>
      </div>

      {a === b ? (
        <p className="text-sm text-ink-3">Pick two different months.</p>
      ) : q.error ? (
        <ErrorState error={q.error} onRetry={q.refetch} />
      ) : !q.data ? (
        <Skeleton className="h-96 rounded-2xl" />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="card p-5">
                <p className="text-[13px] text-ink-3">{s.label}</p>
                <p className="num mt-2 text-[22px] font-semibold tracking-[-0.01em] text-ink">
                  {s.pct ? percent(s.after, 1) : format(s.after)}
                </p>
                <p className="num mt-1 text-xs text-ink-3">from {s.pct ? percent(s.before, 1) : format(s.before)}</p>
                <Delta className="mt-2" current={s.after} previous={s.before} goodWhen={s.good} />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
            <Card eyebrow="By category" title={`Spending change, ${monthLabel(a, 'MMM')} → ${monthLabel(b, 'MMM')}`}>
              {rows.length ? <DivergingBars rows={rows} /> : <p className="text-sm text-ink-3">No spending in either month.</p>}
            </Card>
            <Card eyebrow="Table" title="Side by side">
              <div className="-mx-1 overflow-x-auto">
                <table className="num w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-ink-3">
                      <th className="px-1 py-2 font-medium">Category</th>
                      <th className="px-1 py-2 text-right font-medium">{monthLabel(a, 'MMM')}</th>
                      <th className="px-1 py-2 text-right font-medium">{monthLabel(b, 'MMM')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.slug} className="border-t border-line">
                        <td className="px-1 py-2.5 text-ink-2">{category(r.slug).name}</td>
                        <td className="px-1 py-2.5 text-right text-ink-3">{format(r.before, { decimals: 0 })}</td>
                        <td className="px-1 py-2.5 text-right text-ink">{format(r.after, { decimals: 0 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
