import axios from "axios";
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

export type NotificationType =
  | 'RESERVA_NUEVA' | 'RESERVA_CONFIRMADA' | 'RESERVA_CANCELADA' | 'RESERVA_VENCIDA'
  | 'RESERVA_EXTENDIDA' | 'PLAZA_CAMBIADA' | 'SALIDA' | 'RECORDATORIO';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  reservationId?: string | null;
  createdAt: string; // ISO completo
  readAt?: string | null;
}

// El backend toma el usuario de x-user-id y devuelve solo sus avisos (las últimas 50) con el total sin leer.
const as = (userId: string) => ({ headers: { 'x-user-id': userId } });

export const getNotifications = (userId: string): Promise<{ data: AppNotification[]; unread: number }> =>
  api.get('/api/notifications', as(userId)).then(res => res.data);

export const markNotificationRead = (id: string, userId: string) =>
  api.patch(`/api/notifications/${id}/read`, {}, as(userId)).then(res => res.data);

export const markAllNotificationsRead = (userId: string) =>
  api.post('/api/notifications/read-all', {}, as(userId)).then(res => res.data);
