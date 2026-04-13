import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import toast from 'react-hot-toast';

export default function ResetPassword() {
  var [searchParams] = useSearchParams();
  var navigate = useNavigate();
  var uid = searchParams.get('uid');
  var token = searchParams.get('token');

  var [password, setPassword] = useState('');
  var [confirmPassword, setConfirmPassword] = useState('');
  var [loading, setLoading] = useState(false);
  var [done, setDone] = useState(false);

  var handleSubmit = async function(e) {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/password-reset/confirm/', {
        uid: uid,
        token: token,
        new_password: password,
      });
      setDone(true);
      toast.success('Password updated!');
    } catch (err) {
      toast.error('Reset link is invalid or expired');
    } finally {
      setLoading(false);
    }
  };

  if (!uid || !token) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Invalid Reset Link</h1>
          <p className="text-gray-400 mb-6">This password reset link is invalid or has expired.</p>
          <button
            onClick={function() { navigate('/login'); }}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Password Updated!</h1>
          <p className="text-gray-400 mb-6">You can now sign in with your new password.</p>
          <button
            onClick={function() { navigate('/login'); }}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Reset Password</h1>
          <p className="text-gray-400">Enter your new password below</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm text-gray-400 mb-1">New Password</label>
              <input
                type="password"
                value={password}
                onChange={function(e) { setPassword(e.target.value); }}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                placeholder="Enter new password"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={function(e) { setConfirmPassword(e.target.value); }}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                placeholder="Confirm new password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}