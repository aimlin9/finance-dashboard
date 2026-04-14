import { useState, useEffect, useRef } from 'react';
import { Search, X, CreditCard, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

export default function GlobalSearch() {
  var [open, setOpen] = useState(false);
  var [query, setQuery] = useState('');
  var [results, setResults] = useState([]);
  var [loading, setLoading] = useState(false);
  var inputRef = useRef(null);
  var navigate = useNavigate();

  // Keyboard shortcut: Ctrl+K to open
  useEffect(function() {
    var handleKeyDown = function(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return function() { document.removeEventListener('keydown', handleKeyDown); };
  }, []);

  // Focus input when opened
  useEffect(function() {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  // Search transactions
  useEffect(function() {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    var timer = setTimeout(async function() {
      setLoading(true);
      try {
        var res = await api.get('/transactions/?search=' + encodeURIComponent(query));
        setResults((res.data.results || []).slice(0, 6));
      } catch (err) {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return function() { clearTimeout(timer); };
  }, [query]);

  var handleSelect = function(tx) {
    setOpen(false);
    setQuery('');
    navigate('/transactions');
  };

  var pages = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Upload Statement', path: '/upload' },
    { name: 'Transactions', path: '/transactions' },
    { name: 'Budget Tracker', path: '/budget' },
    { name: 'Upload History', path: '/history' },
    { name: 'Month Comparison', path: '/compare' },
    { name: 'Settings', path: '/settings' },
  ];

  var filteredPages = query
    ? pages.filter(function(p) { return p.name.toLowerCase().includes(query.toLowerCase()); })
    : [];

  if (!open) {
    return (
      <div
        onClick={function() { setOpen(true); }}
        className="flex items-center gap-2 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-500 text-sm cursor-pointer hover:border-gray-600 transition w-full"
      >
        <Search size={14} />
        <span className="flex-1">Search...</span>
        <kbd className="hidden sm:inline text-xs bg-gray-700 px-1.5 py-0.5 rounded text-gray-400">Ctrl+K</kbd>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-start justify-center z-[200] pt-[15vh] px-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 border-b border-gray-800">
          <Search size={18} className="text-gray-500" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={function(e) { setQuery(e.target.value); }}
            placeholder="Search transactions, pages..."
            className="flex-1 py-4 bg-transparent text-white focus:outline-none"
          />
          <div
            onClick={function() { setOpen(false); setQuery(''); }}
            className="p-1 rounded text-gray-500 hover:text-white cursor-pointer"
          >
            <X size={16} />
          </div>
        </div>

        {/* Results */}
        <div className="max-h-[50vh] overflow-auto">
          {/* Page Navigation */}
          {filteredPages.length > 0 && (
            <div className="p-2">
              <p className="text-xs text-gray-600 px-3 py-1">Pages</p>
              {filteredPages.map(function(page) {
                return (
                  <div
                    key={page.path}
                    onClick={function() { navigate(page.path); setOpen(false); setQuery(''); }}
                    className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-gray-800 cursor-pointer transition"
                  >
                    <span className="text-gray-300 text-sm">{page.name}</span>
                    <ArrowRight size={14} className="text-gray-600" />
                  </div>
                );
              })}
            </div>
          )}

          {/* Transaction Results */}
          {loading && (
            <div className="p-4 text-center text-gray-500 text-sm">Searching...</div>
          )}

          {!loading && results.length > 0 && (
            <div className="p-2">
              <p className="text-xs text-gray-600 px-3 py-1">Transactions</p>
              {results.map(function(tx) {
                return (
                  <div
                    key={tx.id}
                    onClick={function() { handleSelect(tx); }}
                    className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-gray-800 cursor-pointer transition"
                  >
                    <div className="flex items-center gap-3">
                      <CreditCard size={14} className="text-gray-600" />
                      <div>
                        <p className="text-gray-300 text-sm">
                          {tx.description.length > 45 ? tx.description.substring(0, 45) + '...' : tx.description}
                        </p>
                        <p className="text-gray-600 text-xs">{tx.date} · {tx.category}</p>
                      </div>
                    </div>
                    <span className={'text-sm font-medium ' + (tx.type === 'credit' ? 'text-emerald-400' : 'text-red-400')}>
                      {tx.type === 'credit' ? '+' : '-'}{tx.amount}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {!loading && query.length >= 2 && results.length === 0 && filteredPages.length === 0 && (
            <div className="p-8 text-center text-gray-500 text-sm">No results found</div>
          )}

          {!query && (
            <div className="p-4 text-center text-gray-600 text-sm">
              Type to search transactions or navigate to pages
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
