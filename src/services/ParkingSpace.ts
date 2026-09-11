import axios from "axios";
import type { ParkingSpace, ParkingSpaceState } from '../types/ParkingSpace.js';
import { toLocalISOString } from '../utils/date.js';
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

export const getParkingSpace = (parkingId: string) => api.get(`/api/parkings/${parkingId}/spaces`).then(res => res.data);
export const getSpaceAvailability = (parkingId: string, vehicleType: string, startTime: Date, endTime: Date) =>
  api.get(`/api/parkings/${parkingId}/spaces/availability`, {
    params: { vehicleType, startTime: toLocalISOString(startTime), endTime: toLocalISOString(endTime) },
  }).then(res => res.data);
export const createParkingSpace = (parkingId: string, data: { spaceCode: string; vehicleType: string; state?: string }) =>
  api.post(`/api/parkings/${parkingId}/spaces`, data).then(res => res.data);
export const updateParkingSpace = (id: string, data: Partial<ParkingSpace> | ParkingSpaceState) => api.put(`/api/parkings/spaces/${id}`, data).then(res => res.data);
export const removeParkingSpace = (id: string) => api.delete(`/api/parkings/spaces/${id}`).then(res => res.data);