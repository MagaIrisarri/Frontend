import axios from 'axios';
import type { Vehicle, UpdateVehicle, CreateVehicle } from '@/types/vehicle.types.js';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });


export const getUserVehicle = (userId: string) => api.get(`/api/vehicles/client/${userId}`).then(res => res.data);
export const createVehicle = (userId: string, data: CreateVehicle) => api.post(`/api/vehicles/client/${userId}`, data).then(res => res.data);
export const updateVehicle = (id: string, data: UpdateVehicle) => api.put(`/api/vehicles/${id}`, data).then(res => res.data);
export const removeVehicle = (id: string) => api.delete(`/api/vehicles/${id}`).then(res => res.data);
export const getBrands = () => api.get('/api/brands').then(res => res.data);
export const getModels = (brandId?: string) => api.get('/api/models', { params: brandId ? { brandId } : undefined }).then(res => res.data);
export const getInsurances = () => api.get('/api/insurances').then(res => res.data);
export const getOneVehicle = (id: string) => api.get(`/api/vehicles/${id}`).then(res => res.data);






