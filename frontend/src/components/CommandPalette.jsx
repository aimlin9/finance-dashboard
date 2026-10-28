import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command } from 'cmdk';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, Download, LogOut, Moon, Search, Sun, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';
import api, { downloadFile } from '../lib/api';
import { ALL_NAV } from './layout/nav';
import useAuth from '../store/auth';
import useTheme from '../store/theme';
import useMoney from '../hooks/useMoney';
import { date } from '../lib/format';
import { CategoryIcon } from './ui';

function Item({ children, onSelect, icon: Icon, hint, value }) {
  return (
    <Command.Item
      value={value}
      onSelect={onSelect}
      className="flex h-12 cursor-pointer items-center gap-3 rounded-xl px-3 text-sm text-ink-2 data-[selected=true]:bg-surface-2 data-[selected=true]:text-ink"
    >
      {Icon && <Icon size={17} strokeWidth={1.8} className="shrink-0 text-ink-3" />}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {hint}
    </Command.Item>
  );
}

function PaletteBody({ onOpenChange }) {
  const navigate = useNavigate();
  const logout = useAuth((s) => s.logout);
  const { resolved, toggle } = useTheme();
  const format = useMoney();
  const [query, setQuery] = useState('');
  const [found, setFound] = useState({ q: '', items: [] });
  const results = query.trim().length >= 2 && found.q === query.trim() ? found.items : [];

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return undefined;
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/transactions/?search=${encodeURIComponent(q)}&page_size=6`);
        if (!cancelled) setFound({ q, items: res.data.results || [] });
      } catch {
        if (!cancelled) setFound({ q, items: [] });
      }
    }, 220);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [query]);

  const go = (to) => { onOpenChange(false); navigate(to); };

  return (
        <div className="fixed inset-0 z-[60] flex items-start justify-center px-3 pt-[max(12px,env(safe-area-inset-top))] sm:pt-[12vh]">
          <motion.div
            className="absolute inset-0 bg-[rgb(10_11_9/0.45)] backdrop-blur-[2px]"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
          />
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-xl"
          >
            <Command
              label="Command menu"
              shouldFilter={true}
              className="overflow-hidden rounded-2xl border border-line bg-surface shadow-lg"
              onKeyDown={(e) => e.key === 'Escape' && onOpenChange(false)}
            >
              <div className="flex items-center gap-3 border-b border-line px-4">
                <Search size={18} className="text-ink-3" />
                <Command.Input
                  autoFocus
                  value={query}
                  onValueChange={setQuery}
                  placeholder="Search payees, pages or actions"
                  className="h-14 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-3"
                />
                <kbd className="hidden rounded-md border border-line px-1.5 py-0.5 font-mono text-[11px] text-ink-3 sm:block">esc</kbd>
              </div>
              <Command.List className="max-h-[min(60dvh,420px)] overflow-y-auto overscroll-contain p-2">
                <Command.Empty className="px-3 py-8 text-center text-sm text-ink-3">Nothing matches “{query}”.</Command.Empty>

                {results.length > 0 && (
                  <Command.Group heading="Transactions" className="[&_[cmdk-group-heading]]:eyebrow [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2">
                    {results.map((tx) => (
                      <Command.Item
                        key={tx.id}
                        value={`tx ${tx.description} ${tx.id} ${query}`}
                        onSelect={() => go(`/transactions?search=${encodeURIComponent(tx.description.slice(0, 40))}`)}
                        className="flex h-14 cursor-pointer items-center gap-3 rounded-xl px-3 data-[selected=true]:bg-surface-2"
                      >
                        <CategoryIcon slug={tx.category} size={32} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm text-ink">{tx.description}</span>
                          <span className="block text-xs text-ink-3">{date(tx.date)}</span>
                        </span>
                        <span className={`num text-sm font-medium ${tx.type === 'credit' ? 'text-pos' : 'text-ink'}`}>
                          {format(tx.type === 'debit' ? -tx.amount : tx.amount, { sign: 'always' })}
                        </span>
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}

                <Command.Group heading="Go to" className="[&_[cmdk-group-heading]]:eyebrow [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2">
                  {ALL_NAV.map((item) => (
                    <Item key={item.to} value={`go ${item.label}`} icon={item.icon} onSelect={() => go(item.to)} hint={<ArrowRight size={14} className="text-ink-3" />}>
                      {item.label}
                    </Item>
                  ))}
                </Command.Group>

                <Command.Group heading="Actions" className="[&_[cmdk-group-heading]]:eyebrow [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2">
                  <Item value="upload a statement" icon={UploadCloud} onSelect={() => go('/upload')}>Upload a statement</Item>
                  <Item
                    value="export all transactions csv"
                    icon={Download}
                    onSelect={() => {
                      onOpenChange(false);
                      toast.promise(downloadFile('/transactions/export/', 'fintrack_transactions_all.csv'), {
                        loading: 'Preparing CSV…', success: 'CSV downloaded', error: 'Export failed',
                      });
                    }}
                  >
                    Export all transactions (CSV)
                  </Item>
                  <Item value="toggle theme dark light" icon={resolved === 'dark' ? Sun : Moon} onSelect={() => { toggle(); onOpenChange(false); }}>
                    Switch to {resolved === 'dark' ? 'light' : 'dark'} mode
                  </Item>
                  <Item value="sign out log out" icon={LogOut} onSelect={() => { onOpenChange(false); logout(); navigate('/login'); }}>
                    Sign out
                  </Item>
                </Command.Group>
              </Command.List>
            </Command>
          </motion.div>
        </div>
  );
}

export default function CommandPalette({ open, onOpenChange }) {
  return <AnimatePresence>{open && <PaletteBody onOpenChange={onOpenChange} />}</AnimatePresence>;
}
