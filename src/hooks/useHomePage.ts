import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getParking, getOneParking } from '../services/parking.service';
import { getReservationsByClient, cancelReservation } from '../services/reservation.service';
import type { Parking } from '../types/parking.types';
import type { MapFilters, VehicleFilterType } from '../types/mapFilters.types';
import { DEFAULT_MAP_FILTERS } from '../types/mapFilters.types';
import { useAuthStore } from '../stores/authStore';
import { useTheme } from '../context/ThemeContext';

export interface UserNotification {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: 'reservation' | 'system' | 'promo';
}

export function useHomePage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isOwner = useAuthStore((state) => state.isOwner);
  const isAdmin = useAuthStore((state) => state.isAdmin);
  const isEmployee = useAuthStore((state) => state.isEmployee);
  const logout = useAuthStore((state) => state.logout);
  const { theme } = useTheme();

  const [parkings, setParkings] = useState<Parking[]>([]);
  const [selectedParkingId, setSelectedParkingId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isListDrawerOpen, setIsListDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Filtros del mapa
  const [filters, setFilters] = useState<MapFilters>(DEFAULT_MAP_FILTERS);

  const setVehicleFilter = useCallback((type: VehicleFilterType | null) => {
    setFilters((prev) => ({ ...prev, vehicleType: type }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_MAP_FILTERS);
  }, []);

  // Estados para Popup de Vehículos
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [vehicleModalTab, setVehicleModalTab] = useState<'list' | 'create'>('list');

  // Estado para menú de usuario dropdown 
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Estado para modal de Ayuda & Soporte
  const [isSupportOpen, setIsSupportOpen] = useState(false);

  // Estado para modal de Notificaciones
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<UserNotification[]>([
    {
      id: '1',
      title: '¡Bienvenido!',
      message: 'Explorá estacionamientos cercanos y reservá tu lugar al instante.',
      date: 'Hoy',
      read: false,
      type: 'system',
    },
  ]);

  // Estado para modal de Reservas e Historial
  const [isReservationsModalOpen, setIsReservationsModalOpen] = useState(false);
  const [reservationsModalTab, setReservationsModalTab] = useState<'active' | 'history'>('active');
  const [clientReservations, setClientReservations] = useState<any[]>([]);
  const [loadingReservations, setLoadingReservations] = useState(false);

  // Estado para modal de Favoritos
  const [isFavoritesModalOpen, setIsFavoritesModalOpen] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('favorite_parkings');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Estado para modal de Autenticación sobre la página principal (Login / Register)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');

  // Cargar cocheras sin auto-seleccionar ninguna al inicio
  const fetchParkings = useCallback(() => {
    setLoading(true);
    getParking()
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.data || [];
        setParkings(list);
      })
      .catch((err) => console.error('Error al cargar estacionamientos:', err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchParkings();
  }, [fetchParkings]);

  // Cargar reservas del cliente cuando abre el modal
  const fetchClientReservations = useCallback(() => {
    if (!user?.id) return;
    setLoadingReservations(true);
    getReservationsByClient(user.id)
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.data || [];
        setClientReservations(list);
      })
      .catch((err) => {
        console.error('Error al cargar reservas del cliente:', err);
        setClientReservations([]);
      })
      .finally(() => setLoadingReservations(false));
  }, [user?.id]);

  // Dar de baja / cancelar reserva
  const handleCancelReservation = async (reservationId: string) => {
    if (!user?.id) throw new Error('Usuario no identificado');
    await cancelReservation(reservationId, user.id);
    fetchClientReservations();
  };

  // Cocheras filtradas por buscador
  const filteredParkings = useMemo(() => {
    if (!searchQuery.trim()) return parkings;
    const q = searchQuery.toLowerCase();
    return parkings.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.address?.toLowerCase().includes(q) ||
        p.locality?.toLowerCase().includes(q)
    );
  }, [parkings, searchQuery]);

  // Cocheras favoritas
  const favoriteParkings = useMemo(() => {
    return parkings.filter((p) => favoriteIds.includes(p.id));
  }, [parkings, favoriteIds]);

  // Cochera activa seleccionada
  const selectedParking = useMemo(() => {
    return parkings.find((p) => p.id === selectedParkingId) || null;
  }, [parkings, selectedParkingId]);

  const toggleFavorite = useCallback((id: string) => {
    setFavoriteIds((prev) => {
      const exists = prev.includes(id);
      const next = exists ? prev.filter((item) => item !== id) : [...prev, id];
      try {
        localStorage.setItem('favorite_parkings', JSON.stringify(next));
      } catch (e) {
        console.error('Error saving favorites', e);
      }
      return next;
    });
  }, []);

  const handleSelectSpot = useCallback((id: string) => {
    setSelectedParkingId(id);
    setIsListDrawerOpen(true);
  }, []);

  // Refrescar en tiempo real los lugares disponibles de la cochera seleccionada
  const refreshSelectedParking = useCallback(() => {
    if (!selectedParkingId) return;
    getOneParking(selectedParkingId)
      .then((res) => {
        const fresh = res?.data || res;
        if (fresh && fresh.id) {
          setParkings((prev) =>
            prev.map((p) => (p.id === fresh.id ? { ...p, ...fresh } : p))
          );
        }
      })
      .catch((err) => console.error('Error refrescando cochera seleccionada:', err));
  }, [selectedParkingId]);

  useEffect(() => {
    refreshSelectedParking();
  }, [refreshSelectedParking]);

  const handleOpenLogin = useCallback(() => {
    setAuthModalTab('login');
    setIsAuthModalOpen(true);
    setIsUserMenuOpen(false);
    setIsSidebarOpen(false);
  }, []);

  const handleOpenRegister = useCallback(() => {
    setAuthModalTab('register');
    setIsAuthModalOpen(true);
    setIsUserMenuOpen(false);
    setIsSidebarOpen(false);
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    setIsUserMenuOpen(false);
    setIsSidebarOpen(false);
  }, [logout]);


  const handleOpenReservation = useCallback((parking: Parking) => {
    setSelectedParkingId(parking.id);
    if (!user) {
      setAuthModalTab('login');
      setIsAuthModalOpen(true);
      return;
    }
    setIsModalOpen(true);
  }, [user]);

  const handleOpenVehiclesList = useCallback(() => {
    if (!user) {
      setAuthModalTab('login');
      setIsAuthModalOpen(true);
      return;
    }
    setIsSidebarOpen(false);
    setIsUserMenuOpen(false);
    setVehicleModalTab('list');
    setIsVehicleModalOpen(true);
  }, [user]);

  const handleOpenVehicleRegister = useCallback(() => {
    if (!user) {
      setAuthModalTab('login');
      setIsAuthModalOpen(true);
      return;
    }
    setIsSidebarOpen(false);
    setIsUserMenuOpen(false);
    setVehicleModalTab('create');
    setIsVehicleModalOpen(true);
  }, [user]);

  const handleOpenReservations = useCallback((tab: 'active' | 'history' = 'active') => {
    if (!user) {
      setAuthModalTab('login');
      setIsAuthModalOpen(true);
      return;
    }
    setIsSidebarOpen(false);
    setReservationsModalTab(tab);
    setIsReservationsModalOpen(true);
    fetchClientReservations();
  }, [user, fetchClientReservations]);

  const handleOpenFavorites = useCallback(() => {
    if (!user) {
      setAuthModalTab('login');
      setIsAuthModalOpen(true);
      return;
    }
    setIsSidebarOpen(false);
    setIsFavoritesModalOpen(true);
  }, [user]);

  const handleOpenNotifications = useCallback(() => {
    setIsUserMenuOpen(false);
    setIsNotificationsOpen(true);
  }, []);

  const handleOpenSupport = useCallback(() => {
    setIsUserMenuOpen(false);
    setIsSidebarOpen(false);
    setIsSupportOpen(true);
  }, []);

  const handleHostClick = useCallback(() => {
    setIsUserMenuOpen(false);
    setIsSidebarOpen(false);
    if (!user) {
      setAuthModalTab('register');
      setIsAuthModalOpen(true);
    } else if (isOwner) {
      navigate('/owner');
    } else {
      navigate('/my-parkings/create');
    }
  }, [user, isOwner, navigate]);

  const handleAuthSuccess = useCallback((loggedInUser: any) => {
    setIsAuthModalOpen(false);
    if (selectedParkingId && !isModalOpen) {
      setIsModalOpen(true);
    }
  }, [selectedParkingId, isModalOpen]);

  return {
    user,
    theme,
    isOwner,
    isAdmin,
    isEmployee,
    parkings,
    filteredParkings,
    favoriteParkings,
    favoriteIds,
    toggleFavorite,
    selectedParkingId,
    setSelectedParkingId,
    selectedParking,
    filters,
    setFilters,
    setVehicleFilter,
    resetFilters,
    searchQuery,
    setSearchQuery,
    isSidebarOpen,
    setIsSidebarOpen,
    isListDrawerOpen,
    setIsListDrawerOpen,
    isModalOpen,
    setIsModalOpen,
    isVehicleModalOpen,
    setIsVehicleModalOpen,
    vehicleModalTab,
    setVehicleModalTab,
    isUserMenuOpen,
    setIsUserMenuOpen,
    isSupportOpen,
    setIsSupportOpen,
    isNotificationsOpen,
    setIsNotificationsOpen,
    notifications,
    setNotifications,
    isReservationsModalOpen,
    setIsReservationsModalOpen,
    reservationsModalTab,
    setReservationsModalTab,
    clientReservations,
    loadingReservations,
    fetchClientReservations,
    handleCancelReservation,
    isFavoritesModalOpen,
    setIsFavoritesModalOpen,
    isAuthModalOpen,
    setIsAuthModalOpen,
    authModalTab,
    setAuthModalTab,
    loading,
    fetchParkings,
    refreshSelectedParking,
    handleSelectSpot,
    handleLogout,
    handleOpenReservation,
    handleOpenVehiclesList,
    handleOpenVehicleRegister,
    handleOpenReservations,
    handleOpenFavorites,
    handleOpenNotifications,
    handleOpenSupport,
    handleHostClick,
    handleOpenLogin,
    handleOpenRegister,
    handleAuthSuccess,
  };
}

