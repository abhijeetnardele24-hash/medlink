import axios from 'axios';
import { auth } from './firebase';

// Use the local API during development
const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
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

