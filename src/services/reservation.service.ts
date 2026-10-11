import axios from "axios";
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

// R-07: empleado asignado ("Registrada por"), editable mientras la reserva está en curso o reservada.
export const assignReservationEmployee = (reservationId: string, employeeId: string) =>
  api.put(`/api/reservations/${reservationId}`, { attendedById: employeeId }).then(res => res.data);

export const getReservationsByOwner =(ownerId: string) => api.get('/api/reservations/owner/' + ownerId).then(res => res.data);
export const getReservationsByParking = (parkingId: string) => api.get('/api/reservations/parking/' + parkingId).then(res => res.data);
export const cancelReservation = (reservationId: string, userId: string) =>
  api.delete(`/api/reservations/${reservationId}`, { data: { userId }, headers: { 'x-user-id': userId } }).then(res => res.data);

// El backend verifica que quien cambia la plaza sea personal de esa sucursal (x-user-id).
export const changeReservationSpace = (reservationId: string, parkingSpaceId: string, userId: string) =>
  api.patch(`/api/reservations/${reservationId}/space`, { parkingSpaceId }, { headers: { 'x-user-id': userId } }).then(res => res.data);

// Solo confirma el personal de la sucursal (empleado o dueño), identificado por x-user-id.
export const confirmReservation = (reservationId: string, userId: string) =>
  api.patch(`/api/reservations/${reservationId}/confirm`, {}, { headers: { 'x-user-id': userId } }).then(res => res.data);

// El backend toma el empleado del header x-user-id (o del body) y lo guarda como attendedById.
export const checkInReservation = (reservationId: string, employeeId: string) =>
  api.post(`/api/reservations/${reservationId}/check-in`, { employeeId }, { headers: { 'x-user-id': employeeId } }).then(res => res.data);

export const checkOutReservation = (reservationId: string, employeeId: string) =>
  api.post(`/api/reservations/${reservationId}/check-out`, { employeeId }, { headers: { 'x-user-id': employeeId } }).then(res => res.data);
