import { useState, useEffect } from 'react';
import { Printer, Download } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../api/client';
import toast from 'react-hot-toast';

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

export default function Report() {
  var [months, setMonths] = useState([]);
  var [selectedMonth, setSelectedMonth] = useState('');
  var [summary, setSummary] = useState(null);
  var [transactions, setTransactions] = useState([]);
  var [loading, setLoading] = useState(true);

  useEffect(function() {
    var fetchMonths = async function() {
      try {
        var res = await api.get('/analytics/monthly/');
        var monthList = res.data.months || [];
        setMonths(monthList);
        if (monthList.length > 0) {
          setSelectedMonth(monthList[0].substring(0, 7));
        }
      } catch (err) {
        toast.error('Failed to load months');
      }
    };
    fetchMonths();
  }, []);

  useEffect(function() {
    if (!selectedMonth) {
      setLoading(false);
      return;
    }

    var fetchData = async function() {
      setLoading(true);
      try {
        var summaryRes = await api.get('/analytics/dashboard/?month=' + selectedMonth);
        setSummary(summaryRes.data);

        var txRes = await api.get('/transactions/?month=' + selectedMonth);
        setTransactions(txRes.data.results || []);
      } catch (err) {
        setSummary(null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedMonth]);

  var handlePrint = function() {
    window.print();
  };

  var handleExport = async function() {
    try {
      var res = await api.get('/transactions/export/?month=' + selectedMonth, { responseType: 'blob' });
      var url = window.URL.createObjectURL(new Blob([res.data]));
      var link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'report_' + selectedMonth + '.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('CSV downloaded!');
    } catch (err) {
      toast.error('Export failed');
    }
  };

  if (loading) {
    return <div className="text-gray-500 text-center py-20">Loading report...</div>;
  }

  if (!summary) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-white mb-4">Monthly Report</h1>
        <p className="text-gray-500">No data available. Upload a bank statement first.</p>
      </div>
    );
  }

  var income = parseFloat(summary.total_income);
  var expenses = parseFloat(summary.total_expenses);
  var savings = parseFloat(summary.net_savings);
  var breakdown = summary.category_breakdown || {};
  var monthName = new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  var pieData = Object.entries(breakdown)
    .filter(function(entry) { return entry[1] > 0; })
    .map(function(entry) {
      return {
        name: entry[0].charAt(0).toUpperCase() + entry[0].slice(1),
        value: entry[1],
        color: CATEGORY_COLORS[entry[0]] || '#94A3B8',
      };
    });

  var barData = Object.entries(breakdown)
    .sort(function(a, b) { return b[1] - a[1]; })
    .map(function(entry) {
      return {
        name: entry[0].charAt(0).toUpperCase() + entry[0].slice(1),
        amount: entry[1],
        fill: CATEGORY_COLORS[entry[0]] || '#94A3B8',
      };
    });

  var debits = transactions.filter(function(tx) { return tx.type === 'debit'; });
  var credits = transactions.filter(function(tx) { return tx.type === 'credit'; });

  return (
    <div>
      {/* Header — hidden when printing */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <h1 className="text-2xl font-bold text-white">Monthly Report</h1>
        <div className="flex items-center gap-3">
          <select
            value={selectedMonth}
            onChange={function(e) { setSelectedMonth(e.target.value); }}
            className="px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
          >
            {months.map(function(m) {
              return <option key={m} value={m.substring(0, 7)}>{new Date(m).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</option>;
            })}
          </select>
          <div
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition cursor-pointer"
          >
            <Download size={16} />
            CSV
          </div>
          <div
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition cursor-pointer"
          >
            <Printer size={16} />
            Print / PDF
          </div>
        </div>
      </div>

      {/* Report Content — this is what gets printed */}
      <div className="report-content">
        {/* Report Header */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6 print:bg-white print:border-gray-300">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white print:text-black">FinTrack Ghana</h2>
              <p className="text-gray-500 print:text-gray-600">Financial Report — {monthName}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 print:text-gray-600">Generated on</p>
              <p className="text-sm text-white print:text-black">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 print:bg-white print:border-gray-300">
            <p className="text-xs text-gray-500 print:text-gray-600 mb-1">Total Income</p>
            <p className="text-xl font-bold text-emerald-400 print:text-emerald-600">GHS {income.toFixed(2)}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 print:bg-white print:border-gray-300">
            <p className="text-xs text-gray-500 print:text-gray-600 mb-1">Total Expenses</p>
            <p className="text-xl font-bold text-red-400 print:text-red-600">GHS {expenses.toFixed(2)}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 print:bg-white print:border-gray-300">
            <p className="text-xs text-gray-500 print:text-gray-600 mb-1">Net Savings</p>
            <p className={'text-xl font-bold ' + (savings >= 0 ? 'text-emerald-400 print:text-emerald-600' : 'text-red-400 print:text-red-600')}>GHS {savings.toFixed(2)}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 print:bg-white print:border-gray-300">
            <p className="text-xs text-gray-500 print:text-gray-600 mb-1">Savings Rate</p>
            <p className="text-xl font-bold text-indigo-400 print:text-indigo-600">{summary.savings_rate}%</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-2 gap-4 mb-6 print:hidden">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Spending Distribution</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" stroke="none">
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
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">By Category</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} layout="vertical">
                <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 12 }} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} width={80} />
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
          </div>
        </div>

        {/* Category Breakdown Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6 print:bg-white print:border-gray-300">
          <h3 className="text-lg font-semibold text-white print:text-black mb-4">Spending Breakdown</h3>
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800 print:border-gray-300">
                <th className="text-left py-2 text-sm text-gray-500 print:text-gray-600">Category</th>
                <th className="text-right py-2 text-sm text-gray-500 print:text-gray-600">Amount (GHS)</th>
                <th className="text-right py-2 text-sm text-gray-500 print:text-gray-600">% of Spending</th>
              </tr>
            </thead>
            <tbody>
              {barData.map(function(cat) {
                var percent = expenses > 0 ? (cat.amount / expenses * 100).toFixed(1) : 0;
                return (
                  <tr key={cat.name} className="border-b border-gray-800/50 print:border-gray-200">
                    <td className="py-3 text-white print:text-black flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.fill }} />
                      {cat.name}
                    </td>
                    <td className="py-3 text-right text-gray-300 print:text-gray-700">{cat.amount.toFixed(2)}</td>
                    <td className="py-3 text-right text-gray-400 print:text-gray-600">{percent}%</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-gray-700 print:border-gray-400">
                <td className="py-3 font-semibold text-white print:text-black">Total</td>
                <td className="py-3 text-right font-semibold text-white print:text-black">{expenses.toFixed(2)}</td>
                <td className="py-3 text-right font-semibold text-white print:text-black">100%</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Transaction List */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 print:bg-white print:border-gray-300">
          <h3 className="text-lg font-semibold text-white print:text-black mb-4">
            All Transactions ({transactions.length})
          </h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 print:border-gray-300">
                <th className="text-left py-2 text-gray-500 print:text-gray-600">Date</th>
                <th className="text-left py-2 text-gray-500 print:text-gray-600">Description</th>
                <th className="text-left py-2 text-gray-500 print:text-gray-600">Category</th>
                <th className="text-right py-2 text-gray-500 print:text-gray-600">Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(function(tx) {
                return (
                  <tr key={tx.id} className="border-b border-gray-800/30 print:border-gray-200">
                    <td className="py-2 text-gray-400 print:text-gray-600">{tx.date}</td>
                    <td className="py-2 text-white print:text-black">
                      {tx.description.length > 50 ? tx.description.substring(0, 50) + '...' : tx.description}
                    </td>
                    <td className="py-2 text-gray-400 print:text-gray-600">{tx.category}</td>
                    <td className={'py-2 text-right font-medium ' + (tx.type === 'credit' ? 'text-emerald-400 print:text-emerald-600' : 'text-red-400 print:text-red-600')}>
                      {tx.type === 'credit' ? '+' : '-'} {parseFloat(tx.amount).toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* AI Insight */}
        {summary.ai_insight && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mt-6 print:bg-white print:border-gray-300">
            <h3 className="text-lg font-semibold text-white print:text-black mb-3">AI Financial Insight</h3>
            <p className="text-gray-300 print:text-gray-700 leading-relaxed whitespace-pre-line">{summary.ai_insight}</p>
          </div>
        )}
      </div>
    </div>
  );
}
