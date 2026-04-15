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

      console.log('1. Access token exists:', !!accessToken);
      console.log('2. Refresh token exists:', !!refreshToken);
      console.log('3. Base URL:', baseUrl);

      if (!accessToken && !refreshToken) {
        console.log('4. No tokens at all - going to login');
        set({ isLoading: false, isAuthenticated: false });
        return;
      }

      if (accessToken) {
        try {
          var url = baseUrl + '/auth/me/';
          console.log('5. Trying access token at:', url);
          var res = await fetch(url, {
            headers: { 'Authorization': 'Bearer ' + accessToken },
          });
          console.log('6. Access token response status:', res.status);
          if (res.ok) {
            var userData = await res.json();
            console.log('7. Access token WORKED! User:', userData.email);
            set({ user: userData, isAuthenticated: true, isLoading: false });
            return;
          } else {
            console.log('8. Access token returned non-ok:', res.status);
          }
        } catch (err) {
          console.log('9. Access token FETCH ERROR:', err.message);
        }
      }

      if (refreshToken) {
        try {
          var refreshUrl = baseUrl + '/auth/refresh/';
          console.log('10. Trying refresh at:', refreshUrl);
          var refreshRes = await fetch(refreshUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh: refreshToken }),
          });
          console.log('11. Refresh response status:', refreshRes.status);

          if (refreshRes.ok) {
            var tokens = await refreshRes.json();
            console.log('12. Refresh WORKED! New access token received');
            localStorage.setItem('access_token', tokens.access);
            if (tokens.refresh) {
              localStorage.setItem('refresh_token', tokens.refresh);
            }

            var userRes = await fetch(baseUrl + '/auth/me/', {
              headers: { 'Authorization': 'Bearer ' + tokens.access },
            });
            if (userRes.ok) {
              var user = await userRes.json();
              console.log('13. User fetched with new token:', user.email);
              set({ user: user, isAuthenticated: true, isLoading: false });
              return;
            } else {
              console.log('14. User fetch with new token FAILED:', userRes.status);
            }
          } else {
            var errBody = await refreshRes.text();
            console.log('15. Refresh FAILED:', refreshRes.status, errBody);
          }
        } catch (err) {
          console.log('16. Refresh FETCH ERROR:', err.message);
        }
      }

      console.log('17. BOTH FAILED - clearing tokens');
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