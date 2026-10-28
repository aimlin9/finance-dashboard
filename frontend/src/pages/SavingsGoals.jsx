import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CalendarDays, CheckCircle2, MoreHorizontal, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import api, { errorMessage } from '../lib/api';
import { invalidate, useQuery } from '../lib/query';
import { date, plural, toNumber } from '../lib/format';
import useMoney from '../hooks/useMoney';
import {
  Button, ConfirmSheet, EmptyState, ErrorState, Input, PageHeader, PageSkeleton, Sheet,
} from '../components/ui';

function Ring({ value, size = 92, done }) {
  const r = (size - 10) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0 -rotate-90" aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth="8" />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={done ? 'var(--gold)' : 'var(--accent)'} strokeWidth="8" strokeLinecap="round"
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        animate={{ strokeDashoffset: c * (1 - pct / 100) }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
      />
    </svg>
  );
}

function GoalForm({ goal, onDone }) {
  const [name, setName] = useState(goal?.name || '');
  const [target, setTarget] = useState(goal?.target_amount ? String(toNumber(goal.target_amount)) : '');
  const [deadline, setDeadline] = useState(goal?.deadline || '');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = { name, target_amount: target, deadline: deadline || null };
      if (goal) await api.patch(`/analytics/savings-goals/${goal.id}/`, body);
      else await api.post('/analytics/savings-goals/', body);
      invalidate('/analytics/savings-goals/');
      toast.success(goal ? 'Goal updated' : `“${name}” added`);
      onDone();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Input label="What are you saving for?" placeholder="Rent advance, new laptop, December in the village…" value={name} onChange={(e) => setName(e.target.value)} required maxLength={200} autoFocus />
      <Input label="Target" prefix="GH₵" inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value.replace(/[^\d.]/g, ''))} required />
      <Input label="By when" type="date" optional value={deadline} onChange={(e) => setDeadline(e.target.value)} hint="Add a date to see how much to put aside each month." />
      <Button type="submit" className="w-full" size="lg" loading={saving}>{goal ? 'Save changes' : 'Create goal'}</Button>
    </form>
  );
}

function AddMoney({ goal, onDone }) {
  const format = useMoney();
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const remaining = Math.max(toNumber(goal.target_amount) - toNumber(goal.current_amount), 0);

  const add = async (value) => {
    setSaving(true);
    try {
      const res = await api.patch(`/analytics/savings-goals/${goal.id}/`, { add_amount: value });
      invalidate('/analytics/savings-goals/');
      toast.success(res.data.is_completed ? `${goal.name} is fully funded` : `Added ${format(value)} to ${goal.name}`);
      onDone();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {[50, 100, 200, 500].map((v) => (
          <button key={v} type="button" onClick={() => setAmount(String(v))} className="h-10 rounded-full border border-line px-4 text-sm font-medium text-ink-2 hover:border-accent hover:text-accent">
            <span className="num">+{format(v, { decimals: 0 })}</span>
          </button>
        ))}
        {remaining > 0 && (
          <button type="button" onClick={() => setAmount(remaining.toFixed(2))} className="h-10 rounded-full border border-line px-4 text-sm font-medium text-ink-2 hover:border-accent hover:text-accent">
            The rest · <span className="num">{format(remaining, { decimals: 0 })}</span>
          </button>
        )}
      </div>
      <Input label="Amount" prefix="GH₵" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))} />
      <Button className="w-full" size="lg" disabled={!toNumber(amount)} loading={saving} onClick={() => add(amount)}>Add to goal</Button>
    </div>
  );
}

function GoalCard({ goal, onAdd, onEdit, onDelete }) {
  const format = useMoney();
  const [menu, setMenu] = useState(false);
  const current = toNumber(goal.current_amount);
  const target = toNumber(goal.target_amount);

  return (
    <motion.li layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} className="card relative p-5">
      <div className="flex items-start gap-4">
        <div className="relative">
          <Ring value={goal.progress} done={goal.is_completed} />
          <span className="num absolute inset-0 flex items-center justify-center text-sm font-semibold text-ink">
            {goal.is_completed ? <CheckCircle2 size={22} className="text-gold" /> : `${Math.round(goal.progress)}%`}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="display text-[19px] leading-snug text-ink">{goal.name}</h3>
            <div className="relative">
              <button type="button" onClick={() => setMenu((m) => !m)} className="-mr-2 -mt-1 rounded-lg p-1.5 text-ink-3 hover:bg-surface-2 hover:text-ink" aria-label="Goal options">
                <MoreHorizontal size={18} />
              </button>
              <AnimatePresence>
                {menu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute right-0 top-8 z-10 w-36 overflow-hidden rounded-xl border border-line bg-surface p-1 shadow-md"
                    onMouseLeave={() => setMenu(false)}
                  >
                    <button type="button" onClick={() => { setMenu(false); onEdit(); }} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-ink hover:bg-surface-2">Edit</button>
                    <button type="button" onClick={() => { setMenu(false); onDelete(); }} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-neg hover:bg-neg-soft">Delete</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <p className="num mt-1 text-sm text-ink-2">
            <span className="font-semibold text-ink">{format(current)}</span> of {format(target)}
          </p>
          {goal.deadline && (
            <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-ink-3">
              <CalendarDays size={13} /> {date(goal.deadline)}
              {goal.months_left !== null && !goal.is_completed && ` · ${goal.months_left ? plural(goal.months_left, 'month') + ' left' : 'due this month'}`}
            </p>
          )}
        </div>
      </div>

      {!goal.is_completed && goal.monthly_needed > 0 && (
        <p className="mt-4 rounded-xl bg-surface-2 px-3.5 py-2.5 text-[13px] text-ink-2">
          Put aside <span className="num font-semibold text-ink">{format(goal.monthly_needed)}</span>{goal.months_left > 1 ? ' a month' : ''} to make it on time.
        </p>
      )}
      {goal.is_completed ? (
        <p className="mt-4 rounded-xl bg-gold-soft px-3.5 py-2.5 text-[13px] font-medium text-gold">Fully funded. Well done.</p>
      ) : (
        <Button variant="secondary" className="mt-4 w-full" icon={Plus} onClick={onAdd}>Add money</Button>
      )}
    </motion.li>
  );
}

export default function SavingsGoals() {
  const format = useMoney();
  const { data, loading, error, refetch } = useQuery('/analytics/savings-goals/');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  if (loading) return <PageSkeleton />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  const goals = data || [];
  const active = goals.filter((g) => !g.is_completed);
  const done = goals.filter((g) => g.is_completed);
  const saved = goals.reduce((s, g) => s + toNumber(g.current_amount), 0);
  const target = active.reduce((s, g) => s + toNumber(g.target_amount), 0);

  const remove = async () => {
    setBusy(true);
    try {
      await api.delete(`/analytics/savings-goals/${deleting.id}/`);
      invalidate('/analytics/savings-goals/');
      toast.success('Goal deleted');
      setDeleting(null);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Plan"
        title="Savings goals"
        description={goals.length ? `${format(saved, { decimals: 0 })} put aside so far${active.length ? `, toward ${format(target, { decimals: 0 })} in open goals` : ''}.` : 'Name something you are saving for and track it here.'}
        actions={<Button icon={Plus} onClick={() => setCreating(true)}>New goal</Button>}
      />

      {goals.length === 0 ? (
        <div className="card">
          <EmptyState title="No goals yet" action={<Button icon={Plus} onClick={() => setCreating(true)}>Create your first goal</Button>}>
            Rent advance, school fees, an emergency fund: give it a name and a target, and FinTrack works out the monthly pace.
          </EmptyState>
        </div>
      ) : (
        <>
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence>
              {active.map((g) => (
                <GoalCard key={g.id} goal={g} onAdd={() => setAdding(g)} onEdit={() => setEditing(g)} onDelete={() => setDeleting(g)} />
              ))}
            </AnimatePresence>
          </ul>
          {done.length > 0 && (
            <>
              <h2 className="eyebrow mb-3 mt-10">Completed</h2>
              <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {done.map((g) => (
                  <GoalCard key={g.id} goal={g} onAdd={() => setAdding(g)} onEdit={() => setEditing(g)} onDelete={() => setDeleting(g)} />
                ))}
              </ul>
            </>
          )}
        </>
      )}

      <Sheet open={creating} onOpenChange={setCreating} title="New savings goal">
        {creating && <GoalForm onDone={() => setCreating(false)} />}
      </Sheet>
      <Sheet open={!!editing} onOpenChange={(o) => !o && setEditing(null)} title="Edit goal">
        {editing && <GoalForm goal={editing} onDone={() => setEditing(null)} />}
      </Sheet>
      <Sheet open={!!adding} onOpenChange={(o) => !o && setAdding(null)} title={adding ? `Add to ${adding.name}` : ''}>
        {adding && <AddMoney goal={adding} onDone={() => setAdding(null)} />}
      </Sheet>
      <ConfirmSheet
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete this goal?"
        description={deleting ? `“${deleting.name}” and its progress will be removed.` : ''}
        loading={busy}
        onConfirm={remove}
      >
        <p className="flex items-center gap-2 text-sm text-ink-3"><Trash2 size={15} /> This can't be undone.</p>
      </ConfirmSheet>
    </div>
  );
}
