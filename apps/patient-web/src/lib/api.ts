import axios from 'axios';
import { auth } from './firebase';

export const api = axios.create({
  baseURL: 'http://localhost:3000', // Point to the Express backend (no /api prefix)
});

api.interceptors.request.use(async (config) => {
  if (auth.currentUser) {
    const token = await auth.currentUser.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
