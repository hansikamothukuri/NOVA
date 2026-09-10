import axios from 'axios';
 
// Unified Express+Vite application mounts all REST API routes at /api on the active server.
// In this unified architecture, Vite and Express are co-hosted on port 3000.
// Using relative /api guarantees same-origin connectivity across browser previews, iframes, and local runs.
// Any 'localhost' or '127.0.0.1' VITE_API_URL causes network failures in browser previews because the
// browser would attempt to connect to the user's client machine instead of the server container.
const getApiBaseUrl = (): string => {
  const envUrl = (import.meta.env.VITE_API_URL || '').trim();
  if (!envUrl || envUrl === '/' || envUrl === '/api' || envUrl.includes('localhost') || envUrl.includes('127.0.0.1')) {
    return '/api';
  }
  return envUrl;
};

const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // withCredentials disabled to prevent browser third-party cookie blocks inside iframes;
  // authentication is handled securely via Authorization Bearer JWT headers.
  withCredentials: false,
});

// Attach JWT token from localStorage to every outgoing request
api.interceptors.request.use(
  (config) => {
    // Safety guard: ensure the request endpoint never accidentally calls bare "/" or empty string
    if (!config.url || config.url === '/' || config.url === '') {
      config.url = '/health';
    }
    const token = localStorage.getItem('nova_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for consistent error extraction
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const serverMessage = error.response?.data?.message;
    const isNetwork = error.message === 'Network Error' || !error.response;
    
    let message = serverMessage;
    if (!message) {
      if (isNetwork) {
        message = 'Unable to connect to the NOVA server. Please check your internet connection and try again.';
      } else {
        message = error.message || 'An unexpected error occurred';
      }
    }
    
    // Auto-logout if 401 Unauthorized occurs on protected call
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('nova_token');
      localStorage.removeItem('nova_user');
      // Only redirect if on protected page
      if (
        window.location.pathname.startsWith('/dashboard') ||
        window.location.pathname.startsWith('/projects') ||
        window.location.pathname.startsWith('/profile') ||
        window.location.pathname.startsWith('/tasks')
      ) {
        window.location.href = '/login?expired=true';
      }
    }

    const customError: any = new Error(message);
    if (error.response) {
      customError.response = error.response;
      customError.data = error.response.data;
      customError.status = error.response.status;
    }
    return Promise.reject(customError);
  }
);

export default api;
