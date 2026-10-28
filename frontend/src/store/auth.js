import { create } from 'zustand';
import api, { tokens, refreshAccessToken, setSessionExpiredHandler } from '../lib/api';
import { clearCache } from '../lib/query';

const useAuth = create((set) => ({
  user: null,
  status: 'checking', // 'checking' | 'in' | 'out'

  async checkAuth() {
    if (!tokens.access && !tokens.refresh) {
      set({ status: 'out' });
      return;
    }
    try {
      if (!tokens.access) await refreshAccessToken();
      const res = await api.get('/auth/me/'); // the client refreshes an expired token itself
      set({ user: res.data, status: 'in' });
    } catch {
      tokens.clear();
      set({ user: null, status: 'out' });
    }
  },

  async login(email, password) {
    const res = await api.post('/auth/login/', { email: email.trim().toLowerCase(), password });
    tokens.set(res.data.access, res.data.refresh);
    const me = await api.get('/auth/me/');
    clearCache();
    set({ user: me.data, status: 'in' });
  },

  async register({ email, fullName, password, passwordConfirm }) {
    const res = await api.post('/auth/register/', {
      email: email.trim().toLowerCase(),
      full_name: fullName.trim(),
      password,
      password_confirm: passwordConfirm,
    });
    tokens.set(res.data.tokens.access, res.data.tokens.refresh);
    clearCache();
    set({ user: res.data.user, status: 'in' });
  },

  async updateProfile(changes) {
    const res = await api.patch('/auth/me/', changes);
    set({ user: res.data });
    return res.data;
  },

  logout() {
    const refresh = tokens.refresh;
    if (refresh) api.post('/auth/logout/', { refresh }).catch(() => {});
    tokens.clear();
    clearCache();
    set({ user: null, status: 'out' });
  },

  // Called when the account is deleted or the session can't be refreshed.
  reset() {
    tokens.clear();
    clearCache();
    set({ user: null, status: 'out' });
  },
}));

setSessionExpiredHandler(() => useAuth.getState().reset());

export default useAuth;
