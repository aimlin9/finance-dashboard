import { create } from 'zustand';

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
        } catch (err) {}
      }

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

            var userRes = await fetch(baseUrl + '/auth/me/', {
              headers: { 'Authorization': 'Bearer ' + tokens.access },
            });
            if (userRes.ok) {
              var user = await userRes.json();
              set({ user: user, isAuthenticated: true, isLoading: false });
              return;
            }
          }
        } catch (err) {}
      }

      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      set({ user: null, isAuthenticated: false, isLoading: false });
    },

    login: async function(email, password) {
      var res = await fetch(baseUrl + '/auth/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, password: password }),
      });
      if (!res.ok) throw new Error('Login failed');
      var data = await res.json();
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);

      var userRes = await fetch(baseUrl + '/auth/me/', {
        headers: { 'Authorization': 'Bearer ' + data.access },
      });
      var userData = await userRes.json();
      set({ user: userData, isAuthenticated: true });
    },

    register: async function(email, fullName, password, passwordConfirm) {
      var res = await fetch(baseUrl + '/auth/register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          full_name: fullName,
          password: password,
          password_confirm: passwordConfirm,
        }),
      });
      if (!res.ok) throw new Error('Registration failed');
      var data = await res.json();
      localStorage.setItem('access_token', data.tokens.access);
      localStorage.setItem('refresh_token', data.tokens.refresh);
      set({ user: data.user, isAuthenticated: true });
    },

    logout: function() {
      var refresh = localStorage.getItem('refresh_token');
      var accessToken = localStorage.getItem('access_token');
      if (refresh) {
        fetch(baseUrl + '/auth/logout/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + accessToken,
          },
          body: JSON.stringify({ refresh: refresh }),
        }).catch(function() {});
      }
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      set({ user: null, isAuthenticated: false });
    },
  };
});

export default useAuthStore;