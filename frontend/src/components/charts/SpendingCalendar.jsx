import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { eachDayOfInterval, endOfMonth, format as fmt, getISODay, isToday } from 'date-fns';
import useChartColors from '../../hooks/useChartColors';
import useMoney from '../../hooks/useMoney';
import { parseDate } from '../../lib/format';
import { TooltipCard } from './ChartTooltip';

/**
 * Daily spending heatmap: one hue, light → dark, six steps by quantile so
 * a single huge rent payment doesn't wash every other day out to "none".
 */
export default function SpendingCalendar({ month, daily }) {
  const c = useChartColors();
  const format = useMoney();
  const navigate = useNavigate();
  const [hover, setHover] = useState(null);

  const { days, offset, thresholds, byDate } = useMemo(() => {
    const start = parseDate(`${month}-01`);
    const days = eachDayOfInterval({ start, end: endOfMonth(start) });
    const byDate = Object.fromEntries((daily || []).map((d) => [d.date, d.amount]));
    const values = Object.values(byDate).filter((v) => v > 0).sort((a, b) => a - b);
    const q = (p) => values[Math.min(values.length - 1, Math.floor(p * values.length))] ?? 0;
    return { days, offset: getISODay(start) - 1, thresholds: [q(0.2), q(0.4), q(0.6), q(0.8)], byDate };
  }, [month, daily]);

  const step = (v) => {
    if (!v) return 0;
    let s = 1;
    for (const t of thresholds) if (v > t) s += 1;
    return Math.min(s, 5);
  };

  const totalDays = Object.keys(byDate).length;

  return (
    <div>
      <div className="grid grid-cols-7 gap-1.5 text-center sm:gap-2">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <span key={i} className="eyebrow pb-1 text-[10px]">{d}</span>
        ))}
        {Array.from({ length: offset }).map((_, i) => <span key={`pad-${i}`} />)}
        {days.map((day) => {
          const key = fmt(day, 'yyyy-MM-dd');
          const amount = byDate[key] || 0;
          const s = step(amount);
          return (
            <button
              key={key}
              type="button"
              onMouseEnter={() => setHover({ key, amount, day })}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover({ key, amount, day })}
              onBlur={() => setHover(null)}
              onClick={() => amount && navigate(`/transactions?date_from=${key}&date_to=${key}`)}
              aria-label={`${fmt(day, 'EEEE d MMMM')}: ${amount ? format(amount) + ' spent' : 'no spending'}`}
              className="relative aspect-square rounded-[7px] text-[11px] transition-transform hover:scale-110 focus-visible:scale-110"
              style={{
                background: c.seq[s],
                color: s >= 4 ? (c.theme === 'dark' ? c.ink : '#fff') : c.ink3,
                cursor: amount ? 'pointer' : 'default',
                boxShadow: isToday(day) ? `inset 0 0 0 1.5px ${c.ink}` : undefined,
              }}
            >
              <span className="num">{fmt(day, 'd')}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex min-h-[52px] items-center justify-between gap-3">
        {hover ? (
          <TooltipCard
            title={fmt(hover.day, 'EEEE, d MMM')}
            rows={[{ label: hover.amount ? 'spent' : 'no spending', value: format(hover.amount) }]}
          />
        ) : (
          <p className="text-xs text-ink-3">
            Spent on {totalDays} of {days.length} days. Tap a day to see its transactions.
          </p>
        )}
        <div className="flex shrink-0 items-center gap-1 text-[11px] text-ink-3" aria-hidden>
          Less
          {c.seq.map((col, i) => <span key={i} className="h-3 w-3 rounded-[3px]" style={{ background: col }} />)}
          More
        </div>
      </div>
    </div>
  );
}
