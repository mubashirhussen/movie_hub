import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token automatically from localStorage to all outgoing requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('cineverse_token') || localStorage.getItem('cinewave_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for consistent error unwrapping
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message || error.message || 'An unexpected network error occurred';
    return Promise.reject(new Error(message));
  }
);

export default api;
