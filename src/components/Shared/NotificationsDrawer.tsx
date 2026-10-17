import { AR_TZ } from '../../utils/date';
import { AlertCircle, ArrowRightLeft, Bell, Calendar, CalendarDays, Check, ChevronRight, Clock, FileText, LogIn, Pause, UserCheck, XCircle } from 'lucide-react';
import type { AppNotification, NotificationType } from '../../services/notification.service';
import { Drawer } from '../Owner/ui/Layer';
import OwnerShell from '../Owner/ui/OwnerShell';
import { Presence } from '../Owner/ui/Presence';
import { Empty, ErrorBox, SkeletonRows } from '../Owner/ui/Page';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: AppNotification[];
  unread: number;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  onRead: (id: string) => void;
  onReadAll: () => void;
  onOpen: (n: AppNotification) => void; // marca como leída y abre lo que avisa
  canOpen: (n: AppNotification) => boolean;
  onlyUnread: boolean;
  onFilter: (onlyUnread: boolean) => void;
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
}

const ICON: Record<NotificationType, typeof Bell> = {
  RESERVA_NUEVA: Calendar, RESERVA_CANCELADA: XCircle, RESERVA_VENCIDA: XCircle,
  RESERVA_EXTENDIDA: Clock, PLAZA_CAMBIADA: ArrowRightLeft, SALIDA: FileText, RECORDATORIO: Bell, INGRESO: LogIn, RESERVA_TRANSFERIDA: UserCheck, SUCURSAL_LLENA: AlertCircle, SUCURSAL_PAUSADA: Pause, FERIADOS_ACTUALIZADOS: CalendarDays,
};

// fmtD (owner.lib) exige 'YYYY-MM-DD'; acá llega la fecha y hora completa.
const when = (iso: string) => new Date(iso).toLocaleString('es-AR', { timeZone: AR_TZ, day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

// Avisos de la cuenta en el panel lateral del estándar; el estado y el polling viven en NotificationsProvider.
export function NotificationsDrawer({ isOpen, onClose, items, unread, loading, error, onRetry, onRead, onReadAll, onOpen, canOpen, onlyUnread, onFilter, hasMore, loadingMore, onLoadMore }: NotificationsDrawerProps) {
  return (
    <Presence open={isOpen}>
    <OwnerShell bare>
      <Drawer title="Notificaciones" sub="Avisos de los últimos 30 días" onClose={onClose}>
        <div className="dbody stack">
          <div className="seg" role="group" aria-label="Qué avisos ver">
            <button type="button" aria-pressed={onlyUnread} onClick={() => onFilter(true)}>No leídas</button>
            <button type="button" aria-pressed={!onlyUnread} onClick={() => onFilter(false)}>Todas</button>
          </div>
          {loading && items.length === 0 ? (
            <SkeletonRows n={4} cols={1} />
          ) : error && items.length === 0 ? (
            <ErrorBox what="las notificaciones" onRetry={onRetry} />
          ) : items.length === 0 ? (
            <Empty icon={<Bell className="i" />} title={onlyUnread ? 'No tenés avisos sin leer' : 'No tenés notificaciones'}>
              {onlyUnread ? 'Los leídos siguen en “Todas” durante 30 días.' : 'Te avisamos cuando haya novedades sobre tus reservas.'}
            </Empty>
          ) : (
            <>
              <div className="rfoot nb">
                <span>{unread ? `${unread} sin leer` : 'Todo al día'}</span>
                {unread > 0 && (
                  <button type="button" className="btn ghost sm" data-first onClick={onReadAll}>
                    <Check className="i sm" />Marcar todas como leídas
                  </button>
                )}
              </div>
              {error && <p className="sub" role="alert"><AlertCircle className="i sm" aria-hidden="true" /> No pudimos actualizar los avisos. <button type="button" className="btn ghost sm" onClick={onRetry}>Reintentar</button></p>}
              {items.map((n) => {
                const Icon = ICON[n.type] ?? Bell;
                const read = !!n.readAt;
                const go = canOpen(n);
                return (
                  <article key={n.id} className={`rcard${read ? ' read' : ''}`}>
                    <div className="rtop">
                      <div className="rn nt"><Icon className="i" aria-hidden="true" />{n.title}</div>
                      <span className={read ? 'sd' : 'tag'}>{read ? when(n.createdAt) : `Nueva · ${when(n.createdAt)}`}</span>
                    </div>
                    <p className="sub">{n.message}</p>
                    {(go || !read) && (
                      <div className="acts">
                        {go && (
                          <button type="button" className="btn sm" onClick={() => onOpen(n)}>
                            {n.reservationId ? 'Ver reserva' : 'Ver sucursal'}<ChevronRight className="i sm" />
                          </button>
                        )}
                        {!read && (
                          <button type="button" className="btn ghost sm" onClick={() => onRead(n.id)}>
                            <Check className="i sm" />Marcar como leída
                          </button>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
              {hasMore && (
                <button type="button" className="btn" disabled={loadingMore} aria-busy={loadingMore || undefined} onClick={onLoadMore}>
                  {loadingMore ? 'Cargando…' : 'Ver más'}
                </button>
              )}
            </>
          )}
        </div>
      </Drawer>
    </OwnerShell>
    </Presence>
  );
}
