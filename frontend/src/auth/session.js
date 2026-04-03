import { ref } from 'vue';

const TOKEN_STORAGE_KEY = 'token';

function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

export function isTokenValid(token) {
  if (!token || typeof token !== 'string') {
    return false;
  }

  const payload = parseJwt(token);
  if (!payload?.exp) {
    return false;
  }

  return payload.exp * 1000 > Date.now();
}

function readStoredToken() {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  return isTokenValid(token) ? token : null;
}

export const authToken = ref(readStoredToken());

export function setStoredToken(token) {
  if (!isTokenValid(token)) {
    clearStoredToken();
    return;
  }

  localStorage.setItem(TOKEN_STORAGE_KEY, token);
  authToken.value = token;
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  authToken.value = null;
}

if (!authToken.value) {
  clearStoredToken();
}
