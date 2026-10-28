import { Link } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import Logo from '../Logo';
import { Button, IconButton } from '../ui';
import useAuth from '../../store/auth';
import useTheme from '../../store/theme';

export function PublicHeader() {
  const status = useAuth((s) => s.status);
  const { resolved, toggle } = useTheme();
  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-bg/80 pt-safe backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Logo />
        <nav className="ml-6 hidden items-center gap-6 text-sm text-ink-2 md:flex">
          <a href="/#how" className="hover:text-ink">How it works</a>
          <a href="/#features" className="hover:text-ink">Features</a>
          <a href="/#privacy" className="hover:text-ink">Privacy</a>
          <Link to="/about" className="hover:text-ink">About</Link>
        </nav>
        <div className="ml-auto flex items-center gap-1.5">
          <IconButton icon={resolved === 'dark' ? Sun : Moon} label="Toggle theme" onClick={toggle} />
          {status === 'in' ? (
            <Button to="/dashboard" size="sm">Open dashboard</Button>
          ) : (
            <>
              <Button to="/login" variant="ghost" size="sm" className="hidden sm:inline-flex">Sign in</Button>
              <Button to="/register" size="sm">Start free</Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="border-t border-line pb-safe">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-3">
            A personal finance dashboard for Ghanaian bank and MoMo statements. Built in Accra.
          </p>
        </div>
        <div>
          <p className="eyebrow mb-3">Product</p>
          <ul className="space-y-2 text-sm text-ink-2">
            <li><Link to="/register" className="hover:text-ink">Create an account</Link></li>
            <li><Link to="/login" className="hover:text-ink">Sign in</Link></li>
            <li><Link to="/about" className="hover:text-ink">About</Link></li>
          </ul>
        </div>
        <div>
          <p className="eyebrow mb-3">Legal</p>
          <ul className="space-y-2 text-sm text-ink-2">
            <li><Link to="/privacy" className="hover:text-ink">Privacy</Link></li>
            <li><Link to="/terms" className="hover:text-ink">Terms</Link></li>
            <li><a href="https://github.com/aimlin9/finance-dashboard" target="_blank" rel="noreferrer" className="hover:text-ink">Source code</a></li>
          </ul>
        </div>
      </div>
      <div className="mx-auto max-w-6xl border-t border-line px-4 py-6 text-xs text-ink-3 sm:px-6">
        © {new Date().getFullYear()} FinTrack Ghana · Not a bank. Not financial advice.
      </div>
    </footer>
  );
}

export default function PublicShell({ children }) {
  return (
    <div className="min-h-dvh">
      <PublicHeader />
      <main>{children}</main>
      <PublicFooter />
    </div>
  );
}
