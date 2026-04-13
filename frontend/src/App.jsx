import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/authStore';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Transactions from './pages/Transactions';
import Layout from './components/Layout';
import Budget from './pages/Budget';
import Settings from './pages/Settings';
import History from './pages/History';
import Compare from './pages/Compare';
import ResetPassword from './pages/ResetPassword';
import Landing from './pages/Landing';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import About from './pages/About';

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return isAuthenticated ? <Layout>{children}</Layout> : <Navigate to="/login" />;
}

export default function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#1f2937', color: '#f9fafb', border: '1px solid #374151' },
        }}
      />
      <Routes>
        <Route path="/login" element={<Auth />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/upload" element={<ProtectedRoute><Upload /></ProtectedRoute>} />
        <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
        <Route path="/budget" element={<ProtectedRoute><Budget /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
        <Route path="/compare" element={<ProtectedRoute><Compare /></ProtectedRoute>} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} /> 
        <Route path="/about" element={<About />} />
        <Route path="/" element={<Landing />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}