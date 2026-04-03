import axios from 'axios';
import { clearStoredToken, setStoredToken, authToken } from '../auth/session.js';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '',
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
