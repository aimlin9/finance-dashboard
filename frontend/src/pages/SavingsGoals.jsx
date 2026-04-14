import { useState, useEffect } from 'react';
import { Target, Plus, Trash2, Edit3, Check, X, Trophy } from 'lucide-react';
import api from '../api/client';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function SavingsGoals() {
  var [goals, setGoals] = useState([]);
  var [loading, setLoading] = useState(true);
  var [showAdd, setShowAdd] = useState(false);
  var [newName, setNewName] = useState('');
  var [newTarget, setNewTarget] = useState('');
  var [newDeadline, setNewDeadline] = useState('');
  var [editingId, setEditingId] = useState(null);
  var [editAmount, setEditAmount] = useState('');
  var [confirmDelete, setConfirmDelete] = useState(null);

  var fetchGoals = async function() {
    try {
      var res = await api.get('/analytics/savings-goals/');
      setGoals(res.data);
    } catch (err) {
      toast.error('Failed to load savings goals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(function() {
    fetchGoals();
  }, []);

  var handleAdd = async function(e) {
    e.preventDefault();
    if (!newName || !newTarget) {
      toast.error('Name and target amount are required');
      return;
    }
    try {
      await api.post('/analytics/savings-goals/', {
        name: newName,
        target_amount: parseFloat(newTarget),
        deadline: newDeadline || null,
      });
      toast.success('Goal created!');
      setNewName('');
      setNewTarget('');
      setNewDeadline('');
      setShowAdd(false);
      fetchGoals();
    } catch (err) {
      toast.error('Failed to create goal');
    }
  };

  var handleUpdateAmount = async function(goalId) {
    var amount = parseFloat(editAmount);
    if (isNaN(amount) || amount < 0) {
      toast.error('Enter a valid amount');
      return;
    }
    try {
      await api.patch('/analytics/savings-goals/' + goalId + '/', {
        current_amount: amount,
      });
      toast.success('Progress updated!');
      setEditingId(null);
      setEditAmount('');
      fetchGoals();
    } catch (err) {
      toast.error('Failed to update');
    }
  };

  var handleDelete = async function(goalId) {
    try {
      await api.delete('/analytics/savings-goals/' + goalId + '/');
      toast.success('Goal deleted');
      setConfirmDelete(null);
      fetchGoals();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  var activeGoals = goals.filter(function(g) { return !g.is_completed; });
  var completedGoals = goals.filter(function(g) { return g.is_completed; });

  if (loading) {
    return <div className="text-gray-500 text-center py-20">Loading savings goals...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Savings Goals</h1>
        <div
          onClick={function() { setShowAdd(!showAdd); }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition cursor-pointer"
        >
          <Plus size={16} />
          New Goal
        </div>
      </div>

      {/* Add Goal Form */}
      {showAdd && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Create Savings Goal</h2>
          <form onSubmit={handleAdd} className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Goal Name</label>
              <input
                type="text"
                value={newName}
                onChange={function(e) { setNewName(e.target.value); }}
                placeholder="e.g. Emergency Fund"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Target Amount (GHS)</label>
              <input
                type="number"
                value={newTarget}
                onChange={function(e) { setNewTarget(e.target.value); }}
                placeholder="e.g. 5000"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Deadline (optional)</label>
              <input
                type="date"
                value={newDeadline}
                onChange={function(e) { setNewDeadline(e.target.value); }}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="sm:col-span-3 flex gap-3">
              <button
                type="submit"
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition"
              >
                Create Goal
              </button>
              <div
                onClick={function() { setShowAdd(false); setNewName(''); setNewTarget(''); setNewDeadline(''); }}
                className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition cursor-pointer"
              >
                Cancel
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Empty State */}
      {goals.length === 0 && !showAdd && (
        <div className="text-center py-20">
          <Target size={48} className="mx-auto mb-4 text-gray-600" />
          <h2 className="text-xl font-bold text-white mb-2">No savings goals yet</h2>
          <p className="text-gray-500 mb-6">Set a target and start tracking your progress.</p>
          <div
            onClick={function() { setShowAdd(true); }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition cursor-pointer"
          >
            <Plus size={18} />
            Create Your First Goal
          </div>
        </div>
      )}

      {/* Active Goals */}
      {activeGoals.length > 0 && (
        <div className="space-y-4 mb-8">
          {activeGoals.map(function(goal) {
            var current = parseFloat(goal.current_amount);
            var target = parseFloat(goal.target_amount);
            var remaining = target - current;
            var progress = goal.progress;

            return (
              <div key={goal.id} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{goal.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      GHS {current.toFixed(2)} of GHS {target.toFixed(2)}
                      {goal.deadline && (
                        <span> · Due {format(new Date(goal.deadline), 'dd MMM yyyy')}</span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {editingId === goal.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={editAmount}
                          onChange={function(e) { setEditAmount(e.target.value); }}
                          placeholder="GHS"
                          className="w-28 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
                          autoFocus
                        />
                        <div
                          onClick={function() { handleUpdateAmount(goal.id); }}
                          className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition cursor-pointer"
                        >
                          <Check size={14} />
                        </div>
                        <div
                          onClick={function() { setEditingId(null); setEditAmount(''); }}
                          className="p-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition cursor-pointer"
                        >
                          <X size={14} />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div
                          onClick={function() { setEditingId(goal.id); setEditAmount(goal.current_amount); }}
                          className="flex items-center gap-1 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 text-sm rounded-lg transition cursor-pointer"
                        >
                          <Edit3 size={14} />
                          Update
                        </div>
                        <div
                          onClick={function() { setConfirmDelete(goal.id); }}
                          className="p-1.5 rounded-lg bg-gray-800 hover:bg-red-900 text-gray-500 hover:text-red-400 transition cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-4 bg-gray-800 rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: Math.min(progress, 100) + '%',
                      background: progress >= 100
                        ? '#10B981'
                        : progress >= 50
                        ? 'linear-gradient(90deg, #6366F1, #8B5CF6)'
                        : '#6366F1',
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">{progress.toFixed(1)}% complete</span>
                  <span className="text-gray-500">GHS {remaining.toFixed(2)} remaining</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-500 mb-4 flex items-center gap-2">
            <Trophy size={18} className="text-amber-400" />
            Completed Goals
          </h2>
          <div className="space-y-3">
            {completedGoals.map(function(goal) {
              return (
                <div key={goal.id} className="bg-emerald-900/10 border border-emerald-800/30 rounded-xl p-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Trophy size={20} className="text-emerald-400" />
                    <div>
                      <p className="text-white font-medium">{goal.name}</p>
                      <p className="text-sm text-emerald-400">GHS {parseFloat(goal.target_amount).toFixed(2)} achieved!</p>
                    </div>
                  </div>
                  <div
                    onClick={function() { setConfirmDelete(goal.id); }}
                    className="p-2 rounded-lg text-gray-600 hover:text-red-400 hover:bg-gray-800 transition cursor-pointer"
                  >
                    <Trash2 size={16} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-white mb-2">Delete Goal?</h3>
            <p className="text-gray-400 text-sm mb-6">This will permanently delete this savings goal.</p>
            <div className="flex gap-3 justify-end">
              <div
                onClick={function() { setConfirmDelete(null); }}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition cursor-pointer"
              >
                Cancel
              </div>
              <div
                onClick={function() { handleDelete(confirmDelete); }}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition cursor-pointer"
              >
                Delete
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
