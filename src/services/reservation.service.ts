import axios from "axios";
import type { Reservation } from '../types/reservation.types';
import { toLocalISOString } from '../utils/date.js';
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

export const createReservation = (payload: {
  vehicleId: string;
  parkingId: string;
  parkingSpaceId?: string;
  startTime: Date;
  endTime: Date;
  serviceIds?: string[];
}) => api.post('/api/reservations/', {
  ...payload,
  startTime: toLocalISOString(payload.startTime),
  endTime: toLocalISOString(payload.endTime),
}).then(res => res.data);

export const getReservationsByClient = (clientId: string) => api.get('/api/reservations/client/' + clientId).then(res => res.data);
export const getReservationsByClientId = getReservationsByClient;

export const checkInReservation = (reservationId: string, employeeId: string) =>
  api.post(`/api/reservations/${reservationId}/check-in`, { employeeId }, { headers: { 'x-user-id': employeeId } }).then(res => res.data);

export const checkOutReservation = (reservationId: string, employeeId: string) =>
  api.post(`/api/reservations/${reservationId}/check-out`, { employeeId }, { headers: { 'x-user-id': employeeId } }).then(res => res.data);

export const getReservationsByOwner = (ownerId: string) => api.get('/api/reservations/owner/' + ownerId).then(res => res.data);
export const cancelReservation = (reservationId: string, userId: string) =>
  api
    .delete(`/api/reservations/${reservationId}/cancel`, {
      data: { userId },
      headers: { 'x-user-id': userId },
    })
    .catch(() =>
      api.delete(`/api/reservations/${reservationId}`, {
        data: { userId },
        headers: { 'x-user-id': userId },
      })
    )
    .then((res) => res.data);

