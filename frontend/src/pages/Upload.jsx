import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { Upload as UploadIcon, FileText, CheckCircle, XCircle, Loader } from 'lucide-react';
import api from '../api/client';
import toast from 'react-hot-toast';

export default function Upload() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const navigate = useNavigate();

  const onDrop = useCallback((acceptedFiles) => {
    const selected = acceptedFiles[0];
    if (selected) {
      setFile(selected);
      setResult(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/pdf': ['.pdf'],
    },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
  });

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/statements/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(res.data);
      toast.success(`Parsed ${res.data.total_transactions} transactions!`);
    } catch (error) {
      const message = error.response?.data?.error || 'Upload failed';
      toast.error(message);
      setResult({ status: 'failed', error_message: message });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Upload Bank Statement</h1>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition ${
          isDragActive
            ? 'border-indigo-500 bg-indigo-500/10'
            : 'border-gray-700 hover:border-gray-600 bg-gray-900'
        }`}
      >
        <input {...getInputProps()} />
        <UploadIcon size={48} className="mx-auto mb-4 text-gray-500" />
        {isDragActive ? (
          <p className="text-indigo-400 text-lg">Drop your file here...</p>
        ) : (
          <>
            <p className="text-gray-300 text-lg mb-2">
              Drag & drop your bank statement here
            </p>
            <p className="text-gray-500 text-sm">
              PDF or CSV files, max 10MB — supports GCB, Ecobank, MTN MoMo, Absa, Fidelity
            </p>
          </>
        )}
      </div>

      {file && !result && (
        <div className="mt-6 bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <FileText size={24} className="text-indigo-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-white font-medium truncate">{file.name}</p>
                <p className="text-gray-500 text-sm">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full sm:w-auto px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2 shrink-0"
            >
              {uploading ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  Processing...
                </>
              ) : (
                'Upload & Parse'
              )}
            </button>
          </div>
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition disabled:opacity-50 flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  Processing...
                </>
              ) : (
                'Upload & Parse'
              )}
            </button>
          </div>
        </div>
      )}

      {result && (
        <div className={`mt-6 border rounded-xl p-6 ${
          result.status === 'done'
            ? 'bg-green-900/20 border-green-800'
            : 'bg-red-900/20 border-red-800'
        }`}>
          {result.status === 'done' ? (
            <>
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle size={24} className="text-green-400" />
                <h2 className="text-lg font-semibold text-green-400">
                  Statement Parsed Successfully
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-900 rounded-lg p-4">
                  <p className="text-gray-500 text-sm">Transactions</p>
                  <p className="text-2xl font-bold text-white">{result.total_transactions}</p>
                </div>
                <div className="bg-gray-900 rounded-lg p-4">
                  <p className="text-gray-500 text-sm">Bank</p>
                  <p className="text-2xl font-bold text-white uppercase">{result.bank_name}</p>
                </div>
                <div className="bg-gray-900 rounded-lg p-4">
                  <p className="text-gray-500 text-sm">File Type</p>
                  <p className="text-2xl font-bold text-white uppercase">{result.file_type}</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => navigate('/transactions')}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition"
                >
                  View Transactions
                </button>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition"
                >
                  Go to Dashboard
                </button>
                <button
                  onClick={() => { setFile(null); setResult(null); }}
                  className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition"
                >
                  Upload Another
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <XCircle size={24} className="text-red-400" />
              <div>
                <h2 className="text-lg font-semibold text-red-400">Upload Failed</h2>
                <p className="text-gray-400">{result.error_message}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}