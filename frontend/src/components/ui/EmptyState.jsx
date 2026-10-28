import cn from '../../lib/cn';

/** A ledger page with nothing written on it yet. */
function LedgerArt() {
  return (
    <svg width="120" height="92" viewBox="0 0 120 92" fill="none" aria-hidden className="text-line-strong">
      <rect x="18" y="6" width="84" height="80" rx="8" className="fill-surface" stroke="currentColor" strokeWidth="1.5" />
      <path d="M34 6v80" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 3" />
      {[24, 36, 48, 60, 72].map((y) => (
        <path key={y} d={`M40 ${y}h52`} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity={y > 40 ? 0.45 : 1} />
      ))}
      <circle cx="94" cy="72" r="15" className="fill-accent-soft" />
      <path d="M94 65v14M87 72h14" className="stroke-accent" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function EmptyState({ title, children, action, className, art = true }) {
  return (
    <div className={cn('flex flex-col items-center px-6 py-14 text-center', className)}>
      {art && <LedgerArt />}
      <h3 className="display mt-5 text-xl font-medium text-ink">{title}</h3>
      {children && <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-3">{children}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry, className }) {
  return (
    <div className={cn('rounded-2xl border border-dashed border-line-strong px-6 py-10 text-center', className)}>
      <p className="text-sm font-medium text-ink">Couldn't load this</p>
      <p className="mt-1 text-sm text-ink-3">{error?.response?.data?.detail || "The server didn't respond as expected."}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="mt-4 text-sm font-medium text-accent underline-offset-4 hover:underline">
          Try again
        </button>
      )}
    </div>
  );
}
