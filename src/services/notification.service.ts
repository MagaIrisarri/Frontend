import { api } from './api';

export type NotificationType =
  | 'RESERVA_NUEVA' | 'RESERVA_CANCELADA' | 'RESERVA_VENCIDA'
  | 'RESERVA_EXTENDIDA' | 'PLAZA_CAMBIADA' | 'SALIDA' | 'RECORDATORIO' | 'INGRESO' | 'RESERVA_TRANSFERIDA' | 'SUCURSAL_LLENA' | 'SUCURSAL_PAUSADA'
  | 'FERIADOS_ACTUALIZADOS';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  reservationId?: string | null;
  parkingId?: string | null; // avisos de una sucursal sin reserva (llena, pausada)
  createdAt: string; // ISO completo
  readAt?: string | null;
}

// L-31: el backend toma el usuario del token y devuelve sus avisos de los últimos 30 días, de a páginas (`next` sigue
// la lista), con el total sin leer de esa misma ventana. `unread` trae solo las no leídas.
export const getNotifications = (opts: { unread?: boolean; cursor?: string | null } = {}): Promise<{ data: AppNotification[]; unread: number; next: string | null }> =>
  api.get('/api/notifications', { params: { ...(opts.unread && { unread: '1' }), ...(opts.cursor && { cursor: opts.cursor }) } }).then(res => res.data);

// Adónde lleva tocar un aviso, según el rol: la reserva que avisa o la sucursal; null si no hay nada que abrir.
export const notificationTarget = (n: AppNotification, role: string): string | null => {
  const r = role.toUpperCase();
  if (n.reservationId) {
    if (r === 'CLIENTE') return `/reservations?r=${n.reservationId}`;
    if (r.startsWith('DUE')) return `/owner/reservations?r=${n.reservationId}`;
    if (r === 'EMPLEADO') return `/employee?r=${n.reservationId}`;
  }
  if (n.parkingId) {
    if (r.startsWith('DUE')) return `/owner?p=${n.parkingId}`;
    if (r === 'EMPLEADO') return '/employee';
  }
  if (n.type === 'FERIADOS_ACTUALIZADOS' && r === 'ADMINISTRADOR') return '/admin/holidays?import=1'; // L-12
  return null;
};

export const markNotificationRead = (id: string) =>
  api.patch(`/api/notifications/${id}/read`, {}).then(res => res.data);

export const markAllNotificationsRead = () =>
  api.post('/api/notifications/read-all', {}).then(res => res.data);
