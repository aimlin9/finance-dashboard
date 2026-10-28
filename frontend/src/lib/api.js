import axios from 'axios';

export const baseURL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({ baseURL });

const tokens = {
  get access() { return localStorage.getItem('access_token'); },
  get refresh() { return localStorage.getItem('refresh_token'); },
  set(access, refresh) {
    localStorage.setItem('access_token', access);
    if (refresh) localStorage.setItem('refresh_token', refresh);
  },
  clear() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },
};

export { tokens };

api.interceptors.request.use((config) => {
  if (tokens.access) config.headers.Authorization = `Bearer ${tokens.access}`;
  return config;
});

// Access tokens last a day. When one expires mid-session, refresh it once
// (shared by every request that failed at the same moment) and retry,
// instead of leaving the app broken until a full reload.
let refreshing = null;
let onSessionExpired = () => {};

export function setSessionExpiredHandler(fn) {
  onSessionExpired = fn;
}

export function refreshAccessToken() {
  if (!tokens.refresh) return Promise.reject(new Error('No refresh token'));
  if (!refreshing) {
    refreshing = axios
      .post(`${baseURL}/auth/refresh/`, { refresh: tokens.refresh })
      .then((res) => {
        tokens.set(res.data.access, res.data.refresh);
        return res.data.access;
      })
      .finally(() => { refreshing = null; });
  }
  return refreshing;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const isAuthCall = original?.url?.startsWith('/auth/login') || original?.url?.startsWith('/auth/refresh');
    if (error.response?.status === 401 && original && !original._retried && !isAuthCall && tokens.refresh) {
      original._retried = true;
      try {
        const access = await refreshAccessToken();
        original.headers.Authorization = `Bearer ${access}`;
        return api(original);
      } catch {
        tokens.clear();
        onSessionExpired();
      }
    }
    return Promise.reject(error);
  },
);

/** Turn any API error into one sentence a person can act on. */
export function errorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (!error?.response) {
    return error?.message === 'Network Error' ? "Can't reach the server. Check your connection." : fallback;
  }
  const data = error.response.data;
  if (error.response.status === 429) return 'Too many attempts. Wait a minute and try again.';
  if (typeof data === 'string') return fallback;
  if (data?.error) return data.error;
  if (data?.detail) return data.detail;
  if (data && typeof data === 'object') {
    const first = Object.values(data)[0];
    if (Array.isArray(first)) return first[0];
    if (typeof first === 'string') return first;
  }
  return fallback;
}

export async function downloadFile(url, filename) {
  const res = await api.get(url, { responseType: 'blob' });
  const href = URL.createObjectURL(res.data);
  const link = document.createElement('a');
  link.href = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}

export default api;
