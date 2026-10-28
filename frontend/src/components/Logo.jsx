import { Link } from 'react-router-dom';
import cn from '../lib/cn';

/** The cedi sign, drawn rather than typed so it renders identically everywhere. */
export function LogoMark({ size = 32, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden className={className}>
      <rect width="64" height="64" rx="17" fill="var(--accent)" />
      <path d="M43.2 23.4A13.4 13.4 0 1 0 43.2 40.6" fill="none" stroke="var(--accent-ink)" strokeWidth="5.4" strokeLinecap="round" />
      <path d="M31.5 13.5v37" stroke="var(--accent-ink)" strokeWidth="4.2" strokeLinecap="round" />
    </svg>
  );
}

export default function Logo({ to = '/', compact = false, className }) {
  return (
    <Link to={to} className={cn('inline-flex items-center gap-2.5', className)} aria-label="FinTrack Ghana home">
      <LogoMark size={compact ? 30 : 32} />
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="display text-[19px] font-medium tracking-[-0.03em] text-ink">FinTrack</span>
          <span className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.22em] text-ink-3">Ghana</span>
        </span>
      )}
    </Link>
  );
}
