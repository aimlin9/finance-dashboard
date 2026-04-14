import { useState, useEffect } from 'react';
import { Repeat, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../api/client';

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

export default function RecurringTransactions() {
  var [recurring, setRecurring] = useState([]);
  var [loading, setLoading] = useState(true);
  var [expanded, setExpanded] = useState(true);

  useEffect(function() {
    var fetchRecurring = async function() {
      try {
        var res = await api.get('/transactions/recurring/');
        setRecurring(res.data || []);
      } catch (err) {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchRecurring();
  }, []);

  if (loading || recurring.length === 0) return null;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
      <div
        onClick={function() { setExpanded(!expanded); }}
        className="flex items-center justify-between cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Repeat size={18} className="text-indigo-400" />
          <h2 className="text-lg font-semibold text-white">Recurring Transactions</h2>
          <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">
            {recurring.length} found
          </span>
        </div>
        {expanded ? <ChevronUp size={18} className="text-gray-500" /> : <ChevronDown size={18} className="text-gray-500" />}
      </div>

      {expanded && (
        <div className="mt-4 space-y-3">
          {recurring.slice(0, 8).map(function(item, index) {
            var color = CATEGORY_COLORS[item.category] || '#94A3B8';

            return (
              <div key={index} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                  <div>
                    <p className="text-sm text-white">
                      {item.description.length > 45 ? item.description.substring(0, 45) + '...' : item.description}
                    </p>
                    <p className="text-xs text-gray-500">
                      {item.count} times · {item.category} · {item.first_seen} to {item.last_seen}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={'text-sm font-medium ' + (item.type === 'credit' ? 'text-emerald-400' : 'text-red-400')}>
                    {item.type === 'credit' ? '+' : '-'} GHS {parseFloat(item.average_amount).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-600">avg/each</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
