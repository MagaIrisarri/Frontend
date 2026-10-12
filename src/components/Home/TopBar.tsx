import React from 'react';
import { useOpenProfile } from '../../context/ProfileContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationsContext';
import { Menu as MenuIcon, Search, X, Layers, HelpCircle, User, Bell, LogOut, ChevronDown, Sun, Moon } from 'lucide-react';
import { Menu } from '../Owner/ui/Menu';
import { VehicleMapFilter } from '../Parking/VehicleMapFilter';

export const TopBar: React.FC<any> = (props: any) => {
  const openProfile = useOpenProfile();
  const { theme, toggleTheme } = useTheme();
  const { unread, open: openNotifications } = useNotifications();
  const {
    user,
    setIsSidebarOpen,
    searchQuery,
    setSearchQuery,
    isListDrawerOpen,
    setIsListDrawerOpen,
    openList,
    selectedParkingId,
    setSelectedParkingId,
    filters,
    setVehicleFilter,
    handleOpenLogin,
    handleOpenRegister,
    handleLogout,
    handleOpenSupport,
  } = props;

  const isPanelOpen = isListDrawerOpen || !!selectedParkingId;

  const accountItems = user
    ? [
        { label: 'Mi perfil y configuración', icon: <User className="i" />, onClick: openProfile },
        { label: 'Cerrar sesión', icon: <LogOut className="i" />, danger: true, sep: true, onClick: handleLogout },
      ]
    : [
        { label: 'Iniciar sesión', icon: <User className="i" />, onClick: handleOpenLogin },
        { label: 'Registrarse', icon: <User className="i" />, onClick: handleOpenRegister },
      ];

  return (
    <header className="htop">
      {/* Izquierda: Menú Principal */}
      <button
        type="button"
        className="icon-btn hfloat"
        onClick={() => setIsSidebarOpen(true)}
        aria-label="Abrir menú principal"
      >
        <MenuIcon className="i" />
      </button>

      {/* Centro: Buscador de Cocheras + Ver Lista + Filtro Desplegable de Vehículo */}
      <div className="hcenter">
        <div className="search">
          <Search className="i" aria-hidden="true" />
          <input
            type="search"
            className="inp hfloat"
            aria-label="Buscar cochera o zona"
            placeholder="Buscar cochera o zona…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button type="button" className="icon-btn clr" onClick={() => setSearchQuery('')} aria-label="Limpiar búsqueda">
              <X className="i sm" />
            </button>
          )}
        </div>

        <button
          type="button"
          className="btn hfloat"
          aria-pressed={isPanelOpen}
          onClick={() => {
            setSelectedParkingId?.(null);
            if (isPanelOpen) setIsListDrawerOpen(false);
            else openList();
          }}
        >
          <Layers className="i" />
          <span className="lbl-d">{isPanelOpen ? 'Ocultar listado' : 'Ver listado'}</span>
        </button>

        <VehicleMapFilter selectedVehicleType={filters?.vehicleType ?? null} onSelectVehicleType={setVehicleFilter} />
      </div>

      {/* Derecha: Ayuda + Tema + Cuenta. Los paneles por rol viven en el menú principal. */}
      <div className="hend">
        <button
          type="button"
          className="icon-btn hfloat"
          data-tip="Ayuda y soporte"
          onClick={handleOpenSupport}
          aria-label="Centro de Ayuda y Soporte"
        >
          <HelpCircle className="i" />
        </button>

        {user && (
          <button type="button" className="icon-btn hfloat has-badge" data-tip="Notificaciones" onClick={openNotifications}
            aria-label={`Notificaciones${unread > 0 ? `, ${unread} sin leer` : ''}`}>
            <Bell className="i" />{unread > 0 && <span className="nbadge" aria-hidden="true">{unread}</span>}
          </button>
        )}

        <button type="button" className="icon-btn hfloat" aria-label="Cambiar tema" onClick={toggleTheme}>
          {theme === 'dark' ? <Sun className="i" /> : <Moon className="i" />}
        </button>

        <Menu
          className="me hfloat"
          label={
            user
              ? `Cuenta de ${user.name || 'usuario'}`
              : 'Cuenta'
          }
          header={
            user ? (
              <>
                {user.name} {user.last_name || ''}
                <br />
                {user.email}
              </>
            ) : (
              'Ingresá para reservar y guardar tus cocheras.'
            )
          }
          items={accountItems}
          button={
            <>
              <span className="av">{user ? (user.name ? user.name[0].toUpperCase() : 'U') : <User className="i sm" />}</span>
              <ChevronDown className="i sm" />
            </>
          }
        />
      </div>
    </header>
  );
};
