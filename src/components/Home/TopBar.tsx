import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, Search, X, Layers, Building2, HelpCircle, User, Settings, Bell, LogOut } from 'lucide-react';
import { ThemeToggle } from '../Shared/ThemeToggle';
import { VehicleMapFilter } from '../Parking/VehicleMapFilter';

export const TopBar: React.FC<any> = (props: any) => {
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
    filters,
    setVehicleFilter,
    handleOpenLogin,
    handleOpenRegister,
    handleLogout,
    handleHostClick,
    handleOpenSupport,
  } = props;

  const isPanelOpen = isListDrawerOpen || !!selectedParkingId;

  return (
    <header className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between pointer-events-none gap-3">
      {/* Izquierda: Menú Hamburguesa Principal */}
      <div className="flex items-center gap-2 pointer-events-auto shrink-0">
        <button
          type="button"
          onClick={() => setIsSidebarOpen(true)}
          className="p-3 rounded-2xl bg-white/95 dark:bg-zinc-900/95 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-white border border-zinc-200 dark:border-zinc-800 shadow-xl transition-all active:scale-95 cursor-pointer flex items-center justify-center shrink-0"
          title="Abrir menú principal"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Centro: Buscador de Cocheras + Ver Lista + Filtro Desplegable de Vehículo */}
      <div className="flex items-center gap-2 pointer-events-auto w-full max-w-2xl">
        <div className="relative flex-1 min-w-[140px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Buscar cochera o zona..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white/95 dark:bg-zinc-900/95 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 border border-zinc-200 dark:border-zinc-800 shadow-xl focus:outline-none focus:border-blue-500 transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Botón Ver Lista */}
        <button
          type="button"
          onClick={() => {
            if (isPanelOpen) {
              setIsListDrawerOpen(false);
              if (setSelectedParkingId) setSelectedParkingId(null);
            } else {
              if (setSelectedParkingId) setSelectedParkingId(null);
              setIsListDrawerOpen(true);
            }
          }}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl border shadow-xl text-xs font-semibold transition-all cursor-pointer select-none active:scale-95 shrink-0 ${
            isPanelOpen
              ? 'bg-blue-600 text-white border-blue-500 shadow-blue-600/20'
              : 'bg-white/95 dark:bg-zinc-900/95 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-white border-zinc-200 dark:border-zinc-800'
          }`}
          title="Ver listado de cocheras"
        >
          <Layers className="h-4 w-4" />
          <span className="hidden sm:inline">
            {isPanelOpen ? 'Ocultar' : 'Ver Lista'}
          </span>
        </button>

        {/* Filtro desplegable de vehículo a la derecha de Ver Lista */}
        <VehicleMapFilter
          selectedVehicleType={filters?.vehicleType ?? null}
          onSelectVehicleType={setVehicleFilter}
        />
      </div>

      {/* Derecha: Ofrecé tu estacionamiento / Panel Dueño + Ayuda + ThemeToggle + Píldora de Usuario */}
      <div className="flex items-center gap-2 pointer-events-auto shrink-0">
        {props.isOwner || (user?.type && (user.type.toUpperCase().includes('DUE') || user.type.toUpperCase().includes('OWNER'))) ? (
          <Link
            to="/owner"
            className="hidden lg:flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 shadow-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shrink-0"
            title="Ir al Panel de Dueño"
          >
            <span>Panel de Dueño ↗</span>
          </Link>
        ) : (
          <button
            type="button"
            onClick={handleHostClick}
            className="hidden lg:flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-white/95 dark:bg-zinc-900/95 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-white border border-zinc-200 dark:border-zinc-800 shadow-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shrink-0"
          >
            <Building2 className="h-4 w-4 text-blue-500" />
            <span>Ofrecé tu estacionamiento</span>
          </button>
        )}

        <button
          type="button"
          onClick={handleOpenSupport}
          className="p-2.5 rounded-2xl bg-white/95 dark:bg-zinc-900/95 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 shadow-xl transition-all active:scale-95 cursor-pointer shrink-0"
          title="Centro de Ayuda y Soporte"
        >
          <HelpCircle className="h-4 w-4" />
        </button>

        <div className="shrink-0 flex items-center">
          <ThemeToggle />
        </div>

        {/* Menú flotante arriba a la derecha -> Cuenta y Acciones Personales */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-full bg-white/95 dark:bg-zinc-900/95 hover:shadow-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl text-zinc-800 dark:text-white transition-all cursor-pointer"
            title="Menú de usuario"
          >
            <Menu className="h-3.5 w-3.5 text-zinc-500" />
            {user ? (
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                {user.name ? user.name[0].toUpperCase() : 'U'}
              </div>
            ) : (
              <div className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center">
                <User className="h-4 w-4" />
              </div>
            )}
          </button>

          {/* Dropdown flotante arriba a la derecha */}
          {isUserMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setIsUserMenuOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl z-40 py-2 text-xs animate-in fade-in zoom-in-95 duration-150">
                {user ? (
                  <>
                    <div className="px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800">
                      <p className="font-bold text-zinc-900 dark:text-white truncate">
                        {user.name} {user.last_name || ''}
                      </p>
                      <p className="text-[11px] text-zinc-500 truncate">{user.email}</p>
                    </div>

                    {/* Mi perfil */}
                    <Link
                      to="/profile"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 font-medium transition-colors"
                    >
                      <User className="h-4 w-4 text-zinc-400" />
                      <span>Mi perfil</span>
                    </Link>

                    {/* Configuración */}
                    <Link
                      to="/profile"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 font-medium transition-colors"
                    >
                      <Settings className="h-4 w-4 text-zinc-400" />
                      <span>Configuración</span>
                    </Link>

                    {/* Notificaciones */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        if (setIsNotificationsOpen) setIsNotificationsOpen(true);
                      }}
                      className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 font-medium transition-colors cursor-pointer text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <Bell className="h-4 w-4 text-zinc-400" />
                        <span>Notificaciones</span>
                      </div>
                    </button>

                    {/* Ayuda */}
                    <button
                      type="button"
                      onClick={handleOpenSupport}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 font-medium transition-colors cursor-pointer text-left"
                    >
                      <HelpCircle className="h-4 w-4 text-zinc-400" />
                      <span>Ayuda</span>
                    </button>

                    <div className="h-[1px] bg-zinc-100 dark:border-zinc-800 my-1" />

                    {/* Cerrar sesión */}
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-red-500/10 text-red-600 dark:text-red-400 font-semibold transition-colors cursor-pointer text-left"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Cerrar sesión</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={handleOpenLogin}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white font-bold transition-colors cursor-pointer text-left"
                    >
                      <User className="h-4 w-4 text-blue-500" />
                      <span>Iniciar sesión</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleOpenRegister}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 font-medium transition-colors cursor-pointer text-left"
                    >
                      <User className="h-4 w-4 text-zinc-400" />
                      <span>Registrarse</span>
                    </button>

                    <div className="h-[1px] bg-zinc-100 dark:bg-zinc-800 my-1" />

                    <button
                      type="button"
                      onClick={handleHostClick}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 font-medium transition-colors cursor-pointer text-left"
                    >
                      <Building2 className="h-4 w-4 text-blue-500" />
                      <span>Ofrecé tu estacionamiento</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleOpenSupport}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 font-medium transition-colors cursor-pointer text-left"
                    >
                      <HelpCircle className="h-4 w-4 text-zinc-400" />
                      <span>Centro de Ayuda</span>
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
