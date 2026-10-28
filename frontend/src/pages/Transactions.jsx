import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowDown, ArrowUp, Check, Download, FileText, Filter, Search, SlidersHorizontal, X,
} from 'lucide-react';
import { toast } from 'sonner';
import api, { downloadFile, errorMessage } from '../lib/api';
import { invalidate, useQuery } from '../lib/query';
import { CATEGORIES, category } from '../lib/categories';
import { date, monthLabel, monthKey, plural } from '../lib/format';
import { payeeName } from '../lib/payee';
import useMoney from '../hooks/useMoney';
import useMediaQuery from '../hooks/useMediaQuery';
import {
  Badge, Button, CategoryIcon, CategoryPill, EmptyState, ErrorState, Input, PageHeader, Segmented, Select, Sheet,
  Skeleton, Spinner, Textarea,
} from '../components/ui';
import cn from '../lib/cn';

const FILTER_KEYS = ['search', 'category', 'type', 'month', 'date_from', 'date_to', 'min_amount', 'max_amount', 'ordering'];
const PAGE_SIZE = 50;

function useFilters() {
  const [params, setParams] = useSearchParams();
  const filters = Object.fromEntries(FILTER_KEYS.map((k) => [k, params.get(k) || '']));
  const set = useCallback((changes) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
      return next;
    }, { replace: true });
  }, [setParams]);
  return [filters, set];
}

function toQuery(filters, page) {
  const q = new URLSearchParams();
  FILTER_KEYS.forEach((k) => filters[k] && q.set(k, filters[k]));
  q.set('page_size', PAGE_SIZE);
  if (page) q.set('page', page);
  return q.toString();
}

function CategoryGrid({ value, onChange, type }) {
  const options = CATEGORIES.filter((c) => (type === 'credit' ? true : c.slug !== 'income'));
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {options.map((c) => {
        const active = c.slug === value;
        return (
          <button
            key={c.slug}
            type="button"
            onClick={() => onChange(c.slug)}
            aria-pressed={active}
            className={cn(
              'flex h-12 items-center gap-2 rounded-xl border px-3 text-left text-[13px] font-medium transition-colors',
              active ? 'border-accent bg-accent-soft text-accent' : 'border-line text-ink-2 hover:border-line-strong hover:bg-surface-2',
            )}
          >
            <c.icon size={16} strokeWidth={1.8} className="shrink-0" />
            <span className="truncate">{c.name}</span>
            {active && <Check size={14} className="ml-auto shrink-0" />}
          </button>
        );
      })}
    </div>
  );
}

function Toggle({ checked, onChange, label, description }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl p-1">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn('relative mt-0.5 h-6 w-10 shrink-0 rounded-full transition-colors', checked ? 'bg-accent' : 'bg-surface-3')}
      >
        <motion.span
          className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm"
          animate={{ left: checked ? 18 : 2 }}
          transition={{ type: 'spring', stiffness: 600, damping: 35 }}
        />
      </button>
      <span>
        <span className="block text-sm font-medium text-ink">{label}</span>
        {description && <span className="block text-[13px] text-ink-3">{description}</span>}
      </span>
    </label>
  );
}

function TransactionSheet({ tx, onClose, onSaved }) {
  const format = useMoney();
  const [cat, setCat] = useState(tx?.category);
  const [note, setNote] = useState(tx?.note || '');
  const [similar, setSimilar] = useState(true);
  const [remember, setRemember] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setCat(tx?.category);
    setNote(tx?.note || '');
  }, [tx]);

  if (!tx) return <Sheet open={false} onOpenChange={onClose} title="" />;
  const payee = payeeName(tx.description);
  const changed = cat !== tx.category || note !== (tx.note || '');
  const howCategorized = tx.is_manually_edited
    ? 'You set this category.'
    : tx.category_confidence >= 1
      ? 'Matched by a keyword or one of your rules.'
      : tx.category_confidence >= 0.9
        ? 'Inferred from the direction of the payment.'
        : tx.category_confidence > 0.5
          ? `Suggested by the language model (${Math.round(tx.category_confidence * 100)}% sure).`
          : "Nothing matched, so it's filed under Other. Pick the right category below.";

  const save = async () => {
    setSaving(true);
    try {
      const body = { note };
      if (cat !== tx.category) Object.assign(body, { category: cat, apply_to_similar: similar && !!payee, remember: remember && !!payee });
      const res = await api.patch(`/transactions/${tx.id}/edit/`, body);
      const extra = res.data.updated_similar ? ` and ${plural(res.data.updated_similar, 'similar payment')}` : '';
      toast.success(cat !== tx.category ? `Moved to ${category(cat).name}${extra}` : 'Note saved', {
        description: res.data.rule ? `Future “${payee}” payments will be filed the same way.` : undefined,
      });
      invalidate('/analytics/', '/transactions/');
      onSaved(res.data);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet
      open={!!tx}
      onOpenChange={(o) => !o && onClose()}
      title={tx.type === 'credit' ? 'Money in' : 'Money out'}
      description={date(tx.date, 'EEEE, d MMMM yyyy')}
      size="lg"
      footer={
        <>
          <Button variant="secondary" className="flex-1" onClick={onClose}>Close</Button>
          <Button className="flex-1" onClick={save} loading={saving} disabled={!changed}>Save changes</Button>
        </>
      }
    >
      <div className="space-y-6">
        <div className="rounded-2xl border border-line bg-surface-2/60 p-5">
          <p className={cn('display num text-[40px] leading-none tracking-[-0.03em]', tx.type === 'credit' ? 'text-pos' : 'text-ink')}>
            {format(tx.type === 'debit' ? -tx.amount : tx.amount, { sign: 'always' })}
          </p>
          <p className="mt-3 break-words font-mono text-[13px] leading-relaxed text-ink-2">{tx.description}</p>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-[13px]">
            {tx.balance_after && (
              <div><dt className="text-ink-3">Balance after</dt><dd className="num font-medium text-ink">{format(tx.balance_after)}</dd></div>
            )}
            {tx.statement_name && (
              <div className="min-w-0"><dt className="text-ink-3">From statement</dt><dd className="truncate font-medium text-ink">{tx.statement_name}</dd></div>
            )}
          </dl>
        </div>

        <div>
          <div className="mb-2 flex items-baseline justify-between">
            <h3 className="text-sm font-semibold text-ink">Category</h3>
            {tx.is_manually_edited && <Badge tone="accent">Edited by you</Badge>}
          </div>
          <p className="mb-3 text-[13px] text-ink-3">{howCategorized}</p>
          <CategoryGrid value={cat} onChange={setCat} type={tx.type} />
          <AnimatePresence>
            {cat !== tx.category && payee && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-4 space-y-3 rounded-2xl border border-line p-4">
                  <Toggle checked={similar} onChange={setSimilar} label={`Also move other “${payee}” payments`} description="Updates past transactions from the same payee." />
                  <Toggle checked={remember} onChange={setRemember} label="Remember for future uploads" description="Saved as a rule you can manage under Category rules." />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Textarea label="Note" placeholder="e.g. Ama's school fees, split with Kwame" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
      </div>
    </Sheet>
  );
}

function FiltersPanel({ filters, setFilters, months, onDone }) {
  return (
    <div className="space-y-4">
      <Select label="Category" value={filters.category} onChange={(e) => setFilters({ category: e.target.value })}>
        <option value="">All categories</option>
        {CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
      </Select>
      <Select label="Month" value={filters.month} onChange={(e) => setFilters({ month: e.target.value, date_from: '', date_to: '' })}>
        <option value="">Any month</option>
        {months.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
      </Select>
      <div className="grid grid-cols-2 gap-3">
        <Input label="From" type="date" value={filters.date_from} onChange={(e) => setFilters({ date_from: e.target.value, month: '' })} />
        <Input label="To" type="date" value={filters.date_to} onChange={(e) => setFilters({ date_to: e.target.value, month: '' })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Min amount" inputMode="decimal" prefix="GH₵" value={filters.min_amount} onChange={(e) => setFilters({ min_amount: e.target.value.replace(/[^\d.]/g, '') })} />
        <Input label="Max amount" inputMode="decimal" prefix="GH₵" value={filters.max_amount} onChange={(e) => setFilters({ max_amount: e.target.value.replace(/[^\d.]/g, '') })} />
      </div>
      {onDone && <Button className="w-full" onClick={onDone}>Show results</Button>}
    </div>
  );
}

export default function Transactions() {
  const [filters, setFilters] = useFilters();
  const format = useMoney();
  const desktop = useMediaQuery('(min-width: 768px)');
  const monthsQ = useQuery('/analytics/monthly/');
  const months = (monthsQ.data?.months || []).map(monthKey);

  const [rows, setRows] = useState([]);
  const [count, setCount] = useState(0);
  const [next, setNext] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [openTx, setOpenTx] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [bulkCat, setBulkCat] = useState('');
  const [searchText, setSearchText] = useState(filters.search);
  const queryKey = toQuery(filters);
  const requestId = useRef(0);

  // Debounce typing into the URL
  useEffect(() => {
    const t = setTimeout(() => searchText !== filters.search && setFilters({ search: searchText }), 300);
    return () => clearTimeout(t);
  }, [searchText]); // eslint-disable-line react-hooks/exhaustive-deps

  const load = useCallback(async (pageNumber) => {
    const id = ++requestId.current;
    pageNumber === 1 ? setLoading(true) : setLoadingMore(true);
    try {
      const res = await api.get(`/transactions/?${toQuery(filters, pageNumber)}`);
      if (id !== requestId.current) return;
      setRows((prev) => (pageNumber === 1 ? res.data.results : [...prev, ...res.data.results]));
      setCount(res.data.count);
      setNext(res.data.next);
      setPage(pageNumber);
      setError(null);
    } catch (e) {
      if (id === requestId.current) setError(e);
    } finally {
      if (id === requestId.current) { setLoading(false); setLoadingMore(false); }
    }
  }, [queryKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setSelected(new Set());
    load(1);
  }, [load]);

  const groups = useMemo(() => {
    const out = [];
    for (const tx of rows) {
      const last = out[out.length - 1];
      if (last && last.date === tx.date) last.items.push(tx);
      else out.push({ date: tx.date, items: [tx] });
    }
    return out;
  }, [rows]);

  const activeChips = [
    filters.category && { key: 'category', label: category(filters.category).name },
    filters.month && { key: 'month', label: monthLabel(filters.month) },
    filters.date_from && { key: 'date_from', label: `From ${date(filters.date_from, 'd MMM')}` },
    filters.date_to && { key: 'date_to', label: `To ${date(filters.date_to, 'd MMM')}` },
    filters.min_amount && { key: 'min_amount', label: `≥ GH₵ ${filters.min_amount}` },
    filters.max_amount && { key: 'max_amount', label: `≤ GH₵ ${filters.max_amount}` },
  ].filter(Boolean);
  const anyFilter = activeChips.length > 0 || filters.search || filters.type;

  const toggleSort = (field) => {
    const current = filters.ordering || '-date';
    const nextOrder = current === `-${field}` ? field : `-${field}`;
    setFilters({ ordering: nextOrder === '-date' ? '' : nextOrder });
  };
  const sortIcon = (field) => {
    const current = filters.ordering || '-date';
    if (current === field) return <ArrowUp size={13} />;
    if (current === `-${field}`) return <ArrowDown size={13} />;
    return null;
  };

  const exportCsv = () => toast.promise(
    downloadFile(`/transactions/export/?${queryKey}`, `fintrack_${filters.month || 'transactions'}.csv`),
    { loading: 'Preparing CSV…', success: 'CSV downloaded', error: 'Export failed' },
  );

  const bulkApply = async (slug) => {
    try {
      const res = await api.post('/transactions/bulk-categorize/', { ids: [...selected], category: slug });
      toast.success(`Moved ${plural(res.data.updated, 'transaction')} to ${category(slug).name}`);
      invalidate('/analytics/', '/transactions/');
      setBulkCat('');
      load(1);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const toggle = (id) => setSelected((s) => {
    const n = new Set(s);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  return (
    <div>
      <PageHeader
        eyebrow={filters.month ? monthLabel(filters.month) : 'All statements'}
        title="Transactions"
        description={loading ? ' ' : `${plural(count, 'transaction')}${anyFilter ? ' match your filters' : ''}.`}
        actions={
          <>
            <Button variant="secondary" icon={Download} onClick={exportCsv}>Export</Button>
            <Button variant="secondary" icon={FileText} to={`/report${filters.month ? `?month=${filters.month}` : ''}`}>Report</Button>
          </>
        }
      />

      {/* Filter row */}
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
        <label className="relative flex-1">
          <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3" />
          <input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search descriptions — Shoprite, ECG, Kofi…"
            className="h-11 w-full rounded-xl border border-line bg-surface pl-10 pr-10 text-[15px] text-ink shadow-sm outline-none placeholder:text-ink-3 focus:border-accent"
            aria-label="Search transactions"
          />
          {searchText && (
            <button type="button" onClick={() => setSearchText('')} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-ink-3 hover:text-ink" aria-label="Clear search">
              <X size={15} />
            </button>
          )}
        </label>
        <div className="flex items-center gap-2">
          <Segmented
            label="Direction"
            value={filters.type}
            onChange={(v) => setFilters({ type: v })}
            options={[{ value: '', label: 'All' }, { value: 'debit', label: 'Out' }, { value: 'credit', label: 'In' }]}
          />
          {desktop ? (
            <>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ category: e.target.value })}
                className="h-11 rounded-xl border border-line bg-surface px-3 text-sm text-ink shadow-sm outline-none focus:border-accent"
                aria-label="Category"
              >
                <option value="">All categories</option>
                {CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
              </select>
              <Button variant="secondary" icon={SlidersHorizontal} onClick={() => setFiltersOpen(true)}>More</Button>
            </>
          ) : (
            <Button variant="secondary" icon={Filter} onClick={() => setFiltersOpen(true)} className="ml-auto">
              Filters{activeChips.length ? ` · ${activeChips.length}` : ''}
            </Button>
          )}
        </div>
      </div>

      {activeChips.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {activeChips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => setFilters({ [chip.key]: '' })}
              className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line bg-surface pl-3 pr-2 text-xs font-medium text-ink-2 hover:border-line-strong"
            >
              {chip.label} <X size={13} />
            </button>
          ))}
          <button type="button" onClick={() => { setSearchText(''); setFilters(Object.fromEntries(FILTER_KEYS.map((k) => [k, '']))); }} className="text-xs font-medium text-accent hover:underline">
            Clear all
          </button>
        </div>
      )}

      {/* Bulk actions */}
      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="fixed inset-x-3 bottom-[calc(76px+env(safe-area-inset-bottom))] z-40 mx-auto flex max-w-xl items-center gap-3 rounded-2xl bg-ink p-3 pl-4 text-bg shadow-lg lg:bottom-6"
          >
            <span className="text-sm font-medium">{selected.size} selected</span>
            <select
              value={bulkCat}
              onChange={(e) => e.target.value && bulkApply(e.target.value)}
              className="ml-auto h-10 rounded-xl bg-bg/10 px-3 text-sm text-bg outline-none"
              aria-label="Move selected to category"
            >
              <option value="">Move to…</option>
              {CATEGORIES.map((c) => <option key={c.slug} value={c.slug} className="text-ink">{c.name}</option>)}
            </select>
            <button type="button" onClick={() => setSelected(new Set())} className="rounded-lg p-2 hover:bg-bg/10" aria-label="Clear selection">
              <X size={17} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {error ? (
        <ErrorState error={error} onRetry={() => load(1)} />
      ) : loading ? (
        <div className="card divide-y divide-line">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-4"><Skeleton className="h-9 w-9 rounded-xl" /><Skeleton className="h-4 flex-1" /><Skeleton className="h-4 w-20" /></div>
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="card">
          <EmptyState
            title={anyFilter ? 'No matches' : 'No transactions yet'}
            action={anyFilter ? null : <Button to="/upload">Upload a statement</Button>}
          >
            {anyFilter ? 'Try a different search or clear a filter.' : 'Upload a bank or MoMo statement and every line will appear here.'}
          </EmptyState>
        </div>
      ) : desktop ? (
        <div className="card overflow-hidden">
          <table className="w-full table-fixed text-sm">
            <thead className="border-b border-line bg-surface-2/50 text-left text-xs text-ink-3">
              <tr>
                <th className="w-12 py-3 pl-5">
                  <input
                    type="checkbox"
                    aria-label="Select all shown"
                    className="h-4 w-4 accent-[var(--accent)]"
                    checked={selected.size > 0 && selected.size === rows.length}
                    onChange={(e) => setSelected(e.target.checked ? new Set(rows.map((r) => r.id)) : new Set())}
                  />
                </th>
                <th className="w-32 py-3 font-medium">
                  <button type="button" onClick={() => toggleSort('date')} className="inline-flex items-center gap-1 hover:text-ink">Date {sortIcon('date')}</button>
                </th>
                <th className="py-3 font-medium">Description</th>
                <th className="w-48 py-3 font-medium">Category</th>
                <th className="w-40 py-3 pr-5 text-right font-medium">
                  <button type="button" onClick={() => toggleSort('amount')} className="inline-flex items-center gap-1 hover:text-ink">Amount {sortIcon('amount')}</button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((tx) => (
                <tr
                  key={tx.id}
                  onClick={() => setOpenTx(tx)}
                  className={cn('cursor-pointer transition-colors hover:bg-surface-2/60', selected.has(tx.id) && 'bg-accent-soft/50')}
                >
                  <td className="py-3 pl-5" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" aria-label="Select" className="h-4 w-4 accent-[var(--accent)]" checked={selected.has(tx.id)} onChange={() => toggle(tx.id)} />
                  </td>
                  <td className="num py-3 text-ink-3">{date(tx.date, 'd MMM yyyy')}</td>
                  <td className="py-3 pr-4">
                    <span className="block truncate text-ink">{tx.description}</span>
                    {tx.note && <span className="block truncate text-xs text-ink-3">{tx.note}</span>}
                  </td>
                  <td className="py-3"><CategoryPill slug={tx.category} /></td>
                  <td className={cn('num py-3 pr-5 text-right font-medium', tx.type === 'credit' ? 'text-pos' : 'text-ink')}>
                    {format(tx.type === 'debit' ? -tx.amount : tx.amount, { sign: 'always' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-5">
          {groups.map((g) => {
            const out = g.items.filter((t) => t.type === 'debit').reduce((s, t) => s + parseFloat(t.amount), 0);
            return (
              <section key={g.date}>
                <div className="mb-2 flex items-baseline justify-between px-1">
                  <h3 className="text-[13px] font-semibold text-ink">{date(g.date, 'EEEE, d MMM')}</h3>
                  {out > 0 && <span className="num text-xs text-ink-3">{format(-out)}</span>}
                </div>
                <ul className="card divide-y divide-line">
                  {g.items.map((tx) => (
                    <li key={tx.id}>
                      <button type="button" onClick={() => setOpenTx(tx)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-surface-2">
                        <CategoryIcon slug={tx.category} size={38} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[14px] font-medium text-ink">{payeeName(tx.description) || tx.description}</span>
                          <span className="block truncate text-xs text-ink-3">{category(tx.category).name}{tx.note ? ` · ${tx.note}` : ''}</span>
                        </span>
                        <span className={cn('num shrink-0 text-[14px] font-semibold', tx.type === 'credit' ? 'text-pos' : 'text-ink')}>
                          {format(tx.type === 'debit' ? -tx.amount : tx.amount, { sign: 'always' })}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      {next && !loading && (
        <div className="mt-6 flex justify-center">
          <Button variant="secondary" onClick={() => load(page + 1)} loading={loadingMore}>
            Load more · {count - rows.length} left
          </Button>
        </div>
      )}
      {!next && rows.length > PAGE_SIZE && (
        <p className="mt-6 text-center text-xs text-ink-3">That's everything. <Link to="/upload" className="text-accent">Upload another statement</Link></p>
      )}
      {loadingMore && <div className="mt-4 flex justify-center text-ink-3"><Spinner /></div>}

      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen} title="Filters" description="Narrow down by category, date or amount.">
        <FiltersPanel filters={filters} setFilters={setFilters} months={months} onDone={() => setFiltersOpen(false)} />
      </Sheet>

      <TransactionSheet
        tx={openTx}
        onClose={() => setOpenTx(null)}
        onSaved={(updated) => {
          setOpenTx(null);
          if (updated.updated_similar) load(1);
          else setRows((rs) => rs.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)));
        }}
      />
    </div>
  );
}
