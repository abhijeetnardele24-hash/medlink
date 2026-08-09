import axios from 'axios';
import { auth } from './firebase';

export const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/v1', // Point to the Express backend v1 API
});

api.interceptors.request.use(async (config) => {
  if (auth.currentUser) {
    const token = await auth.currentUser.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

