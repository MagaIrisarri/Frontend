import React, { useState } from 'react';
import { ReservationBookingDrawer } from '../../components/Reservation/ReservationBookingDrawer';
import { VehiclesDrawer } from '../../components/Vehicle/VehiclesDrawer';
import { ReservationsDrawer } from '../../components/Reservation/ReservationsDrawer';
import { FavoritesDrawer } from '../../components/Parking/FavoritesDrawer';
import { InvoicesDrawer } from '../../components/Invoice/InvoicesDrawer';
import { NotificationsDrawer } from '../../components/Shared/NotificationsDrawer';
import { SupportModal } from '../../components/Home/SupportModal';
import { AuthDrawer } from '../../components/Auth/AuthDrawer';

export const HomeModalManager: React.FC<any> = (props: any) => {
  const {
    isModalOpen,
    setIsModalOpen,
    selectedParking,
    filters,
    setIsVehicleModalOpen,
    setVehicleModalTab,
    handleOpenReservations,
    fetchParkings,
    fetchClientReservations,
    refreshSelectedParking,
    isVehicleModalOpen,
    vehicleModalTab,
    isReservationsModalOpen,
    setIsReservationsModalOpen,
    reservationsModalTab,
    setReservationsModalTab,
    clientReservations,
    loadingReservations,
    handleCancelReservation,
    handleRateReservation,
    openList,
    isFavoritesModalOpen,
    setIsFavoritesModalOpen,
    favoriteParkings,
    toggleFavorite,
    setSelectedParkingId,
    handleOpenReservation,
    isNotificationsOpen,
    setIsNotificationsOpen,
    notifications,
    setNotifications,
    isInvoicesOpen,
    closeInvoices,
    isSupportOpen,
    setIsSupportOpen,
    isAuthModalOpen,
    setIsAuthModalOpen,
    authModalTab,
    handleAuthSuccess,
  } = props;
  const [vehiclesRev, setVehiclesRev] = useState(0); // sube al cerrar Mis vehículos para que la reserva en curso recargue la lista

  return (
    <>
      {/* Panel de Reserva directa en el Home */}
      <ReservationBookingDrawer
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        parking={selectedParking}
        initialVehicleCategory={filters?.vehicleType}
        vehiclesRev={vehiclesRev}
        onOpenVehicleRegister={() => { setVehicleModalTab('create'); setIsVehicleModalOpen(true); }}
        onViewMyReservations={() => handleOpenReservations('active')}
        onReservationSuccess={() => {
          if (fetchParkings) fetchParkings();
          if (fetchClientReservations) fetchClientReservations();
          if (refreshSelectedParking) refreshSelectedParking();
        }}
      />

      {/* Panel de Mis Vehículos (lista, alta y edición) */}
      <VehiclesDrawer
        isOpen={isVehicleModalOpen}
        onClose={() => { setIsVehicleModalOpen(false); setVehiclesRev((n) => n + 1); }}
        initialTab={vehicleModalTab}
      />

      {/* Panel de Mis Reservas e Historial */}
      <ReservationsDrawer
        isOpen={isReservationsModalOpen}
        onClose={() => setIsReservationsModalOpen(false)}
        tab={reservationsModalTab}
        onTabChange={setReservationsModalTab}
        reservations={clientReservations}
        loading={loadingReservations}
        onCancelReservation={handleCancelReservation}
        onRateReservation={handleRateReservation}
        onExploreParkings={() => {
          setIsReservationsModalOpen(false);
          openList();
        }}
      />

      {/* Panel de Favoritos */}
      <FavoritesDrawer
        isOpen={isFavoritesModalOpen}
        onClose={() => setIsFavoritesModalOpen(false)}
        favoriteParkings={favoriteParkings}
        onRemoveFavorite={toggleFavorite}
        onSelectParking={(id: string) => setSelectedParkingId(id)}
        onOpenReservation={handleOpenReservation}
      />

      {/* Panel de Facturas y Pagos */}
      <InvoicesDrawer isOpen={!!isInvoicesOpen} onClose={closeInvoices} />

      {/* Panel de Notificaciones */}
      <NotificationsDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkAllAsRead={() => {
          if (setNotifications) {
            setNotifications((prev: any[]) => prev.map((n) => ({ ...n, read: true })));
          }
        }}
      />

      {/* Modal de Ayuda y Soporte */}
      <SupportModal
        isSupportOpen={isSupportOpen}
        setIsSupportOpen={setIsSupportOpen}
      />

      {/* Panel de acceso (iniciar sesión / crear cuenta) */}
      <AuthDrawer
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialTab={authModalTab}
        onSuccess={handleAuthSuccess}
      />
    </>
  );
};
