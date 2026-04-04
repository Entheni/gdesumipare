import axios from 'axios';
import { Capacitor } from '@capacitor/core';
import { clearStoredToken, setStoredToken, authToken } from '../auth/session.js';

function resolveApiBaseUrl() {
  if (import.meta.env.VITE_API_BASE) {
    return import.meta.env.VITE_API_BASE;
  }

  if (!Capacitor.isNativePlatform()) {
    return '';
  }

  const platform = Capacitor.getPlatform();
  if (platform === 'android') {
    return 'http://10.0.2.2:5000';
  }

  if (platform === 'ios') {
    return 'http://localhost:5000';
  }

  return '';
}

const api = axios.create({
  baseURL: resolveApiBaseUrl(),
});

export function setAuthToken(token) {
  if (token) {
    setStoredToken(token);
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  }
}

export function clearAuthToken() {
  clearStoredToken();
  delete api.defaults.headers.common.Authorization;
}

const token = authToken.value;
if (token) setAuthToken(token);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 && authToken.value) {
      clearAuthToken();
      if (window.location.pathname !== '/prijava') {
        window.location.assign('/prijava');
      }
    }

    return Promise.reject(error);
  }
);

export default api;
