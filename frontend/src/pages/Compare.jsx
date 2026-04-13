import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
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

export default function Compare() {
  var [months, setMonths] = useState([]);
  var [month1, setMonth1] = useState('');
  var [month2, setMonth2] = useState('');
  var [data, setData] = useState(null);
  var [loading, setLoading] = useState(false);

  useEffect(function() {
    var fetchMonths = async function() {
      try {
        var res = await api.get('/analytics/monthly/');
        var monthList = res.data.months || [];
        setMonths(monthList);
        if (monthList.length >= 2) {
          setMonth1(monthList[1].substring(0, 7));
          setMonth2(monthList[0].substring(0, 7));
        }
      } catch (err) {
        toast.error('Failed to load months');
      }
    };
    fetchMonths();
  }, []);

  useEffect(function() {
    if (!month1 || !month2 || month1 === month2) return;

    var fetchComparison = async function() {
      setLoading(true);
      try {
        var res = await api.get('/analytics/compare/?month1=' + month1 + '&month2=' + month2);
        setData(res.data);
      } catch (err) {
        toast.error('Failed to load comparison');
      } finally {
        setLoading(false);
      }
    };
    fetchComparison();
  }, [month1, month2]);

  var formatMonth = function(m) {
    if (m.length === 7) {
      return new Date(m + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    return new Date(m).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  var getChange = function(val1, val2) {
    var v1 = parseFloat(val1) || 0;
    var v2 = parseFloat(val2) || 0;
    if (v1 === 0) return { percent: 0, direction: 'same' };
    var change = ((v2 - v1) / v1) * 100;
    return {
      percent: Math.abs(change).toFixed(1),
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'same',
    };
  };

  if (months.length < 2) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-white mb-4">Month Comparison</h1>
        <p className="text-gray-500">You need at least 2 months of data to compare. Upload more statements.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Month Comparison</h1>

      <div className="flex items-center gap-4 mb-8">
        <select
          value={month1}
          onChange={function(e) { setMonth1(e.target.value); }}
          className="px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
        >
          {months.map(function(m) {
            return <option key={m} value={m.substring(0, 7)}>{formatMonth(m)}</option>;
          })}
        </select>

        <span className="text-gray-500 font-medium">vs</span>

        <select
          value={month2}
          onChange={function(e) { setMonth2(e.target.value); }}
          className="px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
        >
          {months.map(function(m) {
            return <option key={m} value={m.substring(0, 7)}>{formatMonth(m)}</option>;
          })}
        </select>
      </div>

      {month1 === month2 && (
        <div className="bg-amber-900/20 border border-amber-800 rounded-xl p-4 mb-6">
          <p className="text-amber-400 text-sm">Select two different months to compare.</p>
        </div>
      )}

      {loading && <div className="text-gray-500 text-center py-12">Loading comparison...</div>}

      {data && !loading && (
        <div>
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Income', key: 'total_income', goodDirection: 'up' },
              { label: 'Expenses', key: 'total_expenses', goodDirection: 'down' },
              { label: 'Net Savings', key: 'net_savings', goodDirection: 'up' },
            ].map(function(item) {
              var val1 = data.month1[item.key];
              var val2 = data.month2[item.key];
              var change = getChange(val1, val2);
              var isGood = (change.direction === item.goodDirection) || change.direction === 'same';

              return (
                <div key={item.key} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                  <p className="text-sm text-gray-500 mb-3">{item.label}</p>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">{formatMonth(data.month1.month)}</p>
                      <p className="text-lg font-bold text-white">GHS {parseFloat(val1).toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-600 mb-1">{formatMonth(data.month2.month)}</p>
                      <p className="text-lg font-bold text-white">GHS {parseFloat(val2).toFixed(2)}</p>
                    </div>
                  </div>
                  {change.direction !== 'same' && (
                    <div className={'flex items-center gap-1 mt-3 text-sm ' + (isGood ? 'text-emerald-400' : 'text-red-400')}>
                      {change.direction === 'up' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                      {change.percent}%
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Spending by Category</h2>
            {function() {
              var breakdown1 = data.month1.category_breakdown || {};
              var breakdown2 = data.month2.category_breakdown || {};
              var allCats = [...new Set([...Object.keys(breakdown1), ...Object.keys(breakdown2)])];

              var chartData = allCats.map(function(cat) {
                return {
                  name: cat.charAt(0).toUpperCase() + cat.slice(1),
                  month1: breakdown1[cat] || 0,
                  month2: breakdown2[cat] || 0,
                };
              });

              return (
                <div>
                  <div className="flex gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-indigo-500" />
                      <span className="text-xs text-gray-400">{formatMonth(data.month1.month)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-emerald-500" />
                      <span className="text-xs text-gray-400">{formatMonth(data.month2.month)}</span>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                      <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          background: '#1f2937',
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#fff',
                        }}
                        formatter={function(value) { return 'GHS ' + value.toFixed(2); }}
                      />
                      <Bar dataKey="month1" fill="#6366f1" radius={[4, 4, 0, 0]} name={formatMonth(data.month1.month)} />
                      <Bar dataKey="month2" fill="#10b981" radius={[4, 4, 0, 0]} name={formatMonth(data.month2.month)} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              );
            }()}
          </div>
        </div>
      )}
    </div>
  );
}