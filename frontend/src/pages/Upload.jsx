import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertCircle, ArrowRight, CheckCircle2, Download, FileSpreadsheet, FileText, Lock, ShieldCheck, UploadCloud, X,
} from 'lucide-react';
import api, { errorMessage } from '../lib/api';
import { invalidate } from '../lib/query';
import { bankName } from '../lib/banks';
import { plural } from '../lib/format';
import usePeriod from '../store/period';
import { Badge, Button, Card, PageHeader } from '../components/ui';
import cn from '../lib/cn';

const MAX_SIZE = 10 * 1024 * 1024;

function fileSize(bytes) {
  return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function QueueItem({ item, onRemove }) {
  const Icon = item.file.name.toLowerCase().endsWith('.pdf') ? FileText : FileSpreadsheet;
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="card p-4"
    >
      <div className="flex items-start gap-3">
        <span className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
          item.status === 'done' ? 'bg-accent-soft text-accent' : item.status === 'failed' ? 'bg-neg-soft text-neg' : 'bg-surface-2 text-ink-2',
        )}>
          {item.status === 'done' ? <CheckCircle2 size={19} /> : item.status === 'failed' ? <AlertCircle size={19} /> : <Icon size={19} />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-sm font-medium text-ink">{item.file.name}</p>
            {item.status === 'queued' && (
              <button type="button" onClick={onRemove} className="-mr-1 rounded-lg p-1 text-ink-3 hover:text-ink" aria-label="Remove">
                <X size={16} />
              </button>
            )}
          </div>
          <p className="mt-0.5 text-xs text-ink-3">
            {fileSize(item.file.size)}
            {item.status === 'uploading' && (item.progress < 100 ? ` · Uploading ${item.progress}%` : ' · Reading transactions…')}
            {item.status === 'queued' && ' · Ready'}
          </p>

          {item.status === 'uploading' && (
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-3">
              <motion.div
                className={cn('h-full rounded-full bg-accent', item.progress >= 100 && 'animate-pulse')}
                animate={{ width: `${Math.max(item.progress, 6)}%` }}
              />
            </div>
          )}

          {item.status === 'done' && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge tone="accent">{bankName(item.result.bank_name)}</Badge>
              <span className="text-[13px] text-ink-2">
                {plural(item.result.total_transactions, 'new transaction')}
                {item.result.duplicates_skipped > 0 && ` · ${item.result.duplicates_skipped} already imported, skipped`}
              </span>
            </div>
          )}
          {item.status === 'failed' && <p className="mt-2 text-[13px] leading-relaxed text-neg">{item.error}</p>}
        </div>
      </div>
    </motion.li>
  );
}

export default function Upload() {
  const [queue, setQueue] = useState([]);
  const [running, setRunning] = useState(false);
  const setMonth = usePeriod((s) => s.setMonth);

  const onDrop = useCallback((accepted, rejected) => {
    const items = accepted.map((file) => ({ id: `${file.name}-${file.size}-${Math.random()}`, file, status: 'queued', progress: 0 }));
    const bad = rejected.map(({ file, errors }) => ({
      id: `${file.name}-${Math.random()}`,
      file,
      status: 'failed',
      error: errors[0]?.code === 'file-too-large' ? 'This file is over 10 MB.' : 'Only PDF and CSV statements can be read.',
    }));
    setQueue((q) => [...q, ...items, ...bad]);
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'text/csv': ['.csv'], 'application/vnd.ms-excel': ['.csv'] },
    maxSize: MAX_SIZE,
    multiple: true,
    noClick: true,
  });

  const update = (id, patch) => setQueue((q) => q.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  const uploadAll = async () => {
    setRunning(true);
    let newest = null;
    for (const item of queue.filter((i) => i.status === 'queued')) {
      update(item.id, { status: 'uploading', progress: 0 });
      const form = new FormData();
      form.append('file', item.file);
      try {
        const res = await api.post('/statements/upload/', form, {
          onUploadProgress: (e) => e.total && update(item.id, { progress: Math.round((e.loaded / e.total) * 100) }),
        });
        update(item.id, { status: 'done', result: res.data });
        if (res.data.statement_month && (!newest || res.data.statement_month > newest)) newest = res.data.statement_month;
      } catch (error) {
        update(item.id, { status: 'failed', error: errorMessage(error, 'This statement could not be read.') });
      }
    }
    invalidate('/analytics/', '/transactions/', '/statements/');
    if (newest) setMonth(newest.slice(0, 7));
    setRunning(false);
  };

  const queued = queue.filter((i) => i.status === 'queued').length;
  const done = queue.filter((i) => i.status === 'done');
  const added = done.reduce((s, i) => s + i.result.total_transactions, 0);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        eyebrow="Import"
        title="Upload statements"
        description="Drop in one statement or a year's worth. Overlapping statements are fine: transactions you've already imported are skipped."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <div
            {...getRootProps()}
            className={cn(
              'relative overflow-hidden rounded-[22px] border-2 border-dashed px-6 py-12 text-center transition-colors sm:py-16',
              isDragActive ? 'border-accent bg-accent-soft' : 'border-line-strong bg-surface',
            )}
          >
            <input {...getInputProps()} />
            <motion.div animate={{ y: isDragActive ? -4 : 0, scale: isDragActive ? 1.05 : 1 }} className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-accent-ink shadow-md">
              <UploadCloud size={28} strokeWidth={1.8} />
            </motion.div>
            <p className="display mt-5 text-[22px] text-ink">{isDragActive ? 'Drop to add' : 'Drag statements here'}</p>
            <p className="mt-1.5 text-sm text-ink-3">PDF or CSV · up to 10 MB each</p>
            <Button className="mt-6" onClick={open} variant="secondary">Choose files</Button>
          </div>

          {queue.length > 0 && (
            <>
              <ul className="space-y-2.5">
                <AnimatePresence initial={false}>
                  {queue.map((item) => (
                    <QueueItem key={item.id} item={item} onRemove={() => setQueue((q) => q.filter((i) => i.id !== item.id))} />
                  ))}
                </AnimatePresence>
              </ul>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
                <button type="button" onClick={() => setQueue([])} disabled={running} className="h-11 text-sm text-ink-3 hover:text-ink disabled:opacity-40">
                  Clear list
                </button>
                {queued > 0 ? (
                  <Button size="lg" icon={UploadCloud} loading={running} onClick={uploadAll}>
                    Read {plural(queued, 'statement')}
                  </Button>
                ) : done.length > 0 && !running ? (
                  <Button size="lg" iconRight={ArrowRight} to="/dashboard">
                    See your month{added ? ` · ${plural(added, 'new transaction')}` : ''}
                  </Button>
                ) : null}
              </div>
            </>
          )}
        </div>

        <aside className="space-y-4">
          <Card eyebrow="Supported" title="What can be read">
            <ul className="space-y-3 text-sm">
              {[
                ['GCB Bank', 'PDF and CSV'],
                ['Ecobank', 'PDF and CSV'],
                ['MTN MoMo', 'PDF and CSV'],
                ['Any other bank', 'CSV with a date column and amount or debit/credit columns'],
              ].map(([name, detail]) => (
                <li key={name} className="flex gap-3">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-accent" />
                  <span><span className="font-medium text-ink">{name}</span><span className="block text-[13px] text-ink-3">{detail}</span></span>
                </li>
              ))}
            </ul>
            <a href="/sample-statement.csv" download className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-accent hover:underline">
              <Download size={15} /> Try a sample statement
            </a>
          </Card>
          <Card>
            <div className="space-y-4 text-[13px] leading-relaxed text-ink-3">
              <p className="flex gap-3"><Lock size={16} className="mt-0.5 shrink-0 text-ink-2" />
                <span><span className="font-medium text-ink">Locked PDF?</span> Banks often protect statements with a password. Open it, then “Print → Save as PDF” to save an unlocked copy.</span>
              </p>
              <p className="flex gap-3"><ShieldCheck size={16} className="mt-0.5 shrink-0 text-ink-2" />
                <span><span className="font-medium text-ink">The file isn't kept.</span> It's read once, the transactions are saved to your account, and the file is deleted.</span>
              </p>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
