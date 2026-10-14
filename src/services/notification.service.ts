import { api } from './api';

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

// El backend toma el usuario del token y devuelve solo sus avisos (las últimas 50) con el total sin leer.
export const getNotifications = (): Promise<{ data: AppNotification[]; unread: number }> =>
  api.get('/api/notifications').then(res => res.data);

export const markNotificationRead = (id: string) =>
  api.patch(`/api/notifications/${id}/read`, {}).then(res => res.data);

export const markAllNotificationsRead = () =>
  api.post('/api/notifications/read-all', {}).then(res => res.data);
