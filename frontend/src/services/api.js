import axios from 'axios';

// In production the frontend and API share an origin, so the relative '/api'
// base URL is used. Set VITE_API_BASE_URL to point at a different origin.
const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';

const TOKEN_KEY = 'bt_token';

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore storage errors */
  }
}

export function clearToken() {
  setToken(null);
}

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let unauthorizedHandler = null;
export function setUnauthorizedHandler(fn) {
  unauthorizedHandler = fn;
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const isLoginRequest = (error.config?.url || '').includes('/auth/login');

    if (status === 401 && !isLoginRequest) {
      clearToken();
      if (typeof unauthorizedHandler === 'function') unauthorizedHandler();
    }

    const message =
      error.response?.data?.message ||
      (error.code === 'ECONNABORTED'
        ? 'The request timed out. Please try again.'
        : error.message) ||
      'Something went wrong.';

    const normalized = new Error(message);
    normalized.status = status;
    normalized.errors = error.response?.data?.errors || null;
    return Promise.reject(normalized);
  }
);

export default api;
