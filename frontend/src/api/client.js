import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '',
});

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('token', token);
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  }
}

export function clearAuthToken() {
  localStorage.removeItem('token');
  delete api.defaults.headers.common.Authorization;
}

// Initialize from storage on load
const token = localStorage.getItem('token');
if (token) setAuthToken(token);

export default api;

