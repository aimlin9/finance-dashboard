import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Table2, BarChart3 } from 'lucide-react';
import useChartColors from '../../hooks/useChartColors';
import useMoney from '../../hooks/useMoney';
import { monthLabel, toNumber } from '../../lib/format';
import ChartTooltip, { Legend } from './ChartTooltip';

/**
 * Income vs spending per month: two series on one axis (both cedis),
 * grouped columns, selected month emphasised. Includes a table view.
 */
export default function CashflowChart({ trend, selected, height = 260, onSelect }) {
  const c = useChartColors();
  const format = useMoney();
  const [asTable, setAsTable] = useState(false);
  const data = trend.slice(-12).map((m) => ({
    key: m.month.slice(0, 7),
    label: monthLabel(m.month, trend.length > 6 ? 'MMM' : 'MMM yy'),
    income: toNumber(m.total_income),
    expenses: toNumber(m.total_expenses),
    net: toNumber(m.net_savings),
  }));

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <Legend items={[{ label: 'Money in', color: c.income }, { label: 'Money out', color: c.expense }]} />
        <button
          type="button"
          onClick={() => setAsTable((v) => !v)}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-ink-3 hover:bg-surface-2 hover:text-ink"
        >
          {asTable ? <BarChart3 size={14} /> : <Table2 size={14} />}
          {asTable ? 'Chart' : 'Table'}
        </button>
      </div>

      {asTable ? (
        <div className="overflow-x-auto">
          <table className="num w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-ink-3">
                <th className="py-2 font-medium">Month</th>
                <th className="py-2 text-right font-medium">In</th>
                <th className="py-2 text-right font-medium">Out</th>
                <th className="py-2 text-right font-medium">Net</th>
              </tr>
            </thead>
            <tbody>
              {[...data].reverse().map((d) => (
                <tr key={d.key} className="border-t border-line">
                  <td className="py-2.5 text-ink-2">{monthLabel(d.key, 'MMM yyyy')}</td>
                  <td className="py-2.5 text-right text-ink">{format(d.income)}</td>
                  <td className="py-2.5 text-right text-ink">{format(d.expenses)}</td>
                  <td className={`py-2.5 text-right font-medium ${d.net < 0 ? 'text-neg' : 'text-pos'}`}>{format(d.net, { sign: 'always' })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ height }} className="-ml-2">
          <ResponsiveContainer>
            <BarChart data={data} barGap={2} barCategoryGap="28%" margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid vertical={false} stroke={c.grid} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={{ stroke: c.axis }}
                tick={{ fill: c.ink3, fontSize: 12 }}
                dy={6}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: c.ink3, fontSize: 12 }}
                tickFormatter={(v) => format(v, { compact: true }).replace('≈ ', '')}
                width={68}
              />
              <Tooltip
                cursor={{ fill: c.surface2 }}
                content={<ChartTooltip names={{ income: 'Money in', expenses: 'Money out' }} />}
              />
              {['income', 'expenses'].map((key) => (
                <Bar
                  key={key}
                  dataKey={key}
                  name={key === 'income' ? 'Money in' : 'Money out'}
                  fill={key === 'income' ? c.income : c.expense}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={22}
                  onClick={(d) => onSelect?.(d.key)}
                  style={{ cursor: onSelect ? 'pointer' : 'default' }}
                  isAnimationActive
                  animationDuration={700}
                >
                  {data.map((d) => (
                    <Cell key={d.key} fillOpacity={!selected || d.key === selected ? 1 : 0.38} />
                  ))}
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
