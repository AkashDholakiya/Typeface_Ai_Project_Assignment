import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api'; 

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only auto-logout for token-related 401 errors, not for password validation errors
    if (error.response?.status === 401) {
      if (error.config?.url?.includes('/check-password')) {
        return Promise.reject(error);
      }
      
      if (error.config?.url?.includes('/login')) {
        return Promise.reject(error);
      }
      
      // Auto-logout for other 401 errors (expired token, invalid token, etc.)
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
