import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Building2,
  ChevronRight,
  Calendar,
  Car,
  Layers,
  Star,
  Store,
  FileText,
  HelpCircle,
  LogOut,
} from 'lucide-react';

const GROUP_TITLE = 'px-3 mb-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400';
const ITEM =
  'w-full flex items-center gap-3 px-3 min-h-12 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-sm font-semibold transition-colors text-left cursor-pointer';
const ICON = 'h-4 w-4 text-zinc-500 dark:text-zinc-400 shrink-0';
const BADGE = 'text-[11px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold';

export const Sidebar: React.FC<any> = (props: any) => {
  const {
    user,
    isOwner,
    isSidebarOpen,
    setIsSidebarOpen,
    setIsListDrawerOpen,
    filteredParkings = [],
    favoriteParkings = [],
    activeReservationsCount = 0,
    handleOpenReservations,
    handleOpenVehiclesList,
    handleOpenFavorites,
    handleOpenLogin,
    handleHostClick,
    handleLogout,
    handleOpenSupport,
  } = props;
  const navigate = useNavigate();

  if (!isSidebarOpen) return null;

  // Un solo acceso por rol: el que corresponde al usuario actual.
  const panel = isOwner
    ? { to: '/owner', title: 'Panel de Dueño', sub: 'Sucursales, personal y reservas', Icon: Store }
    : null;

  const openInvoices = () => {
    if (!user) return handleOpenLogin();
    setIsSidebarOpen(false);
    navigate('/invoices');
  };

  const panelCard =
    'w-full flex items-center gap-3 px-3 min-h-14 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-left transition-colors cursor-pointer';
  const panelBody = (title: string, sub: string, Icon: React.ComponentType<{ className?: string }>) => (
    <>
      <span aria-hidden="true" className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4" />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-bold text-zinc-900 dark:text-white">{title}</span>
        <span className="block text-xs text-zinc-600 dark:text-zinc-400">{sub}</span>
      </span>
      <ChevronRight className="h-4 w-4 text-zinc-500 shrink-0" aria-hidden="true" />
    </>
  );

  return (
    <>
      {/* Backdrop oscuro */}
      <div
        className="fixed inset-0 z-40 bg-black/50 transition-opacity duration-200 animate-in fade-in"
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* Drawer lateral */}
      <aside
        aria-label="Menú principal"
        className="fixed top-0 bottom-0 left-0 z-50 w-80 max-w-[calc(100vw-3rem)] bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col will-change-transform transform-gpu animate-in slide-in-from-left duration-200 ease-out"
      >
        <div className="px-5 h-19 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/30">
              <Building2 className="h-5 w-5" />
            </div>
            <span className="text-base font-black tracking-tight text-zinc-900 dark:text-white">
              Servicio<span className="text-blue-600 dark:text-blue-400">Cocheras</span>
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Cerrar menú"
            className="h-11 w-11 flex items-center justify-center rounded-xl text-zinc-600 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-5">
          <section aria-labelledby="sb-explorar">
            <h2 id="sb-explorar" className={GROUP_TITLE}>Explorar</h2>
            <button
              type="button"
              aria-current="page"
              onClick={() => {
                setIsSidebarOpen(false);
                setIsListDrawerOpen(true);
              }}
              className={`${ITEM} bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300`}
            >
              <Layers className="h-4 w-4 shrink-0" />
              <span className="flex-1">Estacionamientos</span>
              <span className={BADGE}>{filteredParkings.length}</span>
            </button>
            <button type="button" onClick={handleOpenFavorites} className={ITEM}>
              <Star className={ICON} />
              <span className="flex-1">Favoritos</span>
              {favoriteParkings.length > 0 && <span className={BADGE}>{favoriteParkings.length}</span>}
            </button>
          </section>

          <section aria-labelledby="sb-cosas">
            <h2 id="sb-cosas" className={GROUP_TITLE}>Mis cosas</h2>
            <button type="button" onClick={() => handleOpenReservations('active')} className={ITEM}>
              <Calendar className={ICON} />
              <span className="flex-1">
                Reservas
                <span className="block text-xs font-normal text-zinc-600 dark:text-zinc-400">Activas e historial</span>
              </span>
              {activeReservationsCount > 0 && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 font-bold">
                  {activeReservationsCount} {activeReservationsCount === 1 ? 'activa' : 'activas'}
                </span>
              )}
            </button>
            <button type="button" onClick={handleOpenVehiclesList} className={ITEM}>
              <Car className={ICON} />
              <span className="flex-1">Vehículos</span>
              <ChevronRight className="h-4 w-4 text-zinc-500" aria-hidden="true" />
            </button>
            <button type="button" onClick={openInvoices} className={ITEM}>
              <FileText className={ICON} />
              <span className="flex-1">Facturación y pagos</span>
              <ChevronRight className="h-4 w-4 text-zinc-500" aria-hidden="true" />
            </button>
          </section>

          <section aria-labelledby="sb-paneles" className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <h2 id="sb-paneles" className={GROUP_TITLE}>Paneles</h2>
            {panel ? (
              <button
                type="button"
                onClick={() => {
                  setIsSidebarOpen(false);
                  navigate(panel.to);
                }}
                className={panelCard}
              >
                {panelBody(panel.title, panel.sub, panel.Icon)}
              </button>
            ) : (
              <button type="button" onClick={handleHostClick} className={panelCard}>
                {panelBody(
                  'Ofrecé tu estacionamiento',
                  user ? 'Publicá tu cochera' : 'Creá tu cuenta y publicá tu cochera',
                  Building2
                )}
              </button>
            )}
          </section>
        </nav>

        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 shrink-0">
          {user ? (
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 h-11 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-700 dark:text-red-400 text-sm font-semibold transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>Cerrar sesión</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleOpenSupport}
              className="w-full flex items-center justify-center gap-2 h-11 px-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm font-semibold transition-colors cursor-pointer"
            >
              <HelpCircle className="h-4 w-4" />
              <span>Centro de ayuda y soporte</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
