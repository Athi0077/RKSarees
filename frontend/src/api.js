import axios from 'axios';

const rawApiUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';
const baseURL = rawApiUrl.replace(/\/+$/, '').endsWith('/api')
  ? rawApiUrl.replace(/\/+$/, '')
  : `${rawApiUrl.replace(/\/+$/, '')}/api`;

const api = axios.create({
  baseURL,
});

// Interceptor to add JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  if (error.response && (error.response.status === 401 || error.response.status === 403)) {
    // If we get an unauthorized or forbidden error, token is likely expired or invalid
    localStorage.clear();
    // Only redirect if we're not already on the login page
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }
  return Promise.reject(error);
});

export default api;
