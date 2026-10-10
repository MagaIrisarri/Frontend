import axios from 'axios';
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

export const getEmployeesByOwner = (ownerId: string, status?: 'BAJA') =>
  api.get(`/api/users/${ownerId}/employee`, { params: { status } }).then(res => res.data.data);

export const reactivateEmployee = (ownerId: string, id: string) =>
  api.post(`/api/users/${ownerId}/employee/${id}/reactivate`).then(res => res.data.data);

export const createEmployee = (ownerId: string, payload: any) =>
  api.post(`/api/users/${ownerId}/employee`, payload).then(res => res.data.data);


export const updateEmployee = (ownerId: string, id: string, payload: any) =>
  api.put(`/api/users/${ownerId}/employee/${id}`, payload).then(res => res.data.data);

export const deleteEmployee = (ownerId: string, id: string) =>
  api.delete(`/api/users/${ownerId}/employee/${id}`).then(res => res.data);
