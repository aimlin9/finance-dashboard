import { useState, useEffect } from 'react';
import { FileText, Trash2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import api from '../api/client';
import toast from 'react-hot-toast';

const STATUS_STYLES = {
  done: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  failed: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/20' },
  pending: { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/20' },
  processing: { icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/20' },
};

export default function History() {
  const [statements, setStatements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const fetchStatements = async () => {
    try {
      const res = await api.get('/statements/');
      setStatements(res.data.results || res.data);
    } catch {
      toast.error('Failed to load statements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatements();
  }, []);

  const handleDelete = async (id) => {
    try {
      await api.delete('/statements/' + id + '/');
      toast.success('Statement deleted');
      setConfirmDelete(null);
      fetchStatements();
    } catch {
      toast.error('Failed to delete statement');
    }
  };

  if (loading) {
    return <div className="text-gray-500 text-center py-20">Loading statements...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Upload History</h1>

      {statements.length === 0 ? (
        <div className="text-center py-20">
          <FileText size={48} className="mx-auto mb-4 text-gray-600" />
          <h2 className="text-xl font-bold text-white mb-2">No statements yet</h2>
          <p className="text-gray-500">Upload your first bank statement to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {statements.map(function(stmt) {
            var statusStyle = STATUS_STYLES[stmt.status] || STATUS_STYLES.pending;
            var StatusIcon = statusStyle.icon;

            return (
              <div
                key={stmt.id}
                className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-indigo-600/20 flex items-center justify-center">
                    <FileText size={20} className="text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium truncate max-w-[200px] sm:max-w-none">{stmt.file_name}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-500">
                        {format(new Date(stmt.uploaded_at), 'dd MMM yyyy, HH:mm')}
                      </span>
                      {stmt.bank_name && (
                        <span className="text-xs text-gray-500 uppercase">
                          {stmt.bank_name}
                        </span>
                      )}
                      <span className="text-xs text-gray-500">
                        {stmt.file_type.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {stmt.total_transactions > 0 && (
                    <span className="text-sm text-gray-400">
                      {stmt.total_transactions} transactions
                    </span>
                  )}

                  <span className={'flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ' + statusStyle.bg + ' ' + statusStyle.color}>
                    <StatusIcon size={12} />
                    {stmt.status}
                  </span>

                  <button
                    onClick={function() { setConfirmDelete(stmt.id); }}
                    className="p-2 rounded-lg text-gray-600 hover:text-red-400 hover:bg-gray-800 transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-white mb-2">Delete Statement?</h3>
            <p className="text-gray-400 text-sm mb-6">
              This will permanently delete the statement and all its parsed transactions. This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={function() { setConfirmDelete(null); }}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={function() { handleDelete(confirmDelete); }}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}