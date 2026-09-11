import axios from 'axios';
import { auth } from './firebase';
import toast from 'react-hot-toast';

// Use the local API during development
const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach the Firebase ID token to every request
api.interceptors.request.use(
  async (config) => {
    const user = auth?.currentUser;
    if (user) {
      // Force refresh only if token is expired, otherwise get cached token
      const token = await user.getIdToken(false);
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status;
      if (status === 401) {
        toast.error('Session expired. Please log in again.');
        // Optional: you could trigger a logout or redirect here
      } else if (status >= 500) {
        toast.error('A server error occurred. Please try again later.');
      }
    } else if (error.request) {
      toast.error('Network error. Please check your connection.');
    }
    return Promise.reject(error);
  }
);

