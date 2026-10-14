import { api } from './api';
import type { ParkingSpace, ParkingSpaceState } from '../types/parkingSpace.types';
import { toLocalISOString } from '../utils/date.js';

export const getParkingSpace = (parkingId: string) => api.get(`/api/parkings/${parkingId}/spaces`).then(res => res.data);
export const getSpaceAvailability = (parkingId: string, vehicleTypeId: string, startTime: Date, endTime: Date) =>
  api.get(`/api/parkings/${parkingId}/spaces/availability`, {
    params: { vehicleTypeId, startTime: toLocalISOString(startTime), endTime: toLocalISOString(endTime) },
  }).then(res => res.data);
export const createBulkParkingSpaces = (parkingId: string, data: { vehicleTypeId: string; count: number }) =>
  api.put(`/api/parkings/${parkingId}/spaces`, data).then(res => res.data);
// relocate: confirma pasar las reservas futuras de la plaza a otras libres (sin él, el backend responde 409 con la propuesta).
export const updateParkingSpace = (id: string, data: (Partial<ParkingSpace> | ParkingSpaceState) & { relocate?: boolean }) =>
  api.put(`/api/parkings/spaces/${id}`, data).then(res => res.data);
export const removeParkingSpace = (id: string, relocate = false) =>
  api.delete(`/api/parkings/spaces/${id}`, { params: relocate ? { relocate: 'true' } : undefined }).then(res => res.data);
