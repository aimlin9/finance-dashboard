import { ArrowRight, Trash2, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import api, { errorMessage } from '../lib/api';
import { invalidate, useQuery } from '../lib/query';
import { date } from '../lib/format';
import { Button, Card, CategoryPill, EmptyState, ErrorState, PageHeader, PageSkeleton } from '../components/ui';

export default function Rules() {
  const { data, loading, error, refetch } = useQuery('/transactions/rules/');
  if (loading) return <PageSkeleton />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;
  const rules = data || [];

  const remove = async (rule) => {
    try {
      await api.delete(`/transactions/rules/${rule.id}/`);
      invalidate('/transactions/rules/');
      toast.success(`Forgot the rule for “${rule.pattern}”`);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        eyebrow="Manage"
        title="Category rules"
        description="When you correct a transaction and choose “Remember for future uploads”, FinTrack saves a rule here. Your rules are checked before anything else."
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
        <Card eyebrow={`${rules.length} ${rules.length === 1 ? 'rule' : 'rules'}`} title="Learned from your corrections">
          {rules.length === 0 ? (
            <EmptyState art={false} title="No rules yet" className="py-8" action={<Button variant="secondary" to="/transactions">Review transactions</Button>}>
              Open any transaction, pick a better category and leave “Remember” switched on.
            </EmptyState>
          ) : (
            <ul className="divide-y divide-line">
              {rules.map((r) => (
                <li key={r.id} className="flex items-center gap-3 py-3">
                  <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                    <code className="rounded-lg bg-surface-2 px-2 py-1 font-mono text-[13px] text-ink">{r.pattern}</code>
                    <ArrowRight size={14} className="text-ink-3" />
                    <CategoryPill slug={r.category} />
                  </div>
                  <span className="hidden text-xs text-ink-3 sm:block">{date(r.created_at, 'd MMM')}</span>
                  <button type="button" onClick={() => remove(r)} className="rounded-xl p-2 text-ink-3 hover:bg-neg-soft hover:text-neg" aria-label={`Delete rule ${r.pattern}`}>
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <div className="card h-fit p-5">
          <Wand2 size={19} className="text-gold" />
          <p className="mt-3 text-sm font-medium text-ink">How categorizing works</p>
          <ol className="mt-3 space-y-2.5 text-[13px] leading-relaxed text-ink-3">
            <li><span className="font-medium text-ink-2">1. Your rules</span>, always first.</li>
            <li><span className="font-medium text-ink-2">2. Known names</span>: about 200 merchants and keywords, from Shoprite and Bolt to ECG, E-levy and Telecel.</li>
            <li><span className="font-medium text-ink-2">3. Direction</span>: money in is income or a transfer, never “food”.</li>
            <li><span className="font-medium text-ink-2">4. A small language model</span>, only when it recognises the words.</li>
            <li><span className="font-medium text-ink-2">5. Otherwise “Other”</span>, so nothing is guessed with false confidence.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
