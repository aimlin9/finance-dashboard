import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight } from 'lucide-react';
import api from '../api/client';
import toast from 'react-hot-toast';

const CATEGORY_COLORS = {
  food: '#10B981',
  transport: '#6366F1',
  utilities: '#F59E0B',
  entertainment: '#EC4899',
  health: '#EF4444',
  shopping: '#8B5CF6',
  income: '#22D3EE',
  savings: '#64748B',
  other: '#94A3B8',
};

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [months, setMonths] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [insight, setInsight] = useState('');
  const [insightLoading, setInsightLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch available months
  useEffect(() => {
    const fetchMonths = async () => {
      try {
        const res = await api.get('/analytics/monthly/');
        const monthList = res.data.months || [];
        setMonths(monthList);
        if (monthList.length > 0) {
          const latest = monthList[0];
          setSelectedMonth(latest.substring(0, 7));
        }
      } catch {
        toast.error('Failed to load months');
      }
    };
    fetchMonths();
  }, []);

  // Fetch dashboard data when month changes
  useEffect(() => {
    if (!selectedMonth) {
      setLoading(false);
      return;
    }

    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/analytics/dashboard/?month=${selectedMonth}`);
        setSummary(res.data);
        if (res.data.ai_insight) {
          setInsight(res.data.ai_insight);
        }
      } catch {
        setSummary(null);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [selectedMonth]);

  const fetchInsight = async () => {
    setInsightLoading(true);
    try {
      const res = await api.get(`/analytics/insights/?month=${selectedMonth}`);
      setInsight(res.data.insight);
      toast.success('AI insight generated!');
    } catch {
      toast.error('Failed to generate insight');
    } finally {
      setInsightLoading(false);
    }
  };

  if (loading) {
    return <div className="text-gray-500 text-center py-20">Loading dashboard...</div>;
  }

  if (!summary) {
    return (
      <div className="text-center py-20">
        <Wallet size={48} className="mx-auto mb-4 text-gray-600" />
        <h2 className="text-xl font-bold text-white mb-2">No data yet</h2>
        <p className="text-gray-500">Upload a bank statement to see your spending breakdown.</p>
      </div>
    );
  }

  // Prepare chart data
  const breakdown = summary.category_breakdown || {};
  const pieData = Object.entries(breakdown)
    .filter(([_, value]) => value > 0)
    .map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: CATEGORY_COLORS[name] || '#94A3B8',
    }));

  const barData = Object.entries(breakdown).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    amount: value,
    fill: CATEGORY_COLORS[name] || '#94A3B8',
  }));

  const income = parseFloat(summary.total_income);
  const expenses = parseFloat(summary.total_expenses);
  const savings = parseFloat(summary.net_savings);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
        >
          {months.map((m) => (
            <option key={m} value={m.substring(0, 7)}>
              {new Date(m).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </option>
          ))}
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">Total Income</p>
            <TrendingUp size={18} className="text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400">GHS {income.toFixed(2)}</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">Total Expenses</p>
            <TrendingDown size={18} className="text-red-400" />
          </div>
          <p className="text-2xl font-bold text-red-400">GHS {expenses.toFixed(2)}</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">Net Savings</p>
            <Wallet size={18} className={savings >= 0 ? 'text-emerald-400' : 'text-red-400'} />
          </div>
          <p className={`text-2xl font-bold ${savings >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            GHS {savings.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {summary.savings_rate}% savings rate
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Spending by Category</h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => `GHS ${value.toFixed(2)}`}
                  contentStyle={{
                    background: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-12">No spending data</p>
          )}
          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-4">
            {pieData.map((entry) => (
              <div key={entry.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-xs text-gray-400">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Spending Breakdown</h2>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barData} layout="vertical">
                <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 12 }} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} width={90} />
                <Tooltip
                  formatter={(value) => `GHS ${value.toFixed(2)}`}
                  contentStyle={{
                    background: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
                <Bar dataKey="amount" radius={[0, 6, 6, 0]}>
                  {barData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-12">No spending data</p>
          )}
        </div>
      </div>

      {/* AI Insight */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">AI Financial Insight</h2>
          <button
            onClick={fetchInsight}
            disabled={insightLoading}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition disabled:opacity-50"
          >
            <ArrowUpRight size={14} />
            {insightLoading ? 'Generating...' : insight ? 'Regenerate' : 'Generate Insight'}
          </button>
        </div>
        {insight ? (
          <div className="text-gray-300 leading-relaxed whitespace-pre-line">
            {insight}
          </div>
        ) : (
          <p className="text-gray-500">
            Click "Generate Insight" to get AI-powered financial advice based on your spending.
          </p>
        )}
      </div>
    </div>
  );
}