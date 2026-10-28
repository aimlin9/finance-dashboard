import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertCircle, FileSpreadsheet, FileText, Trash2, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';
import api, { errorMessage } from '../lib/api';
import { invalidate, useQuery } from '../lib/query';
import { bankName } from '../lib/banks';
import { date, monthLabel, plural } from '../lib/format';
import { Badge, Button, ConfirmSheet, EmptyState, ErrorState, PageHeader, PageSkeleton } from '../components/ui';

export default function Statements() {
  const { data, loading, error, refetch } = useQuery('/statements/');
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  if (loading) return <PageSkeleton />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;
  const statements = data?.results || [];

  const remove = async () => {
    setBusy(true);
    try {
      await api.delete(`/statements/${deleting.id}/`);
      invalidate('/statements/', '/analytics/', '/transactions/');
      toast.success('Statement and its transactions deleted');
      setDeleting(null);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        eyebrow="Manage"
        title="Statements"
        description="Every file you've uploaded. Deleting one removes its transactions and updates your totals."
        actions={<Button icon={UploadCloud} to="/upload">Upload</Button>}
      />

      {statements.length === 0 ? (
        <div className="card"><EmptyState title="No statements yet" action={<Button to="/upload">Upload your first</Button>} /></div>
      ) : (
        <ul className="space-y-2.5">
          <AnimatePresence initial={false}>
            {statements.map((s) => {
              const Icon = s.status === 'failed' ? AlertCircle : s.file_type === 'pdf' ? FileText : FileSpreadsheet;
              return (
                <motion.li key={s.id} layout exit={{ opacity: 0, x: -24 }} className="card flex items-start gap-4 p-4 sm:p-5">
                  <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${s.status === 'failed' ? 'bg-neg-soft text-neg' : 'bg-surface-2 text-ink-2'}`}>
                    <Icon size={20} strokeWidth={1.8} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{s.file_name}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-ink-3">
                      <Badge tone={s.status === 'failed' ? 'neg' : 'neutral'}>{s.status === 'failed' ? 'Failed' : bankName(s.bank_name)}</Badge>
                      {s.status === 'done' && (
                        <>
                          <span>{plural(s.total_transactions, 'transaction')}</span>
                          {s.statement_month && <span>· {monthLabel(s.statement_month, 'MMM yyyy')}</span>}
                          {s.duplicates_skipped > 0 && <span>· {s.duplicates_skipped} duplicates skipped</span>}
                        </>
                      )}
                      <span>· uploaded {date(s.uploaded_at, 'd MMM yyyy')}</span>
                    </div>
                    {s.status === 'failed' && s.error_message && <p className="mt-2 text-[13px] leading-relaxed text-neg">{s.error_message}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => setDeleting(s)}
                    className="-mr-1 rounded-xl p-2.5 text-ink-3 transition-colors hover:bg-neg-soft hover:text-neg"
                    aria-label={`Delete ${s.file_name}`}
                  >
                    <Trash2 size={17} />
                  </button>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}

      <ConfirmSheet
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete this statement?"
        description={deleting?.file_name}
        loading={busy}
        onConfirm={remove}
      >
        <p className="text-sm leading-relaxed text-ink-2">
          {deleting?.total_transactions
            ? `Its ${plural(deleting.total_transactions, 'transaction')} will be removed and your monthly totals recalculated. Category edits on them are lost.`
            : 'This upload has no transactions, so nothing else changes.'}
        </p>
      </ConfirmSheet>
    </div>
  );
}
