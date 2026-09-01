import axios from "axios";
import type { ParkingSpace } from '../types/ParkingSpace.js';
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

const toLocalISOString = (date: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

export const getParkingSpace = (parkingId: string) => api.get(`/api/parkings/${parkingId}/spaces`).then(res => res.data);
export const getSpaceAvailability = (parkingId: string, vehicleType: string, startTime: Date, endTime: Date) =>
  api.get(`/api/parkings/${parkingId}/spaces/availability`, {
    params: { vehicleType, startTime: toLocalISOString(startTime), endTime: toLocalISOString(endTime) },
  }).then(res => res.data);