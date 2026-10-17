import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  ChevronRight,
  Calendar,
  Layers,
  Star,
  Store,
  FileText,
  HelpCircle,
  LogOut,
} from 'lucide-react';
import { Drawer } from '../Owner/ui/Layer';
import { VICON } from '../Owner/ui/vehicles';
import { Presence } from '../Owner/ui/Presence';
import { useToast } from '../Owner/ui/Toasts';

export const Sidebar: React.FC<any> = (props: any) => {
  const {
    user,
    isOwner,
    isSidebarOpen,
    setIsSidebarOpen,
    openList,
    filteredParkings = [],
    favoriteParkings = [],
    activeReservationsCount = 0,
    handleOpenReservations,
    handleOpenVehiclesList,
    handleOpenFavorites,
    handleOpenInvoices,
    handleOpenLogin,
    handleHostClick,
    handleLogout,
    handleOpenSupport,
  } = props;
  const navigate = useNavigate();
  const toast = useToast();

  // Un solo acceso por rol: el que corresponde al usuario actual.
  const panel = isOwner
    ? { to: '/owner', title: 'Panel de Dueño', sub: 'Sucursales, personal y reservas', Icon: Store }
    : null;

  const panelBody = (title: string, sub: string, Icon: React.ComponentType<{ className?: string }>) => (
    <>
      <span aria-hidden="true" className="ib">
        <Icon className="i" />
      </span>
      <span className="grow">
        {title}
        <small>{sub}</small>
      </span>
      <ChevronRight className="i" aria-hidden="true" />
    </>
  );

  return (
    <Presence open={!!isSidebarOpen}>
    <Drawer
      left
      title={
        <span className="brand">
          <span className="logo">SC</span>
          <span>ServicioCocheras</span>
        </span>
      }
      onClose={() => setIsSidebarOpen(false)}
      footer={
        <div className="dfoot">
          {user ? (
            <button type="button" className="btn" onClick={handleLogout}>
              <LogOut className="i" />
              Cerrar sesión
            </button>
          ) : (
            <button type="button" className="btn" onClick={handleOpenSupport}>
              <HelpCircle className="i" />
              Centro de ayuda y soporte
            </button>
          )}
        </div>
      }
    >
      <nav className="dbody snav" aria-label="Menú principal">
        <section className="sgrp" aria-labelledby="sb-explorar">
          <h3 id="sb-explorar" className="eyebrow">Explorar</h3>
          <button
            type="button"
            aria-current="page"
            className="btn ghost sitem"
            onClick={() => {
              setIsSidebarOpen(false);
              openList();
            }}
          >
            <Layers className="i" />
            <span className="grow">Estacionamientos</span>
            <span className="tag">{filteredParkings.length}</span>
          </button>
          <button type="button" className="btn ghost sitem" onClick={handleOpenFavorites}>
            <Star className="i" />
            <span className="grow">Favoritos</span>
            {favoriteParkings.length > 0 && <span className="tag">{favoriteParkings.length}</span>}
          </button>
        </section>

        <section className="sgrp" aria-labelledby="sb-cosas">
          <h3 id="sb-cosas" className="eyebrow">Mis cosas</h3>
          <button type="button" className="btn ghost sitem" onClick={() => handleOpenReservations('active')}>
            <Calendar className="i" />
            <span className="grow">
              Reservas
              <small>Activas e historial</small>
            </span>
            {activeReservationsCount > 0 && (
              <span className="tag">
                {activeReservationsCount} {activeReservationsCount === 1 ? 'activa' : 'activas'}
              </span>
            )}
          </button>
          <button type="button" className="btn ghost sitem" onClick={handleOpenVehiclesList}>
            <VICON.AUTO className="i" />
            <span className="grow">Vehículos</span>
            <ChevronRight className="i" aria-hidden="true" />
          </button>
          <button type="button" className="btn ghost sitem" onClick={handleOpenInvoices}>
            <FileText className="i" />
            <span className="grow">Facturación y pagos</span>
            <ChevronRight className="i" aria-hidden="true" />
          </button>
        </section>

        <section className="sgrp" aria-labelledby="sb-paneles">
          <h3 id="sb-paneles" className="eyebrow">Paneles</h3>
          {panel ? (
            <button
              type="button"
              className="pcta"
              onClick={() => {
                setIsSidebarOpen(false);
                navigate(panel.to);
              }}
            >
              {panelBody(panel.title, panel.sub, panel.Icon)}
            </button>
          ) : (
            <button type="button" className="pcta" onClick={() => handleHostClick(toast)}>
              {panelBody(
                'Ofrecé tu estacionamiento',
                user ? 'Publicá tu cochera' : 'Creá tu cuenta y publicá tu cochera',
                Building2
              )}
            </button>
          )}
        </section>
      </nav>
    </Drawer>
    </Presence>
  );
};
