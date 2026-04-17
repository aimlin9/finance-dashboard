import { useState, useEffect } from 'react';
import { Search, Download, ChevronLeft, ChevronRight, X, Printer } from 'lucide-react';
import api from '../api/client';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

var CATEGORY_COLORS = {
  food: 'bg-emerald-500/20 text-emerald-400',
  transport: 'bg-indigo-500/20 text-indigo-400',
  utilities: 'bg-amber-500/20 text-amber-400',
  entertainment: 'bg-pink-500/20 text-pink-400',
  health: 'bg-red-500/20 text-red-400',
  shopping: 'bg-purple-500/20 text-purple-400',
  income: 'bg-cyan-500/20 text-cyan-400',
  savings: 'bg-slate-500/20 text-slate-400',
  other: 'bg-gray-500/20 text-gray-400',
};

var CATEGORY_DOT_COLORS = {
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

export default function Transactions() {
  var [transactions, setTransactions] = useState([]);
  var [loading, setLoading] = useState(true);
  var [search, setSearch] = useState('');
  var [categoryFilter, setCategoryFilter] = useState('');
  var [typeFilter, setTypeFilter] = useState('');
  var [page, setPage] = useState(1);
  var [totalCount, setTotalCount] = useState(0);
  var [nextPage, setNextPage] = useState(null);
  var [prevPage, setPrevPage] = useState(null);
  var [editingId, setEditingId] = useState(null);
  var [editCategory, setEditCategory] = useState('');
  var [selectedTx, setSelectedTx] = useState(null);

  var fetchTransactions = async function() {
    setLoading(true);
    try {
      var params = new URLSearchParams();
      if (search) params.append('search', search);
      if (categoryFilter) params.append('category', categoryFilter);
      if (typeFilter) params.append('type', typeFilter);
      params.append('page', page);

      var res = await api.get('/transactions/?' + params.toString());
      setTransactions(res.data.results);
      setTotalCount(res.data.count);
      setNextPage(res.data.next);
      setPrevPage(res.data.previous);
    } catch (err) {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(function() {
    fetchTransactions();
  }, [categoryFilter, typeFilter, page]);

  var handleSearch = function(e) {
    e.preventDefault();
    setPage(1);
    fetchTransactions();
  };

  var handleExport = async function() {
    try {
      var res = await api.get('/transactions/export/', { responseType: 'blob' });
      var url = window.URL.createObjectURL(new Blob([res.data]));
      var link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'transactions.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('CSV downloaded!');
    } catch (err) {
      toast.error('Export failed');
    }
  };

  var handleCategoryUpdate = async function(txId, newCategory) {
    try {
      await api.patch('/transactions/' + txId + '/edit/', { category: newCategory });
      toast.success('Category updated!');
      setEditingId(null);
      fetchTransactions();
    } catch (err) {
      toast.error('Failed to update category');
    }
  };

  var handlePrintReport = async function() {
    try {
      var allTxRes = await api.get('/transactions/');
      var allTx = allTxRes.data.results || [];

      var totalIncome = 0;
      var totalExpenses = 0;
      var categoryTotals = {};

      allTx.forEach(function(tx) {
        var amt = parseFloat(tx.amount);
        if (tx.type === 'credit') {
          totalIncome += amt;
        } else {
          totalExpenses += amt;
          categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + amt;
        }
      });

      var netSavings = totalIncome - totalExpenses;
      var savingsRate = totalIncome > 0 ? (netSavings / totalIncome * 100).toFixed(1) : 0;

      var sortedCategories = Object.entries(categoryTotals)
        .sort(function(a, b) { return b[1] - a[1]; })
        .map(function(entry) {
          return {
            name: entry[0].charAt(0).toUpperCase() + entry[0].slice(1),
            amount: entry[1],
            percent: totalExpenses > 0 ? (entry[1] / totalExpenses * 100).toFixed(1) : 0,
          };
        });

      var printWindow = window.open('', '_blank');
      var today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

      var html = '<!DOCTYPE html><html><head><title>FinTrack Report</title><style>';
      html += 'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 40px; color: #1a1a1a; }';
      html += 'h1 { font-size: 24px; margin-bottom: 4px; }';
      html += 'h2 { font-size: 18px; margin-top: 32px; margin-bottom: 12px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; }';
      html += '.subtitle { color: #6b7280; font-size: 14px; margin-bottom: 24px; }';
      html += '.summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }';
      html += '.summary-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; }';
      html += '.summary-card .label { font-size: 12px; color: #6b7280; margin-bottom: 4px; }';
      html += '.summary-card .value { font-size: 20px; font-weight: 700; }';
      html += '.green { color: #059669; } .red { color: #dc2626; } .blue { color: #4f46e5; }';
      html += 'table { width: 100%; border-collapse: collapse; font-size: 13px; }';
      html += 'th { text-align: left; padding: 8px 12px; border-bottom: 2px solid #e5e7eb; color: #6b7280; font-weight: 600; }';
      html += 'td { padding: 8px 12px; border-bottom: 1px solid #f3f4f6; }';
      html += '.text-right { text-align: right; }';
      html += '.footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; text-align: center; }';
      html += '@media print { body { margin: 20px; } }';
      html += '</style></head><body>';

      html += '<h1>FinTrack Ghana</h1>';
      html += '<p class="subtitle">Financial Report &mdash; Generated ' + today + '</p>';

      html += '<div class="summary-grid">';
      html += '<div class="summary-card"><div class="label">Total Income</div><div class="value green">GHS ' + totalIncome.toFixed(2) + '</div></div>';
      html += '<div class="summary-card"><div class="label">Total Expenses</div><div class="value red">GHS ' + totalExpenses.toFixed(2) + '</div></div>';
      html += '<div class="summary-card"><div class="label">Net Savings</div><div class="value ' + (netSavings >= 0 ? 'green' : 'red') + '">GHS ' + netSavings.toFixed(2) + '</div></div>';
      html += '<div class="summary-card"><div class="label">Savings Rate</div><div class="value blue">' + savingsRate + '%</div></div>';
      html += '</div>';

      html += '<h2>Spending Breakdown</h2>';
      html += '<table><thead><tr><th>Category</th><th class="text-right">Amount (GHS)</th><th class="text-right">% of Spending</th></tr></thead><tbody>';
      sortedCategories.forEach(function(cat) {
        html += '<tr><td>' + cat.name + '</td><td class="text-right">' + cat.amount.toFixed(2) + '</td><td class="text-right">' + cat.percent + '%</td></tr>';
      });
      html += '<tr style="border-top: 2px solid #d1d5db; font-weight: 700;"><td>Total</td><td class="text-right">' + totalExpenses.toFixed(2) + '</td><td class="text-right">100%</td></tr>';
      html += '</tbody></table>';

      html += '<h2>All Transactions (' + allTx.length + ')</h2>';
      html += '<table><thead><tr><th>Date</th><th>Description</th><th>Category</th><th class="text-right">Amount (GHS)</th></tr></thead><tbody>';
      allTx.forEach(function(tx) {
        var desc = tx.description.length > 50 ? tx.description.substring(0, 50) + '...' : tx.description;
        var colorClass = tx.type === 'credit' ? 'green' : 'red';
        var sign = tx.type === 'credit' ? '+' : '-';
        html += '<tr><td>' + tx.date + '</td><td>' + desc + '</td><td>' + tx.category + '</td><td class="text-right ' + colorClass + '">' + sign + ' ' + parseFloat(tx.amount).toFixed(2) + '</td></tr>';
      });
      html += '</tbody></table>';

      html += '<div class="footer">&copy; 2026 FinTrack Ghana. All rights reserved.</div>';
      html += '</body></html>';

      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.onload = function() { printWindow.print(); };
    } catch (err) {
      toast.error('Failed to generate report');
    }
  };

  var openDetail = function(tx) {
    setSelectedTx(tx);
  };

  var closeDetail = function() {
    setSelectedTx(null);
  };

 return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-3">Transactions</h1>
        <div className="flex gap-2">
          <div
            onClick={handlePrintReport}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded-lg transition cursor-pointer"
          >
            <Printer size={14} />
            Print
          </div>
          <div
            onClick={handleExport}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded-lg transition cursor-pointer"
          >
            <Download size={14} />
            Export
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-3 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={function(e) { setSearch(e.target.value); }}
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
          />
        </form>
        <select
          value={categoryFilter}
          onChange={function(e) { setCategoryFilter(e.target.value); setPage(1); }}
          className="px-3 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Categories</option>
          <option value="food">Food</option>
          <option value="transport">Transport</option>
          <option value="utilities">Utilities</option>
          <option value="entertainment">Entertainment</option>
          <option value="health">Health</option>
          <option value="shopping">Shopping</option>
          <option value="income">Income</option>
          <option value="savings">Savings</option>
          <option value="other">Other</option>
        </select>
        <select
          value={typeFilter}
          onChange={function(e) { setTypeFilter(e.target.value); setPage(1); }}
          className="px-3 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Types</option>
          <option value="debit">Debit</option>
          <option value="credit">Credit</option>
        </select>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading...</div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No transactions found. Upload a bank statement first.
          </div>
        ) : (
          <div>
            <table className="w-full table-fixed hidden sm:table">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-4 py-3 text-sm text-gray-500 font-medium w-[110px]">Date</th>
                  <th className="text-left px-4 py-3 text-sm text-gray-500 font-medium">Description</th>
                  <th className="text-left px-4 py-3 text-sm text-gray-500 font-medium w-[110px]">Category</th>
                  <th className="text-right px-4 py-3 text-sm text-gray-500 font-medium w-[120px]">Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(function(tx) {
                  return (
                    <tr
                      key={tx.id}
                      className="border-b border-gray-800/50 hover:bg-gray-800/30 cursor-pointer"
                      onClick={function() { openDetail(tx); }}
                    >
                      <td className="px-4 py-3 text-gray-400 text-sm whitespace-nowrap">
                        {format(new Date(tx.date), 'dd MMM yyyy')}
                      </td>
                      <td className="px-4 py-3 text-white text-sm truncate">
                        {tx.description}
                      </td>
                      <td className="px-4 py-3" onClick={function(e) { e.stopPropagation(); }}>
                        {editingId === tx.id ? (
                          <select
                            value={editCategory}
                            onChange={function(e) { handleCategoryUpdate(tx.id, e.target.value); }}
                            onBlur={function() { setEditingId(null); }}
                            autoFocus
                            className="px-2 py-1 bg-gray-800 border border-gray-700 rounded-lg text-white text-xs focus:outline-none focus:border-indigo-500"
                          >
                            <option value="food">food</option>
                            <option value="transport">transport</option>
                            <option value="utilities">utilities</option>
                            <option value="entertainment">entertainment</option>
                            <option value="health">health</option>
                            <option value="shopping">shopping</option>
                            <option value="income">income</option>
                            <option value="savings">savings</option>
                            <option value="other">other</option>
                          </select>
                        ) : (
                          <span
                            onClick={function() { setEditingId(tx.id); setEditCategory(tx.category); }}
                            className={'px-3 py-1 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition ' + (CATEGORY_COLORS[tx.category] || CATEGORY_COLORS.other)}
                          >
                            {tx.category}
                          </span>
                        )}
                      </td>
                      <td className={'px-4 py-3 text-right text-sm font-medium whitespace-nowrap ' + (tx.type === 'credit' ? 'text-emerald-400' : 'text-red-400')}>
                        {tx.type === 'credit' ? '+' : '-'} GHS {parseFloat(tx.amount).toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="sm:hidden divide-y divide-gray-800">
              {transactions.map(function(tx) {
                return (
                  <div
                    key={tx.id}
                    className="p-4 hover:bg-gray-800/30 cursor-pointer overflow-hidden"
                    onClick={function() { openDetail(tx); }}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-white text-sm font-medium truncate min-w-0 flex-1">{tx.description}</p>
                      <p className={'text-sm font-semibold shrink-0 ' + (tx.type === 'credit' ? 'text-emerald-400' : 'text-red-400')}>
                        {tx.type === 'credit' ? '+' : '-'}{parseFloat(tx.amount).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">{format(new Date(tx.date), 'dd MMM')}</span>
                      <span className={'px-2 py-0.5 rounded-full text-xs ' + (CATEGORY_COLORS[tx.category] || CATEGORY_COLORS.other)}>
                        {tx.category}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {totalCount > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800">
            <p className="text-xs sm:text-sm text-gray-500">{totalCount} total</p>
            <div className="flex gap-2">
              <div
                onClick={function() { if (prevPage) setPage(page - 1); }}
                className={'p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white transition cursor-pointer ' + (!prevPage ? 'opacity-30 pointer-events-none' : '')}
              >
                <ChevronLeft size={16} />
              </div>
              <span className="px-3 py-2 text-xs sm:text-sm text-gray-400">Page {page}</span>
              <div
                onClick={function() { if (nextPage) setPage(page + 1); }}
                className={'p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white transition cursor-pointer ' + (!nextPage ? 'opacity-30 pointer-events-none' : '')}
              >
                <ChevronRight size={16} />
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedTx && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 sm:p-6 max-w-lg w-full max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">Transaction Details</h2>
              <div
                onClick={closeDetail}
                className="p-2 rounded-lg text-gray-400 hover:bg-gray-800 cursor-pointer"
              >
                <X size={18} />
              </div>
            </div>

            <div className="text-center mb-6">
              <p className={'text-3xl font-bold ' + (selectedTx.type === 'credit' ? 'text-emerald-400' : 'text-red-400')}>
                {selectedTx.type === 'credit' ? '+' : '-'} GHS {parseFloat(selectedTx.amount).toFixed(2)}
              </p>
              <p className="text-gray-500 text-sm mt-1">
                {format(new Date(selectedTx.date), 'EEEE, dd MMMM yyyy')}
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between py-3 border-b border-gray-800">
                <span className="text-gray-500 text-sm">Description</span>
                <span className="text-white text-sm text-right max-w-[60%] break-words">{selectedTx.description}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-gray-800">
                <span className="text-gray-500 text-sm">Category</span>
                <span className={'px-3 py-1 rounded-full text-xs font-medium ' + (CATEGORY_COLORS[selectedTx.category] || CATEGORY_COLORS.other)}>
                  {selectedTx.category}
                </span>
              </div>
              <div className="flex justify-between py-3 border-b border-gray-800">
                <span className="text-gray-500 text-sm">Type</span>
                <span className={'text-sm font-medium ' + (selectedTx.type === 'credit' ? 'text-emerald-400' : 'text-red-400')}>
                  {selectedTx.type === 'credit' ? 'Credit' : 'Debit'}
                </span>
              </div>
              {selectedTx.balance_after && (
                <div className="flex justify-between py-3 border-b border-gray-800">
                  <span className="text-gray-500 text-sm">Balance After</span>
                  <span className="text-white text-sm">GHS {parseFloat(selectedTx.balance_after).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between py-3 border-b border-gray-800">
                <span className="text-gray-500 text-sm">Confidence</span>
                <span className="text-gray-400 text-sm">{(selectedTx.category_confidence * 100).toFixed(0)}%</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gray-800/50 rounded-xl">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CATEGORY_DOT_COLORS[selectedTx.category] || '#94A3B8' }} />
              <div>
                <p className="text-sm text-white">{selectedTx.category.charAt(0).toUpperCase() + selectedTx.category.slice(1)}</p>
                <p className="text-xs text-gray-500">
                  {selectedTx.category_confidence === 1 ? 'Matched by keyword rules' : 'Classified by NLP model'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}