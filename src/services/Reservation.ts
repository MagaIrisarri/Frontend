import axios from "axios";
import type { Reservation } from '../types/Reservation.js';
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

const toLocalISOString = (date: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

export const createReservation = (payload: {
  vehicleId: string;
  parkingId: string;
  parkingSpaceId: string;
  startTime: Date;
  endTime: Date;
}) => api.post('/api/reservations/', {
  ...payload,
  startTime: toLocalISOString(payload.startTime),
  endTime: toLocalISOString(payload.endTime),
}).then(res => res.data);