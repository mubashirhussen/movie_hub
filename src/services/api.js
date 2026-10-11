import axios from 'axios';

// Resolve API Base URL from environment variable if provided, with safe fallback to relative /api
const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
const baseURL = rawBaseUrl.endsWith('/api')
  ? rawBaseUrl
  : `${rawBaseUrl.replace(/\/+$/, '')}/api`;

const api = axios.create({
  baseURL,
  timeout: 15000,
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

// Response interceptor for consistent error unwrapping and sanitized user-friendly messaging
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Preserve cancelled requests without converting to general error
    if (axios.isCancel(error) || error.name === 'CanceledError' || error.name === 'AbortError') {
      return Promise.reject(error);
    }

    let userMessage = 'An unexpected error occurred while loading movie data.';
    const status = error.response?.status;

    if (!error.response) {
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        userMessage = 'Request timed out. Please check your internet connection.';
      } else {
        userMessage = 'CineVerse backend is currently unreachable. Please ensure the server is running.';
      }
    } else if (status === 401 || status === 403) {
      userMessage = error.response.data?.message || 'Access denied or session expired. Please sign in again.';
    } else if (status === 429) {
      userMessage = 'Rate limit exceeded. Please wait a moment before trying again.';
    } else if (status >= 500) {
      userMessage = error.response.data?.message || 'Server encountered an issue while loading movie data. Please retry.';
    } else if (error.response.data?.message) {
      userMessage = error.response.data.message;
    }

    const sanitizedError = new Error(userMessage);
    sanitizedError.status = status;
    sanitizedError.code = error.code;
    return Promise.reject(sanitizedError);
  }
);

export default api;
