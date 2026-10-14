import { api } from './api';
import { toLocalISOString } from '../utils/date.js';

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
// Lo cambia el personal de la sucursal (el usuario del token) y el empleado tiene que ser de esa sucursal.
export const assignReservationEmployee = (reservationId: string, employeeId: string) =>
  api.put(`/api/reservations/${reservationId}`, { attendedById: employeeId }).then(res => res.data);

export const getReservationsByOwner =(ownerId: string) => api.get('/api/reservations/owner/' + ownerId).then(res => res.data);
export const getReservationsByParking = (parkingId: string) => api.get('/api/reservations/parking/' + parkingId).then(res => res.data);
export const cancelReservation = (reservationId: string) =>
  api.delete(`/api/reservations/${reservationId}`).then(res => res.data);

// El backend verifica que quien cambia la plaza sea personal de esa sucursal (el usuario del token).
export const changeReservationSpace = (reservationId: string, parkingSpaceId: string) =>
  api.patch(`/api/reservations/${reservationId}/space`, { parkingSpaceId }).then(res => res.data);

// Solo confirma el personal de la sucursal (empleado o dueño), identificado por el token.
export const confirmReservation = (reservationId: string) =>
  api.patch(`/api/reservations/${reservationId}/confirm`, {}).then(res => res.data);

// El backend toma el empleado del token y lo guarda como quien registró el ingreso.
export const checkInReservation = (reservationId: string) =>
  api.post(`/api/reservations/${reservationId}/check-in`, {}).then(res => res.data);

export const checkOutReservation = (reservationId: string) =>
  api.post(`/api/reservations/${reservationId}/check-out`, {}).then(res => res.data);

// R-23: el personal de la sucursal extiende el fin; las reservas siguientes de esa plaza que no entraron pasan a otra libre.
export const extendReservation = (reservationId: string, endTime: Date) =>
  api.patch(`/api/reservations/${reservationId}/end`, { endTime: toLocalISOString(endTime) }).then(res => res.data);

// R-24: deja la reserva con estos servicios (ServicePrice.id de la cochera); se cobran en la salida.
export const setReservationServices = (reservationId: string, serviceIds: string[]) =>
  api.put(`/api/reservations/${reservationId}/services`, { serviceIds }).then(res => res.data);

// R-27: valoración opcional (1 a 5) de una reserva finalizada; solo la deja su cliente, una vez.
export const rateReservation = (reservationId: string, rating: number) =>
  api.patch(`/api/reservations/${reservationId}/rating`, { rating }).then(res => res.data);

// R-29: ingreso de mostrador sin reserva previa. El servidor fija el inicio (ahora, sin segundos); fin = inicio + horas completas.
// Si el email no tiene cuenta, el backend crea un CLIENTE con el DNI como contraseña.
export interface WalkInPayload {
  parkingId: string; plate: string; brandId: string; modelId: string; hours: number; serviceIds?: string[];
  name: string; last_name: string; dni: string; email: string; phone?: string;
}
export const walkInReservation = (payload: WalkInPayload) =>
  api.post('/api/reservations/walk-in', payload).then(res => res.data);
