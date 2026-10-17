import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { NotificationsDrawer } from '../components/Shared/NotificationsDrawer';
import { useAuthStore } from '../stores/authStore';
import {
  getNotifications, markAllNotificationsRead, markNotificationRead, notificationTarget, type AppNotification,
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
// L-31: los últimos 30 días de a páginas ("Ver más"), con filtro de no leídas; tocar uno lo marca y abre lo que avisa.
// shortcut: L-45, polling sin push, pasar a SSE si hace falta inmediatez
export function NotificationsProvider({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const userId = user?.id ?? user?._id;
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [next, setNext] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const pages = useRef(1); // con más de una página cargada, el polling solo actualiza el contador (no recorta la lista)
  const navigate = useNavigate();

  const load = useCallback(async (reset = false) => {
    if (!userId) return;
    try {
      if (!reset && pages.current > 1) { setUnread((await getNotifications({ unread: onlyUnread })).unread ?? 0); setError(false); return; }
      const res = await getNotifications({ unread: onlyUnread });
      pages.current = 1;
      setItems(res.data ?? []);
      setUnread(res.unread ?? 0);
      setNext(res.next ?? null);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [userId, onlyUnread]);

  const loadMore = async () => {
    if (!next || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await getNotifications({ unread: onlyUnread, cursor: next });
      pages.current += 1;
      setItems((prev) => [...prev, ...(res.data ?? []).filter((n) => !prev.some((p) => p.id === n.id))]);
      setUnread(res.unread ?? 0);
      setNext(res.next ?? null);
    } catch {
      setError(true);
    } finally {
      setLoadingMore(false);
    }
  };

  // Otra sesión: nada del usuario anterior (solo con el usuario; cambiar el filtro no cierra el panel).
  useEffect(() => {
    setItems([]); setUnread(0); setError(false); setIsOpen(false); setNext(null); setOnlyUnread(false); pages.current = 1;
  }, [userId]);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    void load(true);
    const refresh = () => { if (!document.hidden) void load(); };
    const timer = setInterval(refresh, POLL_MS);
    document.addEventListener('visibilitychange', refresh);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', refresh); };
  }, [userId, load]);

  const markRead = async (id: string) => {
    if (!userId) return;
    setItems((prev) => prev.map((n) => (n.id === id && !n.readAt ? { ...n, readAt: new Date().toISOString() } : n)));
    setUnread((n) => Math.max(0, n - 1));
    try { await markNotificationRead(id); } catch { void load(); }
  };

  const markAll = async () => {
    if (!userId) return;
    setItems((prev) => prev.map((n) => (n.readAt ? n : { ...n, readAt: new Date().toISOString() })));
    setUnread(0);
    try { await markAllNotificationsRead(); } catch { void load(); }
  };

  // Tocar un aviso: lo marca como leído y abre la reserva o la sucursal que avisa (notificationTarget, según el rol).
  const openItem = (n: AppNotification) => {
    if (!n.readAt) void markRead(n.id);
    const to = notificationTarget(n, String(user?.type ?? user?.role ?? ''));
    if (!to) return;
    setIsOpen(false);
    navigate(to);
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
        onRetry={() => { setLoading(true); void load(true); }}
        onRead={markRead}
        onReadAll={markAll}
        onOpen={openItem}
        canOpen={(n) => !!notificationTarget(n, String(user?.type ?? user?.role ?? ''))}
        onlyUnread={onlyUnread}
        onFilter={(v) => { setOnlyUnread(v); setLoading(true); setItems([]); setNext(null); pages.current = 1; }}
        hasMore={!!next}
        loadingMore={loadingMore}
        onLoadMore={loadMore}
      />
    </Ctx.Provider>
  );
}
