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
// Lo cambia el personal de la sucursal (x-user-id) y el empleado tiene que ser de esa sucursal.
export const assignReservationEmployee = (reservationId: string, employeeId: string, userId: string) =>
  api.put(`/api/reservations/${reservationId}`, { attendedById: employeeId }, { headers: { 'x-user-id': userId } }).then(res => res.data);

export const getReservationsByOwner =(ownerId: string) => api.get('/api/reservations/owner/' + ownerId).then(res => res.data);
export const getReservationsByParking = (parkingId: string) => api.get('/api/reservations/parking/' + parkingId).then(res => res.data);
export const cancelReservation = (reservationId: string, userId: string) =>
  api.delete(`/api/reservations/${reservationId}`, { headers: { 'x-user-id': userId } }).then(res => res.data);

// El backend verifica que quien cambia la plaza sea personal de esa sucursal (x-user-id).
export const changeReservationSpace = (reservationId: string, parkingSpaceId: string, userId: string) =>
  api.patch(`/api/reservations/${reservationId}/space`, { parkingSpaceId }, { headers: { 'x-user-id': userId } }).then(res => res.data);

// Solo confirma el personal de la sucursal (empleado o dueño), identificado por x-user-id.
export const confirmReservation = (reservationId: string, userId: string) =>
  api.patch(`/api/reservations/${reservationId}/confirm`, {}, { headers: { 'x-user-id': userId } }).then(res => res.data);

// El backend toma el empleado del header x-user-id y lo guarda como attendedById.
export const checkInReservation = (reservationId: string, employeeId: string) =>
  api.post(`/api/reservations/${reservationId}/check-in`, {}, { headers: { 'x-user-id': employeeId } }).then(res => res.data);

export const checkOutReservation = (reservationId: string, employeeId: string) =>
  api.post(`/api/reservations/${reservationId}/check-out`, {}, { headers: { 'x-user-id': employeeId } }).then(res => res.data);

// R-23: el personal de la sucursal extiende el fin; las reservas siguientes de esa plaza que no entraron pasan a otra libre.
export const extendReservation = (reservationId: string, endTime: Date, userId: string) =>
  api.patch(`/api/reservations/${reservationId}/end`, { endTime: toLocalISOString(endTime) }, { headers: { 'x-user-id': userId } }).then(res => res.data);

// R-24: deja la reserva con estos servicios (ServicePrice.id de la cochera); se cobran en la salida.
export const setReservationServices = (reservationId: string, serviceIds: string[], userId: string) =>
  api.put(`/api/reservations/${reservationId}/services`, { serviceIds }, { headers: { 'x-user-id': userId } }).then(res => res.data);

// R-27: valoración opcional (1 a 5) de una reserva finalizada; solo la deja su cliente, una vez.
export const rateReservation = (reservationId: string, rating: number, userId: string) =>
  api.patch(`/api/reservations/${reservationId}/rating`, { rating }, { headers: { 'x-user-id': userId } }).then(res => res.data);
