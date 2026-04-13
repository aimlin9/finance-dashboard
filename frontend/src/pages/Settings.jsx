import { useState } from 'react';
import { Save, Shield, Bell, Globe } from 'lucide-react';
import useAuthStore from '../store/authStore';
import api from '../api/client';
import toast from 'react-hot-toast';

export default function Settings() {
  var { user, checkAuth } = useAuthStore();
  var [fullName, setFullName] = useState(user ? user.full_name : '');
  var [currency, setCurrency] = useState(user ? user.currency : 'GHS');
  var [timezone, setTimezone] = useState(user ? user.timezone : 'Africa/Accra');
  var [saving, setSaving] = useState(false);

  var [currentPassword, setCurrentPassword] = useState('');
  var [newPassword, setNewPassword] = useState('');
  var [confirmPassword, setConfirmPassword] = useState('');
  var [changingPassword, setChangingPassword] = useState(false);

  var handleSave = async function(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch('/auth/me/', {
        full_name: fullName,
        currency: currency,
        timezone: timezone,
      });
      await checkAuth();
      toast.success('Profile updated!');
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  var handlePasswordChange = async function(e) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setChangingPassword(true);
    try {
      await api.post('/auth/password-reset/', { email: user.email });
      toast.success('Password reset email sent! Check your inbox.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error('Failed to initiate password reset');
    } finally {
      setChangingPassword(false);
    }
  };

  var userInitial = user && user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U';
  var memberSince = user && user.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : '';

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Settings</h1>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 mb-6">
        <div className="flex items-center gap-6 mb-8">
          <div className="w-20 h-20 rounded-full bg-indigo-600 flex items-center justify-center text-white text-3xl font-bold">
            {userInitial}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{user ? user.full_name : ''}</h2>
            <p className="text-gray-500">{user ? user.email : ''}</p>
            <p className="text-xs text-gray-600 mt-1">Member since {memberSince}</p>
          </div>
        </div>

        <form onSubmit={handleSave}>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={function(e) { setFullName(e.target.value); }}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Email</label>
              <input
                type="email"
                value={user ? user.email : ''}
                disabled
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">
                <Globe size={14} className="inline mr-1" />
                Currency
              </label>
              <select
                value={currency}
                onChange={function(e) { setCurrency(e.target.value); }}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500 transition"
              >
                <option value="GHS">GHS — Ghana Cedis</option>
                <option value="USD">USD — US Dollar</option>
                <option value="GBP">GBP — British Pound</option>
                <option value="EUR">EUR — Euro</option>
                <option value="NGN">NGN — Nigerian Naira</option>
                <option value="KES">KES — Kenyan Shilling</option>
                <option value="ZAR">ZAR — South African Rand</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">
                <Globe size={14} className="inline mr-1" />
                Timezone
              </label>
              <select
                value={timezone}
                onChange={function(e) { setTimezone(e.target.value); }}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500 transition"
              >
                <option value="Africa/Accra">Africa/Accra (GMT+0)</option>
                <option value="Africa/Lagos">Africa/Lagos (GMT+1)</option>
                <option value="Africa/Nairobi">Africa/Nairobi (GMT+3)</option>
                <option value="Africa/Johannesburg">Africa/Johannesburg (GMT+2)</option>
                <option value="Europe/London">Europe/London (GMT+0)</option>
                <option value="America/New_York">America/New York (GMT-5)</option>
              </select>
            </div>
          </div>

          <div className="mt-6">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition disabled:opacity-50"
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield size={20} className="text-indigo-400" />
            <h2 className="text-lg font-semibold text-white">Security</h2>
          </div>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={function(e) { setNewPassword(e.target.value); }}
                placeholder="Enter new password"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={function(e) { setConfirmPassword(e.target.value); }}
                placeholder="Confirm new password"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
            <button
              type="submit"
              disabled={changingPassword || !newPassword}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded-lg transition disabled:opacity-50"
            >
              <Shield size={14} />
              {changingPassword ? 'Sending...' : 'Reset Password'}
            </button>
          </form>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Bell size={20} className="text-indigo-400" />
            <h2 className="text-lg font-semibold text-white">Account Details</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-800">
              <span className="text-gray-400">Account ID</span>
              <span className="text-gray-500 font-mono text-xs">{user ? user.id.substring(0, 8) + '...' : ''}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-800">
              <span className="text-gray-400">Email Verified</span>
              <span className={user && user.is_verified ? 'text-emerald-400' : 'text-amber-400'}>
                {user && user.is_verified ? 'Verified' : 'Not yet'}
              </span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-800">
              <span className="text-gray-400">Currency</span>
              <span className="text-white">{user ? user.currency : 'GHS'}</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-gray-400">Timezone</span>
              <span className="text-white">{user ? user.timezone : ''}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
