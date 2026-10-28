import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  Search, Bell, Moon, Sun, LogOut, LayoutGrid, ArrowLeftRight, Plus, Wallet, Menu, ChevronsLeft, ChevronsRight,
} from 'lucide-react';
import Logo, { LogoMark } from '../Logo';
import { IconButton } from '../ui';
import { NAV_SECTIONS, titleFor } from './nav';
import CommandPalette from '../CommandPalette';
import Notifications from '../Notifications';
import { useAlertCount } from '../../hooks/useAlerts';
import MoreSheet from './MoreSheet';
import useAuth from '../../store/auth';
import useTheme from '../../store/theme';
import cn from '../../lib/cn';

function useCollapsed() {
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('sidebar') === 'collapsed'; } catch { return false; }
  });
  const toggle = () => setCollapsed((c) => {
    try { localStorage.setItem('sidebar', c ? 'open' : 'collapsed'); } catch { /* not persisted */ }
    return !c;
  });
  return [collapsed, toggle];
}

function Avatar({ name, size = 32 }) {
  const initials = (name || '?').split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-gold-soft font-mono text-[11px] font-medium text-gold ring-1 ring-inset ring-line"
      style={{ width: size, height: size }}
      aria-hidden
    >
      {initials}
    </span>
  );
}

function Sidebar({ collapsed, onToggle }) {
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const navigate = useNavigate();

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-line bg-surface transition-[width] duration-300 ease-out lg:flex',
        collapsed ? 'w-[76px]' : 'w-[252px]',
      )}
    >
      <div className={cn('flex h-[72px] items-center', collapsed ? 'justify-center' : 'px-5')}>
        {collapsed ? <LogoMark size={32} /> : <Logo to="/dashboard" />}
      </div>

      <nav className="scrollbar-none flex-1 overflow-y-auto px-3 pb-4" aria-label="Main">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="mt-5 first:mt-1">
            {!collapsed && <p className="eyebrow mb-1.5 px-3 text-[10px]">{section.label}</p>}
            <ul className="space-y-0.5">
              {section.items.map(({ to, label, icon: Icon }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    title={collapsed ? label : undefined}
                    className={({ isActive }) => cn(
                      'group relative flex h-10 items-center gap-3 rounded-[11px] text-[14px] transition-colors',
                      collapsed ? 'justify-center' : 'px-3',
                      isActive ? 'bg-surface-2 font-medium text-ink' : 'text-ink-2 hover:bg-surface-2/70 hover:text-ink',
                    )}
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <motion.span
                            layoutId="nav-active"
                            className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-accent"
                            transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                          />
                        )}
                        <Icon size={18} strokeWidth={isActive ? 2 : 1.7} className={isActive ? 'text-accent' : ''} />
                        {!collapsed && label}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-line p-3">
        <div className={cn('flex items-center gap-3 rounded-xl p-2', collapsed && 'justify-center')}>
          <Avatar name={user?.full_name} />
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">{user?.full_name}</p>
              <p className="truncate text-xs text-ink-3">{user?.email}</p>
            </div>
          )}
          {!collapsed && (
            <IconButton
              icon={LogOut}
              label="Sign out"
              size={34}
              iconSize={16}
              onClick={() => { logout(); navigate('/login'); }}
            />
          )}
        </div>
        <button
          type="button"
          onClick={onToggle}
          className="mt-1 flex h-9 w-full items-center justify-center gap-2 rounded-lg text-xs text-ink-3 hover:bg-surface-2 hover:text-ink-2"
        >
          {collapsed ? <ChevronsRight size={16} /> : <><ChevronsLeft size={16} /> Collapse</>}
        </button>
      </div>
    </aside>
  );
}

function TabBar({ onMore }) {
  const { pathname } = useLocation();
  const tabs = [
    { to: '/dashboard', label: 'Overview', icon: LayoutGrid },
    { to: '/transactions', label: 'Activity', icon: ArrowLeftRight },
    { to: '/upload', label: 'Upload', icon: Plus, primary: true },
    { to: '/budget', label: 'Budgets', icon: Wallet },
  ];
  const moreActive = !tabs.some((t) => pathname.startsWith(t.to));

  return (
    <nav
      className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/92 backdrop-blur-xl lg:hidden"
      aria-label="Main"
    >
      <ul className="mx-auto flex max-w-lg items-stretch px-2 pb-safe">
        {tabs.map(({ to, label, icon: Icon, primary }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              className={({ isActive }) => cn(
                'flex h-[62px] flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors',
                isActive && !primary ? 'text-accent' : 'text-ink-3',
              )}
            >
              {({ isActive }) => primary ? (
                <>
                  <span className={cn(
                    'flex h-9 w-12 items-center justify-center rounded-[13px] bg-accent text-accent-ink shadow-sm transition-transform active:scale-95',
                    isActive && 'ring-4 ring-accent-soft',
                  )}>
                    <Icon size={20} strokeWidth={2.2} />
                  </span>
                  <span className="sr-only">{label}</span>
                </>
              ) : (
                <>
                  <Icon size={21} strokeWidth={isActive ? 2.1 : 1.7} />
                  {label}
                </>
              )}
            </NavLink>
          </li>
        ))}
        <li className="flex-1">
          <button
            type="button"
            onClick={onMore}
            className={cn('flex h-[62px] w-full flex-col items-center justify-center gap-1 text-[11px] font-medium', moreActive ? 'text-accent' : 'text-ink-3')}
          >
            <Menu size={21} strokeWidth={moreActive ? 2.1 : 1.7} />
            More
          </button>
        </li>
      </ul>
    </nav>
  );
}

export default function AppShell({ children }) {
  const [collapsed, toggleCollapsed] = useCollapsed();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const { resolved, toggle } = useTheme();
  const location = useLocation();
  const alertCount = useAlertCount();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

  return (
    <div className="min-h-dvh">
      <Sidebar collapsed={collapsed} onToggle={toggleCollapsed} />

      <div className={cn('transition-[padding] duration-300 ease-out', collapsed ? 'lg:pl-[76px]' : 'lg:pl-[252px]')}>
        <header
          className={cn(
            'no-print sticky top-0 z-20 pt-safe transition-[background-color,border-color,backdrop-filter]',
            scrolled ? 'border-b border-line bg-bg/85 backdrop-blur-xl' : 'border-b border-transparent',
          )}
        >
          <div className="mx-auto flex h-16 max-w-[1320px] items-center gap-3 px-4 sm:px-6 lg:h-[72px] lg:px-10">
            <div className="flex min-w-0 flex-1 items-center gap-3 lg:hidden">
              <LogoMark size={30} />
              <span className="truncate text-[15px] font-semibold text-ink">{titleFor(location.pathname)}</span>
            </div>

            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="hidden h-11 w-full max-w-md items-center gap-3 rounded-xl border border-line bg-surface px-3.5 text-left text-sm text-ink-3 shadow-sm transition-colors hover:border-line-strong lg:flex"
            >
              <Search size={17} />
              <span className="flex-1">Search transactions, pages, actions…</span>
              <kbd className="rounded-md border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-[11px]">{isMac ? '⌘' : 'Ctrl'} K</kbd>
            </button>

            <div className="ml-auto flex items-center gap-1">
              <IconButton icon={Search} label="Search" onClick={() => setPaletteOpen(true)} className="lg:hidden" />
              <IconButton icon={Bell} label="Alerts" badge={alertCount || null} onClick={() => setAlertsOpen(true)} />
              <IconButton icon={resolved === 'dark' ? Sun : Moon} label={resolved === 'dark' ? 'Light mode' : 'Dark mode'} onClick={toggle} className="hidden sm:inline-flex" />
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1320px] px-4 pb-[calc(96px+env(safe-area-inset-bottom))] pt-2 sm:px-6 lg:px-10 lg:pb-16 lg:pt-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <TabBar onMore={() => setMoreOpen(true)} />
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      <Notifications open={alertsOpen} onOpenChange={setAlertsOpen} />
      <MoreSheet open={moreOpen} onOpenChange={setMoreOpen} />
    </div>
  );
}
