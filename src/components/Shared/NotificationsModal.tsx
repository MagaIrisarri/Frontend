import React from 'react';
import { X, Bell, Check, Info, Calendar, Tag } from 'lucide-react';
import type { UserNotification } from '../../hooks/useHomePage';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: UserNotification[];
  onMarkAllAsRead: () => void;
}

export function NotificationsModal({
  isOpen,
  onClose,
  notifications,
  onMarkAllAsRead,
}: NotificationsModalProps) {
  if (!isOpen) return null;

  const getIcon = (type: UserNotification['type']) => {
    switch (type) {
      case 'reservation':
        return <Calendar className="h-4 w-4 text-blue-500" />;
      case 'promo':
        return <Tag className="h-4 w-4 text-amber-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60  animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-md w-full max-h-[85vh] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Cabecera */}
        <div className="p-5 sm:p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Notificaciones</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Avisos de tu cuenta y reservas</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Acciones de Cabecera */}
        {notifications.length > 0 && (
          <div className="px-5 py-2.5 bg-zinc-50 dark:bg-zinc-950/40 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <span className="text-xs text-zinc-500">Recientes</span>
            <button
              type="button"
              onClick={onMarkAllAsRead}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Marcar todas como leídas</span>
            </button>
          </div>
        )}

        {/* Lista */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {notifications.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <div className="p-4 rounded-3xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400">
                <Bell className="h-8 w-8" />
              </div>
              <h4 className="text-sm font-bold text-zinc-900 dark:text-white">No tenés notificaciones</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs">
                Te avisaremos cuando haya novedades sobre tus reservas o promociones exclusivas.
              </p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`p-3.5 rounded-2xl border transition-all flex gap-3 ${
                  n.read
                    ? 'bg-zinc-50/50 dark:bg-zinc-950/30 border-zinc-200/60 dark:border-zinc-800/60 opacity-75'
                    : 'bg-blue-50/30 dark:bg-blue-950/15 border-blue-200 dark:border-blue-900/40'
                }`}
              >
                <div className="p-2 rounded-xl bg-white dark:bg-zinc-800 shadow-sm shrink-0 h-fit border border-zinc-200/50 dark:border-zinc-700">
                  {getIcon(n.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-white truncate">{n.title}</h4>
                    <span className="text-[10px] text-zinc-400 shrink-0">{n.date}</span>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed">{n.message}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-bold transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}


