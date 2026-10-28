import useMoney from '../../hooks/useMoney';

/** Values lead, labels follow; series keyed by a short stroke, not a box. */
export function TooltipCard({ title, rows }) {
  return (
    <div className="pointer-events-none min-w-[168px] rounded-xl border border-line bg-surface px-3.5 py-3 shadow-md">
      {title && <p className="eyebrow mb-2">{title}</p>}
      <div className="space-y-1.5">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center gap-2.5">
            {row.color && <span className="h-[3px] w-3.5 shrink-0 rounded-full" style={{ background: row.color }} />}
            <span className="num text-sm font-semibold text-ink">{row.value}</span>
            <span className="text-xs text-ink-3">{row.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ChartTooltip({ active, payload, label, labelFormatter, names = {} }) {
  const format = useMoney();
  if (!active || !payload?.length) return null;
  return (
    <TooltipCard
      title={labelFormatter ? labelFormatter(label) : label}
      rows={payload.map((p) => ({
        label: names[p.dataKey] || p.name,
        value: format(p.value),
        color: p.color || p.fill,
      }))}
    />
  );
}

export function Legend({ items, className = '' }) {
  return (
    <ul className={`flex flex-wrap items-center gap-x-4 gap-y-1 ${className}`}>
      {items.map((item) => (
        <li key={item.label} className="inline-flex items-center gap-2 text-xs text-ink-2">
          <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: item.color }} aria-hidden />
          {item.label}
        </li>
      ))}
    </ul>
  );
}
