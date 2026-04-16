import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, Upload, List, GitCompare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import api from '../api/client';
import toast from 'react-hot-toast';
import RecurringTransactions from '../components/RecurringTransactions';

var CATEGORY_COLORS = {
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
  var { user } = useAuthStore();
  var navigate = useNavigate();
  var [summary, setSummary] = useState(null);
  var [months, setMonths] = useState([]);
  var [selectedMonth, setSelectedMonth] = useState('');
  var [insight, setInsight] = useState('');
  var [insightLoading, setInsightLoading] = useState(false);
  var [loading, setLoading] = useState(true);
  var [trendData, setTrendData] = useState([]);

  // Get greeting based on time
  var getGreeting = function() {
    var hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Fetch available months
  useEffect(function() {
    var fetchMonths = async function() {
      try {
        var res = await api.get('/analytics/monthly/');
        var monthList = res.data.months || [];
        setMonths(monthList);
        if (monthList.length > 0) {
          var latest = monthList[0];
          setSelectedMonth(latest.substring(0, 7));
        }
      } catch (err) {
        toast.error('Failed to load months');
      }
    };
    fetchMonths();
  }, []);

  // Fetch dashboard data when month changes
  useEffect(function() {
    if (!selectedMonth) {
      setLoading(false);
      return;
    }

    var fetchDashboard = async function() {
      setLoading(true);
      try {
        var res = await api.get('/analytics/dashboard/?month=' + selectedMonth);
        setSummary(res.data);
        if (res.data.ai_insight) {
          setInsight(res.data.ai_insight);
        }
      } catch (err) {
        setSummary(null);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [selectedMonth]);

  // Build trend data from all months
  useEffect(function() {
    if (months.length < 2) return;

    var fetchAllSummaries = async function() {
      var trend = [];
      for (var i = months.length - 1; i >= 0; i--) {
        try {
          var m = months[i].substring(0, 7);
          var res = await api.get('/analytics/dashboard/?month=' + m);
          trend.push({
            month: new Date(months[i]).toLocaleDateString('en-US', { month: 'short' }),
            income: parseFloat(res.data.total_income),
            expenses: parseFloat(res.data.total_expenses),
            savings: parseFloat(res.data.net_savings),
          });
        } catch (err) {
          // skip failed months
        }
      }
      setTrendData(trend);
    };
    fetchAllSummaries();
  }, [months]);

  var fetchInsight = async function() {
    setInsightLoading(true);
    try {
      var res = await api.get('/analytics/insights/?month=' + selectedMonth);
      setInsight(res.data.insight);
      toast.success('AI insight generated!');
    } catch (err) {
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
        <p className="text-gray-500 mb-6">Upload a bank statement to see your spending breakdown.</p>
        <div
          onClick={function() { navigate('/upload'); }}
          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition cursor-pointer"
        >
          <Upload size={18} />
          Upload Statement
        </div>
      </div>
    );
  }

  var breakdown = summary.category_breakdown || {};
  var pieData = Object.entries(breakdown)
    .filter(function(entry) { return entry[1] > 0; })
    .map(function(entry) {
      return {
        name: entry[0].charAt(0).toUpperCase() + entry[0].slice(1),
        value: entry[1],
        color: CATEGORY_COLORS[entry[0]] || '#94A3B8',
      };
    });

  var barData = Object.entries(breakdown).map(function(entry) {
    return {
      name: entry[0].charAt(0).toUpperCase() + entry[0].slice(1),
      amount: entry[1],
      fill: CATEGORY_COLORS[entry[0]] || '#94A3B8',
    };
  });

  var income = parseFloat(summary.total_income);
  var expenses = parseFloat(summary.total_expenses);
  var savings = parseFloat(summary.net_savings);
  var firstName = user && user.full_name ? user.full_name.split(' ')[0] : 'there';

  return (
    <div>
      {/* Welcome Card */}
      <div className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/20 rounded-2xl p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">{getGreeting()}, {firstName}</h1>
            <p className="text-gray-400">Here is your financial overview for {new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
          </div>
          <select
            value={selectedMonth}
            onChange={function(e) { setSelectedMonth(e.target.value); }}
            className="px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
          >
            {months.map(function(m) {
              return <option key={m} value={m.substring(0, 7)}>{new Date(m).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</option>;
            })}
          </select>
        </div>
      </div>

    
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
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
          <p className={'text-2xl font-bold ' + (savings >= 0 ? 'text-emerald-400' : 'text-red-400')}>
            GHS {savings.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 mt-1">{summary.savings_rate}% savings rate</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 overflow-hidden">
          <h2 className="text-lg font-semibold text-white mb-4">Spending by Category</h2>
          {pieData.length > 0 ? (
            <div style={{ width: '100%', height: '250px' }}>
              <div style={{ width: '100%', height: 250 }}>
              <ResponsiveContainer>
                <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" stroke="none">
                  {pieData.map(function(entry, index) {
                    return <Cell key={index} fill={entry.color} />;
                  })}
                </Pie>
                <Tooltip
                  formatter={function(value) { return 'GHS ' + value.toFixed(2); }}
                  contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }}
                />
              </PieChart>
              </ResponsiveContainer>
            </div>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-12">No spending data</p>
          )}
          <div className="flex flex-wrap gap-3 mt-2">
            {pieData.map(function(entry) {
              return (
                <div key={entry.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-xs text-gray-400">{entry.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Spending Breakdown</h2>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={barData} layout="vertical">
                <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 12 }} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} width={90} />
                <Tooltip
                  formatter={function(value) { return 'GHS ' + value.toFixed(2); }}
                  contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }}
                />
                <Bar dataKey="amount" radius={[0, 6, 6, 0]}>
                  {barData.map(function(entry, index) {
                    return <Cell key={index} fill={entry.fill} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-12">No spending data</p>
          )}
        </div>
      </div>

      {/* Trend Line Chart */}
      {trendData.length >= 2 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Monthly Trends</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trendData}>
              <XAxis dataKey="month" tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
              <Tooltip
                contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }}
                formatter={function(value) { return 'GHS ' + value.toFixed(2); }}
              />
              <Line type="monotone" dataKey="income" stroke="#10B981" strokeWidth={2} dot={{ r: 4 }} name="Income" />
              <Line type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={2} dot={{ r: 4 }} name="Expenses" />
              <Line type="monotone" dataKey="savings" stroke="#6366F1" strokeWidth={2} dot={{ r: 4 }} name="Savings" />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex gap-6 justify-center mt-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-emerald-500" />
              <span className="text-xs text-gray-400">Income</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-red-500" />
              <span className="text-xs text-gray-400">Expenses</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-indigo-500" />
              <span className="text-xs text-gray-400">Savings</span>
            </div>
          </div>
        </div>
      )}
      {/* Recurring Transactions */}
      <RecurringTransactions />

      {/* AI Insight */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">AI Financial Insight</h2>
          <div
            onClick={fetchInsight}
            className={'flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition cursor-pointer ' + (insightLoading ? 'opacity-50 pointer-events-none' : '')}
          >
            <ArrowUpRight size={14} />
            {insightLoading ? 'Generating...' : insight ? 'Regenerate' : 'Generate Insight'}
          </div>
        </div>
        {insight ? (
          <div className="text-gray-300 leading-relaxed whitespace-pre-line">{insight}</div>
        ) : (
          <p className="text-gray-500">Click "Generate Insight" to get AI-powered financial advice based on your spending.</p>
        )}
      </div>
    </div>
  );
}
