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

// RA-26: descripciones del DNRPA de la tabla y a qué tipo van. `assigned`: van a este tipo; `suggested`: su nombre aparece en la descripción.
export interface TypeDescription {
  description: string; key: string; models: number;
  vehicleType: { id: string; name: string }; assigned: boolean; suggested: boolean;
}
export interface DescriptionChange {
  descriptions: number; models: number; vehicles: number;
  reservations: { code: string; plate: string; status: string; startTime: string; parking: string }[];
}
export const getTypeDescriptions = (id: string): Promise<TypeDescription[]> =>
  api.get(`/api/vehicle-types/${id}/descriptions`).then(res => res.data.data);
// Deja en el tipo exactamente esas descripciones (por clave); con dryRun solo cuenta. Con reservas activas, 409 con details.reservations.
export const setTypeDescriptions = (id: string, descriptions: string[], dryRun: boolean): Promise<DescriptionChange> =>
  api.put(`/api/vehicle-types/${id}/descriptions`, { descriptions, dryRun }).then(res => res.data.data);
