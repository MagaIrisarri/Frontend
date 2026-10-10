import axios from "axios";
import type { formInitialState } from "../types/user.types";

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

export const updateUser = (id: string, datos: Partial<typeof formInitialState>) => api.put(`/api/users/${id}`, datos).then(res => res.data);
export const removeUser = (id: string) => api.delete(`/api/users/${id}`).then(res => res.data);
export const loginUser = (email: string, password: string) => api.post("/api/users/login", { email, password }).then(res => res.data);
// Panel del administrador: todos los usuarios, reactivar y alta de dueños (el registro público usa el mismo endpoint).
export const getUsers = () => api.get('/api/users').then(res => res.data.data);
export const reactivateUser = (id: string) => api.post(`/api/users/${id}/reactivate`).then(res => res.data);
export const createOwner = (data: { dni: string; name: string; last_name: string; date_of_birth: string; phone: string; email: string; password: string }) =>
  api.post('/api/users', { ...data, type: 'DUEÑO' }).then(res => res.data);
export const changePassword =(id: string, currentPassword: string, newPassword: string) => api.patch(`/api/users/${id}/password`, { currentPassword, newPassword }).then(res => res.data);
