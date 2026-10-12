import { AlertCircle, ArrowRightLeft, Bell, Calendar, Check, Clock, FileText, XCircle } from 'lucide-react';
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
}

const ICON: Record<NotificationType, typeof Bell> = {
  RESERVA_NUEVA: Calendar, RESERVA_CONFIRMADA: Check, RESERVA_CANCELADA: XCircle, RESERVA_VENCIDA: XCircle,
  RESERVA_EXTENDIDA: Clock, PLAZA_CAMBIADA: ArrowRightLeft, SALIDA: FileText, RECORDATORIO: Bell,
};

// fmtD (owner.lib) exige 'YYYY-MM-DD'; acá llega la fecha y hora completa.
const when = (iso: string) => new Date(iso).toLocaleString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

// Avisos de la cuenta en el panel lateral del estándar; el estado y el polling viven en NotificationsProvider.
export function NotificationsDrawer({ isOpen, onClose, items, unread, loading, error, onRetry, onRead, onReadAll }: NotificationsDrawerProps) {
  return (
    <Presence open={isOpen}>
    <OwnerShell bare>
      <Drawer title="Notificaciones" sub="Avisos de tu cuenta y reservas" onClose={onClose}>
        <div className="dbody stack">
          {loading && items.length === 0 ? (
            <SkeletonRows n={4} cols={1} />
          ) : error && items.length === 0 ? (
            <ErrorBox what="las notificaciones" onRetry={onRetry} />
          ) : items.length === 0 ? (
            <Empty icon={<Bell className="i" />} title="No tenés notificaciones">
              Te avisamos cuando haya novedades sobre tus reservas.
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
                return (
                  <article key={n.id} className={`rcard${read ? ' read' : ''}`}>
                    <div className="rtop">
                      <div className="rn nt"><Icon className="i" aria-hidden="true" />{n.title}</div>
                      <span className={read ? 'sd' : 'tag'}>{read ? when(n.createdAt) : `Nueva · ${when(n.createdAt)}`}</span>
                    </div>
                    <p className="sub">{n.message}</p>
                    {!read && (
                      <button type="button" className="btn ghost sm" onClick={() => onRead(n.id)}>
                        <Check className="i sm" />Marcar como leída
                      </button>
                    )}
                  </article>
                );
              })}
            </>
          )}
        </div>
      </Drawer>
    </OwnerShell>
    </Presence>
  );
}
