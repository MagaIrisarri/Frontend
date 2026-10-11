import { Bell, Calendar, Check, Info, Tag } from 'lucide-react';
import type { UserNotification } from '../../hooks/useHomePage';
import { Drawer } from '../Owner/ui/Layer';
import OwnerShell from '../Owner/ui/OwnerShell';
import { Presence } from '../Owner/ui/Presence';
import { Empty } from '../Owner/ui/Page';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: UserNotification[];
  onMarkAllAsRead: () => void;
}

const ICON = { reservation: Calendar, promo: Tag, system: Info } as const;

// Avisos de la cuenta en el panel lateral del estándar (reemplaza al modal Tailwind).
export function NotificationsDrawer({ isOpen, onClose, notifications, onMarkAllAsRead }: NotificationsDrawerProps) {
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <Presence open={isOpen}>
    <OwnerShell bare>
      <Drawer title="Notificaciones" sub="Avisos de tu cuenta y reservas" onClose={onClose}>
        <div className="dbody stack">
          {notifications.length === 0 ? (
            <Empty icon={<Bell className="i" />} title="No tenés notificaciones">
              Te avisamos cuando haya novedades sobre tus reservas.
            </Empty>
          ) : (
            <>
              <div className="rfoot nb">
                <span>{unread ? `${unread} sin leer` : 'Todo al día'}</span>
                {unread > 0 && (
                  <button type="button" className="btn ghost sm" data-first onClick={onMarkAllAsRead}>
                    <Check className="i sm" />Marcar todas como leídas
                  </button>
                )}
              </div>
              {notifications.map((n) => {
                const Icon = ICON[n.type] ?? Info;
                return (
                  <article key={n.id} className={`rcard${n.read ? ' read' : ''}`}>
                    <div className="rtop">
                      <div className="rn nt"><Icon className="i" aria-hidden="true" />{n.title}</div>
                      <span className={n.read ? 'sd' : 'tag'}>{n.read ? n.date : `Nueva · ${n.date}`}</span>
                    </div>
                    <p className="sub">{n.message}</p>
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
