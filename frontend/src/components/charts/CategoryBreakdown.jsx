import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import useMoney from '../../hooks/useMoney';
import { category } from '../../lib/categories';
import { percent } from '../../lib/format';
import CategoryIcon from '../ui/CategoryIcon';

/**
 * Ranked category spend. One colour for every bar: the categories are
 * identified by name and icon, so hue isn't spent on 14 near-identical colours.
 */
export default function CategoryBreakdown({ breakdown, month, limit = 7 }) {
  const format = useMoney();
  const entries = Object.entries(breakdown || {})
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((s, [, v]) => s + v, 0);
  const max = entries[0]?.[1] || 1;

  let rows = entries;
  if (entries.length > limit) {
    const rest = entries.slice(limit - 1);
    rows = [...entries.slice(0, limit - 1), ['__rest', rest.reduce((s, [, v]) => s + v, 0), rest.length]];
  }

  if (!entries.length) return <p className="py-10 text-center text-sm text-ink-3">No spending recorded this month.</p>;

  return (
    <ul className="-mx-2 space-y-0.5">
      {rows.map(([slug, value, restCount], i) => {
        const isRest = slug === '__rest';
        const meta = category(slug);
        const share = total ? (value / total) * 100 : 0;
        const body = (
          <>
            {isRest ? (
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-surface-2 text-xs font-semibold text-ink-3 ring-1 ring-inset ring-line">
                +{restCount}
              </span>
            ) : (
              <CategoryIcon slug={slug} />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <span className="truncate text-sm font-medium text-ink">{isRest ? `${restCount} smaller categories` : meta.name}</span>
                <span className="num shrink-0 text-sm font-medium text-ink">{format(value)}</span>
              </div>
              <div className="mt-1.5 flex items-center gap-3">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3">
                  <motion.div
                    className="h-full rounded-full bg-accent"
                    style={{ opacity: i === 0 ? 1 : 0.62 }}
                    initial={{ width: 0 }}
                    animate={{ width: `${(value / max) * 100}%` }}
                    transition={{ duration: 0.8, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
                <span className="num w-10 shrink-0 text-right text-xs text-ink-3">{percent(share)}</span>
              </div>
            </div>
            {!isRest && <ChevronRight size={16} className="shrink-0 text-ink-3 opacity-0 transition-opacity group-hover:opacity-100" />}
          </>
        );
        return (
          <li key={slug}>
            {isRest ? (
              <div className="flex items-center gap-3 rounded-xl px-2 py-2.5">{body}</div>
            ) : (
              <Link
                to={`/transactions?category=${slug}${month ? `&month=${month}` : ''}&type=debit`}
                className="group flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-surface-2"
              >
                {body}
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}
