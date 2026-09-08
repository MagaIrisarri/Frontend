import axios from "axios";
import type { VehicleType, CreateVehicleTypeInput, UpdateVehicleTypeInput } from '../types/vehicle.types.ts';
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

export const getVehicleTypes = () => api.get('/api/vehicle-types').then(res => res.data);
export const createVehicleType = (data: CreateVehicleTypeInput) => api.post('/api/vehicle-types', data).then(res => res.data);
export const updateVehicleType = (id: string, data: UpdateVehicleTypeInput) => api.put(`/api/vehicle-types/${id}`, data).then(res => res.data);
export const removeVehicleType = (id: string) => api.delete(`/api/vehicle-types/${id}`).then(res => res.data);
