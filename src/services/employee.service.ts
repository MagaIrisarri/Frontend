import axios from 'axios';
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

export const getEmployeesByOwner = (ownerId: string) => 
  api.get(`/api/users/${ownerId}/employee`).then(res => res.data.data);

export const createEmployee = (ownerId: string, payload: any) =>
  api.post(`/api/users/${ownerId}/employee`, payload).then(res => res.data.data);

