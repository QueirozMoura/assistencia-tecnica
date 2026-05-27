import axios from 'axios';
import { storage } from '../utils/storage';

const BASE_URL = 'http://localhost:3000';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Attach JWT token from storage on every request
api.interceptors.request.use((config) => {
  const token = storage.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle global response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token invalid or expired — clear storage and notify the AuthContext
      storage.clear();
      window.dispatchEvent(new Event('auth:logout'));
    } else if (error.response) {
      console.error(`[API] ${error.response.status} ${error.config?.url}:`, error.response.data);
    } else if (error.request) {
      console.error('[API] No response received:', error.message);
    } else {
      console.error('[API] Request error:', error.message);
    }
    return Promise.reject(error);
  }
);
