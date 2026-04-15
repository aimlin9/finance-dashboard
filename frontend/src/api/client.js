import axios from 'axios';

var baseURL = import.meta.env.VITE_API_URL || '/api';

var api = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(function(config) {
  var token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = 'Bearer ' + token;
  }
  return config;
});

api.interceptors.response.use(
  function(response) { return response; },
  async function(error) {
    var originalRequest = error.config;

    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        var refresh = localStorage.getItem('refresh_token');
        if (!refresh) throw new Error('No refresh token');

        var res = await axios.post(baseURL + '/auth/refresh/', { refresh: refresh }, {
          headers: { 'Content-Type': 'application/json' },
        });

        var newAccess = res.data.access;
        localStorage.setItem('access_token', newAccess);

        if (res.data.refresh) {
          localStorage.setItem('refresh_token', res.data.refresh);
        }

        originalRequest.headers.Authorization = 'Bearer ' + newAccess;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;