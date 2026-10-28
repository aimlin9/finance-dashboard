import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { motion } from 'motion/react';
import useChartColors from '../../hooks/useChartColors';
import useMoney from '../../hooks/useMoney';
import { category } from '../../lib/categories';
import CategoryIcon from '../ui/CategoryIcon';
import { Legend } from './ChartTooltip';

/**
 * Change in spending per category between two months. Diverging from a
 * neutral centre: right = spent more, left = spent less, with the
 * direction also spelled out in an arrow and the signed amount.
 */
export default function DivergingBars({ rows }) {
  const c = useChartColors();
  const format = useMoney();
  const max = Math.max(...rows.map((r) => Math.abs(r.change)), 1);

  return (
    <div>
      <Legend className="mb-4" items={[{ label: 'Spent less', color: c.down }, { label: 'Spent more', color: c.up }]} />
      <ul className="space-y-3">
        {rows.map((r, i) => {
          const width = (Math.abs(r.change) / max) * 50;
          const more = r.change > 0;
          return (
            <li key={r.slug} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto] items-center gap-3 sm:grid-cols-[180px_1fr_120px]">
              <div className="flex min-w-0 items-center gap-2.5">
                <CategoryIcon slug={r.slug} size={30} />
                <span className="truncate text-sm text-ink">{category(r.slug).name}</span>
              </div>
              <div className="relative h-5">
                <div className="absolute inset-y-0 left-1/2 w-px" style={{ background: c.axis }} />
                {r.change !== 0 && (
                  <motion.div
                    className="absolute top-1/2 h-3 -translate-y-1/2"
                    style={{
                      background: more ? c.up : c.down,
                      [more ? 'left' : 'right']: '50%',
                      borderRadius: more ? '0 4px 4px 0' : '4px 0 0 4px',
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${width}%` }}
                    transition={{ duration: 0.7, delay: i * 0.03, ease: [0.22, 1, 0.36, 1] }}
                  />
                )}
              </div>
              <span className={`num inline-flex items-center justify-end gap-1 text-sm font-medium ${r.change === 0 ? 'text-ink-3' : 'text-ink'}`}>
                {r.change > 0 ? <ArrowUpRight size={14} className="text-neg" /> : r.change < 0 ? <ArrowDownRight size={14} className="text-pos" /> : null}
                {format(r.change, { sign: 'always', compact: true })}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
