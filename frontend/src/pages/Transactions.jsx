import { useState, useEffect } from 'react';
import { Search, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../api/client';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const CATEGORY_COLORS = {
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

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [nextPage, setNextPage] = useState(null);
  const [prevPage, setPrevPage] = useState(null);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (categoryFilter) params.append('category', categoryFilter);
      if (typeFilter) params.append('type', typeFilter);
      params.append('page', page);

      const res = await api.get(`/transactions/?${params.toString()}`);
      setTransactions(res.data.results);
      setTotalCount(res.data.count);
      setNextPage(res.data.next);
      setPrevPage(res.data.previous);
    } catch (error) {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [categoryFilter, typeFilter, page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchTransactions();
  };

  const handleExport = async () => {
    try {
      const res = await api.get('/transactions/export/', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'transactions.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('CSV downloaded!');
    } catch {
      toast.error('Export failed');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Transactions</h1>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition"
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>

      <div className="flex gap-3 mb-6">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-3 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search descriptions..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
          />
        </form>

        <select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
          className="px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
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
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
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
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-6 py-4 text-sm text-gray-500 font-medium">Date</th>
                <th className="text-left px-6 py-4 text-sm text-gray-500 font-medium">Description</th>
                <th className="text-left px-6 py-4 text-sm text-gray-500 font-medium">Category</th>
                <th className="text-right px-6 py-4 text-sm text-gray-500 font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="px-6 py-4 text-gray-400 text-sm">
                    {format(new Date(tx.date), 'dd MMM yyyy')}
                  </td>
                  <td className="px-6 py-4 text-white text-sm">
                    {tx.description.length > 60
                      ? tx.description.substring(0, 60) + '...'
                      : tx.description}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${CATEGORY_COLORS[tx.category] || CATEGORY_COLORS.other}`}>
                      {tx.category}
                    </span>
                  </td>
                  <td className={`px-6 py-4 text-right text-sm font-medium ${
                    tx.type === 'credit' ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {tx.type === 'credit' ? '+' : '-'} GHS {parseFloat(tx.amount).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {totalCount > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-800">
            <p className="text-sm text-gray-500">{totalCount} transactions</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={!prevPage}
                className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white disabled:opacity-30 transition"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-3 py-2 text-sm text-gray-400">Page {page}</span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={!nextPage}
                className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white disabled:opacity-30 transition"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}