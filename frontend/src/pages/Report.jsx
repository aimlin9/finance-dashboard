import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { downloadFile } from '../lib/api';
import { useQuery } from '../lib/query';
import { category } from '../lib/categories';
import { date, monthLabel, percent, toNumber } from '../lib/format';
import useMonths from '../hooks/useMonths';
import useMoney from '../hooks/useMoney';
import useAuth from '../store/auth';
import { Button, EmptyState, ErrorState, MonthSwitcher, PageSkeleton } from '../components/ui';
import { LogoMark } from '../components/Logo';

export default function Report() {
  const format = useMoney();
  const user = useAuth((s) => s.user);
  const [params] = useSearchParams();
  const { months, month, setMonth, older, newer, loading, hasData } = useMonths();

  useEffect(() => {
    const requested = params.get('month');
    if (requested && months.includes(requested)) setMonth(requested);
  }, [params, months.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  const summaryQ = useQuery(month ? `/analytics/dashboard/?month=${month}` : null);
  // Every transaction for the month, not just the first page of 25.
  const txQ = useQuery(month ? `/transactions/?month=${month}&page_size=1000&ordering=date` : null);

  if (loading) return <PageSkeleton />;
  if (!hasData) return <div className="card"><EmptyState title="Nothing to report yet" action={<Button to="/upload">Upload a statement</Button>} /></div>;
  if (summaryQ.error || txQ.error) return <ErrorState error={summaryQ.error || txQ.error} onRetry={() => { summaryQ.refetch(); txQ.refetch(); }} />;
  if (!summaryQ.data || !txQ.data) return <PageSkeleton />;

  const s = summaryQ.data;
  const txs = txQ.data.results;
  const expenses = toNumber(s.total_expenses);
  const cats = Object.entries(s.category_breakdown || {}).sort((a, b) => b[1] - a[1]);

  return (
    <div>
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <MonthSwitcher months={months} month={month} onChange={setMonth} older={older} newer={newer} />
        <div className="flex gap-2">
          <Button
            variant="secondary"
            icon={Download}
            onClick={() => toast.promise(downloadFile(`/transactions/export/?month=${month}`, `fintrack_${month}.csv`), { loading: 'Preparing…', success: 'CSV downloaded', error: 'Export failed' })}
          >
            CSV
          </Button>
          <Button icon={Printer} onClick={() => window.print()}>Print or save PDF</Button>
        </div>
      </div>

      <article className="card mx-auto max-w-4xl p-6 sm:p-10">
        <header className="flex flex-col gap-6 border-b border-line pb-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5"><LogoMark size={26} /><span className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-3">FinTrack Ghana</span></div>
            <h1 className="display mt-6 text-[34px] leading-tight text-ink sm:text-[42px]">{monthLabel(month)}</h1>
            <p className="mt-1 text-sm text-ink-3">Monthly statement summary for {user?.full_name}</p>
          </div>
          <p className="text-xs text-ink-3 sm:text-right">Prepared {date(new Date(), 'd MMMM yyyy')}<br />{s.transaction_count} transactions</p>
        </header>

        <section className="grid grid-cols-2 gap-px overflow-hidden border-b border-line bg-line sm:grid-cols-4">
          {[
            ['Money in', format(s.total_income)],
            ['Money out', format(s.total_expenses)],
            ['Left over', format(s.net_savings)],
            ['Savings rate', percent(s.savings_rate, 1)],
          ].map(([k, v]) => (
            <div key={k} className="bg-surface py-6 pr-4">
              <p className="text-xs text-ink-3">{k}</p>
              <p className="num mt-1.5 text-lg font-semibold text-ink">{v}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-10 border-b border-line py-8 md:grid-cols-2">
          <div>
            <h2 className="eyebrow mb-4">Spending by category</h2>
            <table className="num w-full text-sm">
              <tbody>
                {cats.map(([slug, v]) => (
                  <tr key={slug} className="border-b border-line last:border-0">
                    <td className="py-2 text-ink-2">{category(slug).name}</td>
                    <td className="py-2 text-right text-ink">{format(v)}</td>
                    <td className="w-14 py-2 text-right text-ink-3">{percent(expenses ? (v / expenses) * 100 : 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div>
            <h2 className="eyebrow mb-4">Top payees</h2>
            <table className="num w-full text-sm">
              <tbody>
                {s.top_payees.map((p) => (
                  <tr key={p.name} className="border-b border-line last:border-0">
                    <td className="py-2 text-ink-2">{p.name}</td>
                    <td className="py-2 text-right text-ink-3">{p.count}×</td>
                    <td className="py-2 text-right text-ink">{format(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="pt-8">
          <h2 className="eyebrow mb-4">All transactions</h2>
          <div className="-mx-2 overflow-x-auto px-2">
            <table className="num w-full min-w-[560px] text-[13px]">
              <thead>
                <tr className="border-b border-line text-left text-xs text-ink-3">
                  <th className="py-2 font-medium">Date</th>
                  <th className="py-2 font-medium">Description</th>
                  <th className="py-2 font-medium">Category</th>
                  <th className="py-2 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {txs.map((t) => (
                  <tr key={t.id} className="border-b border-line">
                    <td className="whitespace-nowrap py-2 pr-3 text-ink-3">{date(t.date, 'd MMM')}</td>
                    <td className="max-w-[280px] truncate py-2 pr-3 text-ink">{t.description}</td>
                    <td className="py-2 pr-3 text-ink-2">{category(t.category).name}</td>
                    <td className={`whitespace-nowrap py-2 text-right ${t.type === 'credit' ? 'text-pos' : 'text-ink'}`}>
                      {format(t.type === 'debit' ? -t.amount : t.amount, { sign: 'always' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {txQ.data.next && <p className="mt-3 text-xs text-ink-3">Showing the first 1,000 transactions. Use CSV export for the full list.</p>}
        </section>

        <footer className="mt-10 border-t border-line pt-5 text-[11px] leading-relaxed text-ink-3">
          Generated by FinTrack Ghana from uploaded statements. Categories are assigned automatically and may contain errors. Not financial advice.
        </footer>
      </article>
    </div>
  );
}
