import { create } from 'zustand';
import api from '../api/client';

var baseUrl = import.meta.env.VITE_API_URL || '/api';

var useAuthStore = create(function(set) {
  return {
    user: null,
    isAuthenticated: false,
    isLoading: true,

    checkAuth: async function() {
      var accessToken = localStorage.getItem('access_token');
      var refreshToken = localStorage.getItem('refresh_token');

      if (!accessToken && !refreshToken) {
        set({ isLoading: false, isAuthenticated: false });
        return;
      }

      // Try access token using fetch (bypasses axios interceptor)
      if (accessToken) {
        try {
          var res = await fetch(baseUrl + '/auth/me/', {
            headers: { 'Authorization': 'Bearer ' + accessToken },
          });
          if (res.ok) {
            var userData = await res.json();
            set({ user: userData, isAuthenticated: true, isLoading: false });
            return;
          }
        } catch (err) {
          // Access token failed
        }
      }

      // Access token expired — try refresh
      if (refreshToken) {
        try {
          var refreshRes = await fetch(baseUrl + '/auth/refresh/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh: refreshToken }),
          });

          if (refreshRes.ok) {
            var tokens = await refreshRes.json();
            localStorage.setItem('access_token', tokens.access);
            if (tokens.refresh) {
              localStorage.setItem('refresh_token', tokens.refresh);
            }

            // Now fetch user with new token
            var userRes = await fetch(baseUrl + '/auth/me/', {
              headers: { 'Authorization': 'Bearer ' + tokens.access },
            });
            if (userRes.ok) {
              var user = await userRes.json();
              set({ user: user, isAuthenticated: true, isLoading: false });
              return;
            }
          }
        } catch (err) {
          // Refresh failed
        }
      }

      // Both failed
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      set({ user: null, isAuthenticated: false, isLoading: false });
    },

    login: async function(email, password) {
      var res = await api.post('/auth/login/', { email: email, password: password });
      localStorage.setItem('access_token', res.data.access);
      localStorage.setItem('refresh_token', res.data.refresh);

      var userRes = await api.get('/auth/me/');
      set({ user: userRes.data, isAuthenticated: true });
    },

    register: async function(email, fullName, password, passwordConfirm) {
      var res = await api.post('/auth/register/', {
        email: email,
        full_name: fullName,
        password: password,
        password_confirm: passwordConfirm,
      });
      localStorage.setItem('access_token', res.data.tokens.access);
      localStorage.setItem('refresh_token', res.data.tokens.refresh);
      set({ user: res.data.user, isAuthenticated: true });
    },

    logout: function() {
      var refresh = localStorage.getItem('refresh_token');
      if (refresh) {
        api.post('/auth/logout/', { refresh: refresh }).catch(function() {});
      }
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      set({ user: null, isAuthenticated: false });
    },
  };
});

export default useAuthStore;