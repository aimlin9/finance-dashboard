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

export default api;