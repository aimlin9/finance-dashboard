import { useState, useEffect } from 'react';
import { Wallet, Edit3, Check, X, Trash2 } from 'lucide-react';
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

export default function Budget() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingSlug, setEditingSlug] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [months, setMonths] = useState([]);
  const [confirmRemove, setConfirmRemove] = useState(null);

  useEffect(() => {
    const fetchMonths = async () => {
      try {
        const res = await api.get('/analytics/monthly/');
        const monthList = res.data.months || [];
        setMonths(monthList);
        if (monthList.length > 0) {
          setSelectedMonth(monthList[0].substring(0, 7));
        }
      } catch {
        toast.error('Failed to load months');
      }
    };
    fetchMonths();
  }, []);

  useEffect(() => {
    if (!selectedMonth) {
      setLoading(false);
      return;
    }
    fetchBudgets();
  }, [selectedMonth]);

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/analytics/budget/?month=${selectedMonth}`);
      setCategories(res.data);
    } catch {
      toast.error('Failed to load budgets');
    } finally {
      setLoading(false);
    }
  };

  const handleSetBudget = async (slug) => {
    const limit = parseFloat(editValue);
    if (isNaN(limit) || limit <= 0) {
      toast.error('Enter a valid amount');
      return;
    }

    try {
      await api.post('/analytics/budget/set/', {
        category: slug,
        budget_limit: limit,
      });
      toast.success('Budget updated!');
      setEditingSlug(null);
      setEditValue('');
      fetchBudgets();
    } catch {
      toast.error('Failed to update budget');
    }
  };
    const handleRemoveBudget = async (slug) => {
    try {
      await api.post('/analytics/budget/remove/', { category: slug });
      toast.success('Budget removed');
      setConfirmRemove(null);
      fetchBudgets();
    } catch {
      toast.error('Failed to remove budget');
    }
  };

  if (loading) {
    return <div className="text-gray-500 text-center py-20">Loading budgets...</div>;
  }

  // Separate categories with spending from empty ones
  const withSpending = categories.filter((c) => c.amount_spent > 0 || c.budget_limit);
  const withoutSpending = categories.filter((c) => c.amount_spent === 0 && !c.budget_limit);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Budget Tracker</h1>
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

      {/* Active Categories */}
      <div className="space-y-4 mb-8">
        {withSpending.map((cat) => (
          <div
            key={cat.slug}
            className="bg-gray-900 border border-gray-800 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{cat.icon}</span>
                <div>
                  <h3 className="text-white font-medium">{cat.name}</h3>
                  <p className="text-sm text-gray-500">
                    GHS {cat.amount_spent.toFixed(2)} spent
                    {cat.budget_limit ? ` of GHS ${cat.budget_limit.toFixed(2)}` : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {cat.status === 'exceeded' && (
                  <span className="px-3 py-1 bg-red-500/20 text-red-400 text-xs font-medium rounded-full">
                    Over Budget
                  </span>
                )}
                {cat.status === 'warning' && (
                  <span className="px-3 py-1 bg-amber-500/20 text-amber-400 text-xs font-medium rounded-full">
                    Almost There
                  </span>
                )}

                {editingSlug === cat.slug ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      placeholder="GHS"
                      className="w-24 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSetBudget(cat.slug)}
                      className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      onClick={() => { setEditingSlug(null); setEditValue(''); }}
                      className="p-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingSlug(cat.slug);
                        setEditValue(cat.budget_limit ? cat.budget_limit.toString() : '');
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 text-sm rounded-lg transition"
                    >
                      <Edit3 size={14} />
                      {cat.budget_limit ? 'Edit' : 'Set Budget'}
                    </button>
                    {cat.budget_limit && (
                      <button
                        onClick={() => setConfirmRemove(cat.slug)}
                        className="p-1.5 rounded-lg bg-gray-800 hover:bg-red-900 text-gray-500 hover:text-red-400 transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            {cat.budget_limit ? (
              <div className="mt-2">
                <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(cat.progress || 0, 100)}%`,
                      backgroundColor:
                        cat.status === 'exceeded' ? '#EF4444'
                        : cat.status === 'warning' ? '#F59E0B'
                        : CATEGORY_COLORS[cat.slug] || '#94A3B8',
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1 text-right">
                  {cat.progress?.toFixed(1)}%
                </p>
              </div>
            ) : (
              <div className="mt-2">
                <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: '100%',
                      backgroundColor: CATEGORY_COLORS[cat.slug] || '#94A3B8',
                      opacity: 0.3,
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">No budget set</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Inactive Categories */}
      {withoutSpending.length > 0 && (
        <>
          <h2 className="text-lg font-semibold text-gray-500 mb-4">No Spending This Month</h2>
          <div className="grid grid-cols-2 gap-3">
            {withoutSpending.map((cat) => (
              <div
                key={cat.slug}
                className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{cat.icon}</span>
                  <span className="text-gray-500">{cat.name}</span>
                </div>
                {editingSlug === cat.slug ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      placeholder="GHS"
                      className="w-24 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSetBudget(cat.slug)}
                      className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      onClick={() => { setEditingSlug(null); setEditValue(''); }}
                      className="p-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setEditingSlug(cat.slug);
                      setEditValue('');
                    }}
                    className="text-xs text-gray-600 hover:text-gray-400 transition"
                  >
                    Set Budget
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Confirmation Dialog */}
      {confirmRemove && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-white mb-2">Remove Budget?</h3>
            <p className="text-gray-400 text-sm mb-6">
              Are you sure you want to remove this budget limit? Your spending data will not be affected.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmRemove(null)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRemoveBudget(confirmRemove)}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

    
  );
  
}