import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import api, { errorMessage } from '../lib/api';
import { invalidate, useQuery } from '../lib/query';
import { category } from '../lib/categories';
import { monthLabel, percent, toNumber } from '../lib/format';
import useMonths from '../hooks/useMonths';
import useMoney from '../hooks/useMoney';
import {
  Button, Card, CategoryIcon, EmptyState, ErrorState, Input, Meter, MonthSwitcher, PageHeader, PageSkeleton, Sheet,
} from '../components/ui';
import { statusFor } from '../lib/budget';

function BudgetSheet({ item, average, onClose }) {
  const format = useMoney();
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const open = !!item;

  const current = item?.budget_limit ? String(item.budget_limit) : '';
  const suggestions = average > 0
    ? [Math.ceil(average / 10) * 10, Math.ceil((average * 0.9) / 10) * 10, Math.ceil((average * 0.8) / 10) * 10]
    : [];

  const save = async () => {
    setSaving(true);
    try {
      await api.post('/analytics/budget/set/', { category: item.slug, budget_limit: value || current });
      invalidate('/analytics/budget/');
      toast.success(`${category(item.slug).name} budget set to ${format(value || current)}`);
      onClose();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setRemoving(true);
    try {
      await api.post('/analytics/budget/remove/', { category: item.slug });
      invalidate('/analytics/budget/');
      toast.success('Budget removed');
      onClose();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setRemoving(false);
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => { if (!o) onClose(); else setValue(current); }}
      title={item ? `${category(item.slug).name} budget` : ''}
      description="A monthly limit. You'll be alerted at 80%."
      footer={
        <>
          {item?.budget_limit ? (
            <Button variant="danger-ghost" icon={Trash2} loading={removing} onClick={remove}>Remove</Button>
          ) : null}
          <Button className="flex-1" loading={saving} disabled={!toNumber(value || current)} onClick={save}>Save budget</Button>
        </>
      }
    >
      {item && (
        <div className="space-y-5">
          <Input
            label="Monthly limit"
            prefix="GH₵"
            inputMode="decimal"
            autoFocus
            placeholder={current || '0.00'}
            value={value}
            onChange={(e) => setValue(e.target.value.replace(/[^\d.]/g, ''))}
            onKeyDown={(e) => e.key === 'Enter' && save()}
          />
          {suggestions.length > 0 && (
            <div>
              <p className="mb-2 text-[13px] text-ink-3">
                You've averaged <span className="num font-medium text-ink">{format(average)}</span> a month here recently.
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s, i) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setValue(String(s))}
                    className="h-9 rounded-full border border-line px-3.5 text-[13px] font-medium text-ink-2 hover:border-accent hover:text-accent"
                  >
                    <span className="num">{format(s, { decimals: 0 })}</span>
                    <span className="ml-1 text-ink-3">{['average', '−10%', '−20%'][i]}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          <p className="text-[13px] text-ink-3">
            Spent so far in {monthLabel(item.month, 'MMMM')}: <span className="num font-medium text-ink">{format(item.amount_spent)}</span>
          </p>
        </div>
      )}
    </Sheet>
  );
}

export default function Budget() {
  const format = useMoney();
  const { months, month, setMonth, older, newer, loading: monthsLoading, hasData } = useMonths();
  const budgetQ = useQuery(month ? `/analytics/budget/?month=${month}` : null);
  const trendQ = useQuery(hasData ? '/analytics/trend/' : null);
  const [editing, setEditing] = useState(null);

  const averages = useMemo(() => {
    const recent = (trendQ.data || []).filter((t) => t.month.slice(0, 7) <= month).slice(-3);
    const out = {};
    for (const m of recent) {
      for (const [slug, v] of Object.entries(m.category_breakdown || {})) out[slug] = (out[slug] || 0) + v / recent.length;
    }
    return out;
  }, [trendQ.data, month]);

  if (monthsLoading || (month && budgetQ.loading)) return <PageSkeleton />;
  if (!hasData) {
    return (
      <>
        <PageHeader eyebrow="Plan" title="Budgets" />
        <div className="card"><EmptyState title="Budgets need a statement first" action={<Button to="/upload">Upload a statement</Button>}>Once FinTrack knows what you usually spend, it can suggest sensible limits.</EmptyState></div>
      </>
    );
  }
  if (budgetQ.error) return <ErrorState error={budgetQ.error} onRetry={budgetQ.refetch} />;

  const items = (budgetQ.data || []).map((b) => ({ ...b, month }));
  const budgeted = items.filter((b) => b.budget_limit);
  const unbudgeted = items.filter((b) => !b.budget_limit && b.slug !== 'savings').sort((a, b) => b.amount_spent - a.amount_spent);
  const totalLimit = budgeted.reduce((s, b) => s + b.budget_limit, 0);
  const totalSpent = budgeted.reduce((s, b) => s + b.amount_spent, 0);
  const onTrack = budgeted.filter((b) => b.status === 'ok').length;
  const unbudgetedSpend = unbudgeted.reduce((s, b) => s + b.amount_spent, 0);
  const overall = totalLimit ? (totalSpent / totalLimit) * 100 : 0;

  return (
    <div>
      <PageHeader
        eyebrow={`Plan · ${monthLabel(month)}`}
        title="Budgets"
        description="Monthly limits per category, checked against what your statements show."
        actions={<MonthSwitcher months={months} month={month} onChange={setMonth} older={older} newer={newer} />}
      />

      {budgeted.length > 0 && (
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card mb-6 grid gap-6 p-5 sm:p-7 md:grid-cols-[1.3fr_1fr]">
          <div>
            <p className="eyebrow">Across {budgeted.length} budgets</p>
            <p className="display num mt-3 text-[40px] leading-none tracking-[-0.03em] text-ink sm:text-[48px]">
              {format(totalSpent, { decimals: 0 })}
              <span className="text-[22px] text-ink-3 sm:text-[26px]"> / {format(totalLimit, { decimals: 0 })}</span>
            </p>
            <Meter value={overall} className="mt-5" height={10} showStatus />
          </div>
          <dl className="grid grid-cols-2 gap-px self-center overflow-hidden rounded-2xl border border-line bg-line text-sm">
            {[
              ['On track', `${onTrack} of ${budgeted.length}`],
              ['Left to spend', format(Math.max(totalLimit - totalSpent, 0), { decimals: 0 })],
              ['Used', percent(overall)],
              ['Not budgeted', format(unbudgetedSpend, { decimals: 0 })],
            ].map(([k, v]) => (
              <div key={k} className="bg-surface p-4">
                <dt className="text-xs text-ink-3">{k}</dt>
                <dd className="num mt-1 font-semibold text-ink">{v}</dd>
              </div>
            ))}
          </dl>
        </motion.section>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card title="Your budgets" eyebrow={budgeted.length ? `${budgeted.length} set` : 'None yet'}>
          {budgeted.length ? (
            <ul className="-mx-2 divide-y divide-line">
              {budgeted.map((b, i) => {
                const left = b.budget_limit - b.amount_spent;
                return (
                  <motion.li
                    key={b.slug}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <button type="button" onClick={() => setEditing(b)} className="group w-full rounded-xl px-2 py-4 text-left hover:bg-surface-2/60">
                      <div className="flex items-center gap-3">
                        <CategoryIcon slug={b.slug} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-3">
                            <span className="truncate text-sm font-medium text-ink">{category(b.slug).name}</span>
                            <span className="num shrink-0 text-sm text-ink">
                              {format(b.amount_spent, { decimals: 0 })}<span className="text-ink-3"> / {format(b.budget_limit, { decimals: 0 })}</span>
                            </span>
                          </div>
                          <Meter value={b.progress} status={statusFor(b.progress)} className="mt-2.5" />
                          <div className="mt-1.5 flex items-center justify-between text-xs">
                            <span className={left < 0 ? 'font-medium text-neg' : 'text-ink-3'}>
                              {left < 0 ? `${format(-left, { decimals: 0 })} over` : `${format(left, { decimals: 0 })} left`}
                            </span>
                            <span className="inline-flex items-center gap-1 text-ink-3 opacity-0 transition-opacity group-hover:opacity-100"><Pencil size={12} /> Edit</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  </motion.li>
                );
              })}
            </ul>
          ) : (
            <EmptyState art={false} title="No budgets yet" className="py-8">
              Pick a category from “Spending without a budget”. Starting with your biggest one makes the most difference.
            </EmptyState>
          )}
        </Card>

        <Card title="Spending without a budget" eyebrow={monthLabel(month, 'MMMM')}>
          <ul className="-mx-2">
            {unbudgeted.map((b) => (
              <li key={b.slug} className="flex items-center gap-3 rounded-xl px-2 py-2.5">
                <CategoryIcon slug={b.slug} size={34} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-ink">{category(b.slug).name}</span>
                  <span className="num text-xs text-ink-3">
                    {b.amount_spent ? format(b.amount_spent) : 'Nothing spent'}
                    {averages[b.slug] ? ` · avg ${format(averages[b.slug], { decimals: 0 })}` : ''}
                  </span>
                </span>
                <Button variant="ghost" size="sm" icon={Plus} onClick={() => setEditing(b)}>Budget</Button>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <BudgetSheet item={editing} average={editing ? averages[editing.slug] || 0 : 0} onClose={() => setEditing(null)} />
    </div>
  );
}
