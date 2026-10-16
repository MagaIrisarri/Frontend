import { api } from './api';
import type { formInitialState } from "../types/user.types";


export const updateUser = (id: string, datos: Partial<typeof formInitialState>) => api.put(`/api/users/${id}`, datos).then(res => res.data);
export const removeUser = (id: string) => api.delete(`/api/users/${id}`).then(res => res.data);
export const loginUser = (email: string, password: string) => api.post("/api/users/login", { email, password }).then(res => res.data);
// Panel del administrador: todos los usuarios y reactivar.
export const getUsersPage = (query: Record<string, unknown>) => api.get('/api/users', { params: query }).then(res => ({ data: res.data.data, meta: res.data.meta }));
export const getUser = (id: string) => api.get(`/api/users/${id}`).then(res => res.data.data);
export const reactivateUser = (id: string) => api.post(`/api/users/${id}/reactivate`).then(res => res.data);
// DA-02: contraseña temporal; el usuario la tiene que cambiar al iniciar sesión.
export const resetUserPassword = (id: string, password: string) => api.post(`/api/users/${id}/reset-password`, { password }).then(res => res.data);
export interface UserData { dni: string; name: string; last_name: string; date_of_birth: string; phone: string; email: string }
// Alta desde el panel del administrador: cliente y dueño por el registro; el empleado depende de un dueño y de una sucursal de ese dueño.
export const createUser = (type: 'CLIENTE' | 'DUEÑO', data: UserData & { password: string }) => api.post('/api/users', { ...data, type }).then(res => res.data);
export const createEmployee = (ownerId: string, data: UserData & { password: string; parkingId: string }) => api.post(`/api/users/${ownerId}/employee`, data).then(res => res.data);
export const updateEmployee = (ownerId: string, id: string, data: UserData & { parkingId: string }) => api.put(`/api/users/${ownerId}/employee/${id}`, data).then(res => res.data);
export const changePassword =(id: string, currentPassword: string, newPassword: string) => api.patch(`/api/users/${id}/password`, { currentPassword, newPassword }).then(res => res.data);
