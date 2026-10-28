import { useId } from 'react';
import { motion } from 'motion/react';
import cn from '../../lib/cn';

/** iOS-style segmented control with a sliding indicator. */
export default function Segmented({ options, value, onChange, className, size = 'md', label }) {
  const id = useId();
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn('inline-flex rounded-xl border border-line bg-surface-2 p-1', className)}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              'relative flex-1 whitespace-nowrap rounded-[9px] font-medium transition-colors',
              size === 'sm' ? 'h-7 px-2.5 text-xs' : 'h-9 px-3.5 text-[13px]',
              active ? 'text-ink' : 'text-ink-3 hover:text-ink-2',
            )}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 rounded-[9px] bg-surface shadow-sm ring-1 ring-line"
                transition={{ type: 'spring', stiffness: 500, damping: 38 }}
              />
            )}
            <span className="relative inline-flex items-center gap-1.5">
              {opt.icon && <opt.icon size={14} aria-hidden />}
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
