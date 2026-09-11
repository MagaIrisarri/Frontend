import React from 'react';
import { Link } from 'react-router-dom';
import {
  X,
  Building2,
  ChevronRight,
  Home as HomeIcon,
  Calendar,
  Car,
  Layers,
  History,
  Star,
  Shield,
  Store,
  HelpCircle,
  LogOut,
} from 'lucide-react';

export const Sidebar: React.FC<any> = (props: any) => {
  const {
    user,
    isOwner,
    isAdmin,
    isSidebarOpen,
    setIsSidebarOpen,
    setIsListDrawerOpen,
    filteredParkings = [],
    favoriteParkings = [],
    handleOpenReservations,
    handleOpenVehiclesList,
    handleOpenFavorites,
    handleLogout,
    handleOpenSupport,
  } = props;

  if (!isSidebarOpen) return null;

  return (
    <>
      {/* Backdrop oscuro */}
      <div
        className="fixed inset-0 z-40 bg-black/50 transition-opacity duration-200 animate-in fade-in"
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* Drawer lateral */}
      <aside className="fixed top-0 bottom-0 left-0 z-50 w-80 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col will-change-transform transform-gpu animate-in slide-in-from-left duration-200 ease-out">
        {/* Cabecera del Sidebar */}
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/30">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <span className="text-base font-black tracking-tight text-zinc-900 dark:text-white block">
                Servicio<span className="text-blue-500">Cocheras</span>
              </span>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">Navegación Principal</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Lista de Navegación */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:text-blue-600 dark:hover:text-white transition-colors group text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 group-hover:bg-blue-600/20 text-zinc-500 dark:text-zinc-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
                <HomeIcon className="h-4 w-4" />
              </div>
              <span className="text-xs font-semibold">Inicio (Mapa)</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleOpenReservations('active')}
            className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:text-blue-600 dark:hover:text-white transition-colors group text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 group-hover:bg-blue-600/20 text-zinc-500 dark:text-zinc-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
                <Calendar className="h-4 w-4" />
              </div>
              <span className="text-xs font-semibold">Mis reservas</span>
            </div>
            <ChevronRight className="h-4 w-4 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <button
            type="button"
            onClick={handleOpenVehiclesList}
            className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:text-blue-600 dark:hover:text-white transition-colors group text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 group-hover:bg-blue-600/20 text-zinc-500 dark:text-zinc-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
                <Car className="h-4 w-4" />
              </div>
              <span className="text-xs font-semibold">Mis vehículos</span>
            </div>
            <ChevronRight className="h-4 w-4 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <button
            type="button"
            onClick={() => {
              setIsSidebarOpen(false);
              setIsListDrawerOpen(true);
            }}
            className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:text-blue-600 dark:hover:text-white transition-colors group text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 group-hover:bg-blue-600/20 text-zinc-500 dark:text-zinc-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
                <Layers className="h-4 w-4" />
              </div>
              <span className="text-xs font-semibold">Estacionamientos</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-bold">
              {filteredParkings.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenReservations('history')}
            className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:text-blue-600 dark:hover:text-white transition-colors group text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 group-hover:bg-blue-600/20 text-zinc-500 dark:text-zinc-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
                <History className="h-4 w-4" />
              </div>
              <span className="text-xs font-semibold">Historial</span>
            </div>
            <ChevronRight className="h-4 w-4 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <button
            type="button"
            onClick={handleOpenFavorites}
            className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:text-blue-600 dark:hover:text-white transition-colors group text-left cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 group-hover:bg-amber-500/15 text-zinc-500 dark:text-zinc-400 group-hover:text-amber-500 transition-colors">
                <Star className="h-4 w-4" />
              </div>
              <span className="text-xs font-semibold">Favoritos</span>
            </div>
            {favoriteParkings.length > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold">
                {favoriteParkings.length}
              </span>
            )}
          </button>

          {isAdmin && (
            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                Rol Administrador
              </div>
              <Link
                to="/admin"
                onClick={() => setIsSidebarOpen(false)}
                className="flex items-center justify-between p-2.5 rounded-xl bg-purple-500/5 hover:bg-purple-500/10 border border-purple-500/25 text-zinc-900 dark:text-white transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/15 text-purple-600 dark:text-purple-400">
                    <Shield className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block">Administración</span>
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400">Panel global y catálogos</span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-purple-500 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          )}

          {isOwner && (
            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Rol Propietario
              </div>
              <Link
                to="/owner"
                onClick={() => setIsSidebarOpen(false)}
                className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/25 text-zinc-900 dark:text-white transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
                    <Store className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block">Panel de Dueño</span>
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400">Sucursales y reservas</span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-amber-500 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          )}
        </nav>

        {/* Footer del Sidebar */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40">
          {user ? (
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>Cerrar Sesión</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleOpenSupport}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              <HelpCircle className="h-4 w-4" />
              <span>Centro de Ayuda y Soporte</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
