import { useState } from 'react';
import { motion } from 'motion/react';
import useMoney from '../../hooks/useMoney';

/** Spending by weekday; the heaviest day is emphasised, the rest stay quiet. */
export default function WeekdayChart({ data }) {
  const format = useMoney();
  const [active, setActive] = useState(null);
  const max = Math.max(...data.map((d) => d.amount), 1);
  const top = data.reduce((a, b) => (b.amount > a.amount ? b : a), data[0]);
  const shown = active ?? top;

  return (
    <div>
      <p className="mb-4 text-sm text-ink-2">
        <span className="num font-semibold text-ink">{format(shown.amount)}</span>{' '}
        {active ? `on ${active.day}s` : <>on {top.day}s, your heaviest day</>}
      </p>
      <div className="flex h-36 items-end gap-2" role="list">
        {data.map((d, i) => {
          const isTop = d.day === top.day;
          return (
            <button
              key={d.day}
              type="button"
              role="listitem"
              onMouseEnter={() => setActive(d)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(d)}
              onBlur={() => setActive(null)}
              aria-label={`${d.day}: ${format(d.amount)}`}
              className="group flex h-full flex-1 flex-col items-center justify-end gap-2"
            >
              <motion.span
                className="w-full max-w-[24px] rounded-t-[4px]"
                style={{ background: isTop ? 'var(--accent)' : 'var(--c-mid)', minHeight: d.amount ? 4 : 2 }}
                initial={{ height: 0 }}
                animate={{ height: `${(d.amount / max) * 100}%` }}
                transition={{ duration: 0.7, delay: i * 0.03, ease: [0.22, 1, 0.36, 1] }}
              />
              <span className={`text-[11px] ${isTop ? 'font-semibold text-ink' : 'text-ink-3'}`}>{d.day.slice(0, 2)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
