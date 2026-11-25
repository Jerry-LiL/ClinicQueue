import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function errorMessage(error, fallback) {
  if (error.response?.data?.message) return error.response.data.message;
  if (!error.response) return 'Could not reach the server';
  return fallback;
}

export default api;
