import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { toNumber } from '../../lib/format';
import cn from '../../lib/cn';

/**
 * Change from a previous value. goodWhen says which direction is good
 * (spending going down is good; income going up is good). Direction is
 * carried by the arrow icon and the words, not colour alone.
 */
export default function Delta({ current, previous, goodWhen = 'up', label, className }) {
  const cur = toNumber(current);
  const prev = toNumber(previous);
  if (previous === undefined || previous === null) return null;

  if (prev === 0) {
    return <span className={cn('text-xs text-ink-3', className)}>No data {label}</span>;
  }
  const change = ((cur - prev) / Math.abs(prev)) * 100;
  const flat = Math.abs(change) < 0.5;
  const up = change > 0;
  const good = flat ? null : (up && goodWhen === 'up') || (!up && goodWhen === 'down');
  const Icon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs font-medium',
        good === null ? 'text-ink-3' : good ? 'text-pos' : 'text-neg',
        className,
      )}
    >
      <Icon size={14} strokeWidth={2.2} aria-hidden />
      <span className="num">{flat ? 'Flat' : `${Math.abs(change).toFixed(Math.abs(change) < 10 ? 1 : 0)}%`}</span>
      {label && <span className="font-normal text-ink-3">{label}</span>}
    </span>
  );
}
