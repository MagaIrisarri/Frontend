import { api } from './api';
import type { VehicleType, VehicleTypeInput } from '../types/vehicle.types';

// CRUD de tipos de vehículo del administrador (las escrituras exigen un administrador en el backend).
export const getVehicleTypes = (): Promise<{ data: VehicleType[] }> =>
  api.get('/api/vehicle-types').then(res => res.data);
export const createVehicleType = (data: VehicleTypeInput) =>
  api.post('/api/vehicle-types', data).then(res => res.data);
export const updateVehicleType = (id: string, data: VehicleTypeInput) =>
  api.put(`/api/vehicle-types/${id}`, data).then(res => res.data);
export const removeVehicleType = (id: string) =>
  api.delete(`/api/vehicle-types/${id}`).then(res => res.data);
