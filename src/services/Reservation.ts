import axios from "axios";
import type { Reservation } from '../types/Reservation.js';
import { toLocalISOString } from '../utils/date.js';
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

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