import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

// Única instancia para la API: cada pedido lleva el token del login (3.1.1).
export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Un 401 con token es una sesión vencida o un usuario dado de baja: se cierra la sesión y ProtectedRoute redirige.
// Un login fallido no lleva token, así que no entra acá.
api.interceptors.response.use(undefined, (err) => {
  if (err.response?.status === 401 && err.config?.headers?.Authorization) useAuthStore.getState().logout();
  return Promise.reject(err);
});
