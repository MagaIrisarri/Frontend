import React from 'react';
import { ReservationBookingModal } from '../../components/Reservation/ReservationBookingModal';
import { VehicleManagerModal } from '../../components/Vehicle/VehicleManagerModal';
import { ReservationsModal } from '../../components/Reservation/ReservationsModal';
import { FavoritesModal } from '../../components/Parking/FavoritesModal';
import { NotificationsModal } from '../../components/shared/NotificationsModal';
import { SupportModal } from '../../components/Home/SupportModal';
import { AuthModal } from '../../components/auth/AuthModal';

export const HomeModalManager: React.FC<any> = (props: any) => {
  const {
    isModalOpen,
    setIsModalOpen,
    selectedParking,
    filters,
    setIsVehicleModalOpen,
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
    setIsListDrawerOpen,
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
    isSupportOpen,
    setIsSupportOpen,
    isAuthModalOpen,
    setIsAuthModalOpen,
    authModalTab,
    handleAuthSuccess,
  } = props;

  return (
    <>
      {/* Modal de Reserva Directa en el Home */}
      <ReservationBookingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        parking={selectedParking}
        initialVehicleCategory={filters?.vehicleType}
        onOpenVehicleRegister={() => setIsVehicleModalOpen(true)}
        onViewMyReservations={() => handleOpenReservations('active')}
        onReservationSuccess={() => {
          if (fetchParkings) fetchParkings();
          if (fetchClientReservations) fetchClientReservations();
          if (refreshSelectedParking) refreshSelectedParking();
        }}
      />

      {/* Modal de Gestión y Registro de Vehículos */}
      <VehicleManagerModal
        isOpen={isVehicleModalOpen}
        onClose={() => setIsVehicleModalOpen(false)}
        initialTab={vehicleModalTab}
      />

      {/* Modal de Mis Reservas e Historial */}
      <ReservationsModal
        isOpen={isReservationsModalOpen}
        onClose={() => setIsReservationsModalOpen(false)}
        tab={reservationsModalTab}
        onTabChange={setReservationsModalTab}
        reservations={clientReservations}
        loading={loadingReservations}
        onCancelReservation={handleCancelReservation}
        onExploreParkings={() => {
          setIsReservationsModalOpen(false);
          setIsListDrawerOpen(true);
        }}
      />

      {/* Modal de Favoritos */}
      <FavoritesModal
        isOpen={isFavoritesModalOpen}
        onClose={() => setIsFavoritesModalOpen(false)}
        favoriteParkings={favoriteParkings}
        onRemoveFavorite={toggleFavorite}
        onSelectParking={(id: string) => setSelectedParkingId(id)}
        onOpenReservation={handleOpenReservation}
      />

      {/* Modal de Notificaciones */}
      <NotificationsModal
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

      {/* Modal de Autenticación Directa */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialTab={authModalTab}
        onSuccess={handleAuthSuccess}
      />
    </>
  );
};
