import { ChevronLeft, ChevronRight } from 'lucide-react';
import { monthLabel } from '../../lib/format';
import cn from '../../lib/cn';

/** ‹ March 2026 › with a native picker behind the label (best on phones). */
export default function MonthSwitcher({ months, month, onChange, older, newer, className }) {
  if (!months.length) return null;
  return (
    <div className={cn('inline-flex h-11 items-center rounded-xl border border-line bg-surface shadow-sm', className)}>
      <button
        type="button"
        onClick={() => older && onChange(older)}
        disabled={!older}
        className="flex h-full w-10 items-center justify-center rounded-l-xl text-ink-2 hover:bg-surface-2 disabled:opacity-30"
        aria-label="Previous month"
      >
        <ChevronLeft size={17} />
      </button>
      <label className="relative flex h-full min-w-[9.5rem] items-center justify-center border-x border-line px-3 text-sm font-medium text-ink">
        <span className="pointer-events-none">{monthLabel(month)}</span>
        <select
          value={month}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 cursor-pointer opacity-0"
          aria-label="Choose month"
        >
          {months.map((m) => (
            <option key={m} value={m}>{monthLabel(m)}</option>
          ))}
        </select>
      </label>
      <button
        type="button"
        onClick={() => newer && onChange(newer)}
        disabled={!newer}
        className="flex h-full w-10 items-center justify-center rounded-r-xl text-ink-2 hover:bg-surface-2 disabled:opacity-30"
        aria-label="Next month"
      >
        <ChevronRight size={17} />
      </button>
    </div>
  );
}
