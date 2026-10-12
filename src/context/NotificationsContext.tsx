import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { NotificationsDrawer } from '../components/Shared/NotificationsDrawer';
import { useAuthStore } from '../stores/authStore';
import {
  getNotifications, markAllNotificationsRead, markNotificationRead, type AppNotification,
} from '../services/notification.service';

const POLL_MS = 30_000;

interface NotificationsApi {
  unread: number;
  open: () => void;
}

const Ctx = createContext<NotificationsApi>({ unread: 0, open: () => {} });
// Contador de no leídas y apertura del panel desde cualquier pantalla (campana de Home y de los paneles por rol).
export const useNotifications = () => useContext(Ctx);

// Avisos del usuario logueado: se piden al entrar y cada 30 s (se pausa con la pestaña oculta y se pone al día al volver).
// shortcut: L-31, polling sin push y solo las últimas 50, pasar a SSE si hace falta inmediatez
export function NotificationsProvider({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const userId = user?.id ?? user?._id;
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await getNotifications(userId);
      setItems(res.data ?? []);
      setUnread(res.unread ?? 0);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    setItems([]); setUnread(0); setError(false); setIsOpen(false); // otra sesión: nada del usuario anterior
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    void load();
    const refresh = () => { if (!document.hidden) void load(); };
    const timer = setInterval(refresh, POLL_MS);
    document.addEventListener('visibilitychange', refresh);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', refresh); };
  }, [userId, load]);

  const markRead = async (id: string) => {
    if (!userId) return;
    setItems((prev) => prev.map((n) => (n.id === id && !n.readAt ? { ...n, readAt: new Date().toISOString() } : n)));
    setUnread((n) => Math.max(0, n - 1));
    try { await markNotificationRead(id, userId); } catch { void load(); }
  };

  const markAll = async () => {
    if (!userId) return;
    setItems((prev) => prev.map((n) => (n.readAt ? n : { ...n, readAt: new Date().toISOString() })));
    setUnread(0);
    try { await markAllNotificationsRead(userId); } catch { void load(); }
  };

  const api = useMemo(() => ({ unread, open: () => setIsOpen(true) }), [unread]);

  return (
    <Ctx.Provider value={api}>
      {children}
      <NotificationsDrawer
        isOpen={isOpen && !!userId}
        onClose={() => setIsOpen(false)}
        items={items}
        unread={unread}
        loading={loading}
        error={error}
        onRetry={() => { setLoading(true); void load(); }}
        onRead={markRead}
        onReadAll={markAll}
      />
    </Ctx.Provider>
  );
}
