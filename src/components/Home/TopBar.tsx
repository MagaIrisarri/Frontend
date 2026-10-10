import React from 'react';
import { useOpenProfile } from '../../context/ProfileContext';
import { Menu, Search, X, Layers, HelpCircle, User, Bell, LogOut } from 'lucide-react';
import { ThemeToggle } from '../Shared/ThemeToggle';
import { VehicleMapFilter } from '../Parking/VehicleMapFilter';

export const TopBar: React.FC<any> = (props: any) => {
  const openProfile = useOpenProfile();
  const {
    user,
    setIsSidebarOpen,
    searchQuery,
    setSearchQuery,
    isListDrawerOpen,
    setIsListDrawerOpen,
    selectedParkingId,
    setSelectedParkingId,
    setIsUserMenuOpen,
    isUserMenuOpen,
    setIsNotificationsOpen,
    unreadCount = 0,
    filters,
    setVehicleFilter,
    handleOpenLogin,
    handleOpenRegister,
    handleLogout,
    handleOpenSupport,
  } = props;

  const isPanelOpen = isListDrawerOpen || !!selectedParkingId;
  const menuItem =
    'w-full flex items-center gap-2.5 px-4 min-h-11 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 font-medium transition-colors cursor-pointer text-left';

  return (
    <header className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between pointer-events-none gap-3">
      {/* Izquierda: Menú Hamburguesa Principal */}
      <div className="flex items-center gap-2 pointer-events-auto shrink-0">
        <button
          type="button"
          onClick={() => setIsSidebarOpen(true)}
          className="h-11 w-11 rounded-2xl bg-white/95 dark:bg-zinc-900/95 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-white border border-zinc-200 dark:border-zinc-800 shadow-xl transition-all active:scale-95 cursor-pointer flex items-center justify-center shrink-0"
          aria-label="Abrir menú principal"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Centro: Buscador de Cocheras + Ver Lista + Filtro Desplegable de Vehículo */}
      <div className="flex items-center gap-2 pointer-events-auto w-full max-w-2xl">
        <div className="relative flex-1 min-w-[140px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" aria-hidden="true" />
          <input
            type="search"
            aria-label="Buscar cochera o zona"
            placeholder="Buscar cochera o zona..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-11 rounded-2xl bg-white/95 dark:bg-zinc-900/95 text-sm text-zinc-900 dark:text-white placeholder-zinc-500 border border-zinc-200 dark:border-zinc-800 shadow-xl focus:outline-none focus:border-blue-500 transition-colors [&::-webkit-search-cancel-button]:appearance-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Limpiar búsqueda"
              className="absolute right-0 top-0 h-11 w-11 flex items-center justify-center text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Botón Ver Lista */}
        <button
          type="button"
          aria-pressed={isPanelOpen}
          onClick={() => {
            if (isPanelOpen) {
              setIsListDrawerOpen(false);
              if (setSelectedParkingId) setSelectedParkingId(null);
            } else {
              if (setSelectedParkingId) setSelectedParkingId(null);
              setIsListDrawerOpen(true);
            }
          }}
          className={`flex items-center justify-center gap-2 h-11 px-3.5 rounded-2xl border shadow-xl text-xs font-semibold transition-all cursor-pointer select-none active:scale-95 shrink-0 ${
            isPanelOpen
              ? 'bg-blue-600 text-white border-blue-500 shadow-blue-600/20'
              : 'bg-white/95 dark:bg-zinc-900/95 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-white border-zinc-200 dark:border-zinc-800'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span className="hidden sm:inline">{isPanelOpen ? 'Ocultar' : 'Ver Lista'}</span>
          <span className="sr-only sm:hidden">{isPanelOpen ? 'Ocultar listado' : 'Ver listado'}</span>
        </button>

        <VehicleMapFilter
          selectedVehicleType={filters?.vehicleType ?? null}
          onSelectVehicleType={setVehicleFilter}
        />
      </div>

      {/* Derecha: Ayuda + ThemeToggle + Cuenta. Los paneles por rol viven en el Sidebar. */}
      <div className="flex items-center gap-2 pointer-events-auto shrink-0">
        <button
          type="button"
          onClick={handleOpenSupport}
          className="h-11 w-11 flex items-center justify-center rounded-2xl bg-white/95 dark:bg-zinc-900/95 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 shadow-xl transition-all active:scale-95 cursor-pointer shrink-0"
          aria-label="Centro de Ayuda y Soporte"
        >
          <HelpCircle className="h-4 w-4" />
        </button>

        <div className="shrink-0 flex items-center">
          <ThemeToggle />
        </div>

        {/* Menú de cuenta */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            aria-haspopup="menu"
            aria-expanded={isUserMenuOpen}
            aria-label={
              user
                ? `Cuenta de ${user.name || 'usuario'}${unreadCount > 0 ? `, ${unreadCount} notificaciones sin leer` : ''}`
                : 'Cuenta'
            }
            className="relative h-11 flex items-center gap-2 pl-3 pr-2 rounded-full bg-white/95 dark:bg-zinc-900/95 hover:shadow-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl text-zinc-800 dark:text-white transition-all cursor-pointer"
          >
            <Menu className="h-3.5 w-3.5 text-zinc-500" aria-hidden="true" />
            {user ? (
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                {user.name ? user.name[0].toUpperCase() : 'U'}
              </div>
            ) : (
              <div className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center">
                <User className="h-4 w-4" />
              </div>
            )}
            {user && unreadCount > 0 && (
              <span
                aria-hidden="true"
                className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-600 text-white border-2 border-white dark:border-zinc-900 text-[11px] font-bold leading-4 text-center"
              >
                {unreadCount}
              </span>
            )}
          </button>

          {isUserMenuOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setIsUserMenuOpen(false)} />
              <div
                role="menu"
                aria-label="Cuenta"
                className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl z-40 py-2 text-xs animate-in fade-in zoom-in-95 duration-150"
              >
                {user ? (
                  <>
                    <div className="px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800">
                      <p className="font-bold text-zinc-900 dark:text-white truncate">
                        {user.name} {user.last_name || ''}
                      </p>
                      <p className="text-[11px] text-zinc-600 dark:text-zinc-400 truncate">{user.email}</p>
                    </div>

                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        openProfile();
                      }}
                      className={menuItem}
                    >
                      <User className="h-4 w-4 text-zinc-500" />
                      <span>Mi perfil y configuración</span>
                    </button>

                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        if (setIsNotificationsOpen) setIsNotificationsOpen(true);
                      }}
                      className={`${menuItem} justify-between`}
                    >
                      <span className="flex items-center gap-2.5">
                        <Bell className="h-4 w-4 text-zinc-500" />
                        <span>Notificaciones</span>
                      </span>
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 text-[11px] font-bold">
                          {unreadCount} {unreadCount === 1 ? 'nueva' : 'nuevas'}
                        </span>
                      )}
                    </button>

                    <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-1" />

                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 min-h-11 hover:bg-red-500/10 text-red-700 dark:text-red-400 font-semibold transition-colors cursor-pointer text-left"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Cerrar sesión</span>
                    </button>
                  </>
                ) : (
                  <div className="px-3 pb-1 space-y-2">
                    <p className="px-1 pt-1 text-[13px] text-zinc-600 dark:text-zinc-400">
                      Ingresá para reservar y guardar tus cocheras.
                    </p>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleOpenLogin}
                      className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-colors cursor-pointer"
                    >
                      Iniciar sesión
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleOpenRegister}
                      className="w-full h-11 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white text-sm font-bold transition-colors cursor-pointer"
                    >
                      Registrarse
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
