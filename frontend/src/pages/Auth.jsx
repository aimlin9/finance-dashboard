import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import api from '../api/client';
import Logo from '../components/Logo';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(() => {
  const params = new URLSearchParams(window.location.search);
  return params.get('mode') !== 'register';
});
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/password-reset/', { email: resetEmail });
      setResetSent(true);
      toast.success('Reset link generated!');
    } catch {
      toast.error('No account with that email');
    }
  };

  const { login, register } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
        toast.success('Welcome back!');
      } else {
        if (password !== passwordConfirm) {
          toast.error('Passwords do not match');
          setLoading(false);
          return;
        }
        await register(email, fullName, password, passwordConfirm);
        toast.success('Account created!');
      }
      navigate('/dashboard');
    } catch (error) {
      const message = error.response?.data?.detail
        || Object.values(error.response?.data || {})[0]
        || 'Something went wrong';
      toast.error(typeof message === 'string' ? message : JSON.stringify(message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Logo size={40} />
            <h1 className="text-3xl font-bold text-white">FinTrack Ghana</h1>
          </div>
          <p className="text-gray-400">
            {isLogin ? 'Sign in to your account' : 'Create your account'}
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div>
                <label className="block text-sm text-gray-400 mb-1">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  placeholder="Kwame Asante"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm text-gray-400 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                placeholder="••••••••"
                required
              />
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm text-gray-400 mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  placeholder="••••••••"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition disabled:opacity-50"
            >
              {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-indigo-400 hover:text-indigo-300 text-sm block mx-auto"
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'}
            </button>
            {isLogin && (
              <button
                onClick={() => setShowForgot(true)}
                className="text-gray-500 hover:text-gray-400 text-sm block mx-auto"
              >
                Forgot your password?
              </button>
            )}
          </div>
        </div>
      </div>
      {showForgot && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 max-w-md w-full">
            {resetSent ? (
              <div className="text-center">
                <h2 className="text-xl font-bold text-white mb-2">Check Your Email</h2>
                <p className="text-gray-400 mb-6">
                  If an account exists with that email, you will receive a password reset link.
                </p>
                <button
                  onClick={() => { setShowForgot(false); setResetSent(false); setResetEmail(''); }}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition"
                >
                  Back to Login
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold text-white mb-2">Reset Password</h2>
                <p className="text-gray-400 text-sm mb-6">
                  Enter your email and we will send you a reset link.
                </p>
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                    placeholder="you@example.com"
                    required
                  />
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => { setShowForgot(false); setResetEmail(''); }}
                      className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition"
                    >
                      Send Reset Link
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}