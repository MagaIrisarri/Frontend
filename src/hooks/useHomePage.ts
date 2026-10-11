import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getParking, getOneParking } from '../services/parking.service';
import { getReservationsByClient, cancelReservation, rateReservation } from '../services/reservation.service';
import type { Parking } from '../types/parking.types';
import type { MapFilters, VehicleFilterType } from '../types/mapFilters.types';
import { DEFAULT_MAP_FILTERS } from '../types/mapFilters.types';
import { useAuthStore } from '../stores/authStore';
import { getParkingMinPrice, getParkingPriceForCategory } from '../utils/parkingPriceUtils';
import { localityKey, matchesQuery } from '../utils/search';
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
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const isOwner = useAuthStore((state) => state.isOwner);
  const logout = useAuthStore((state) => state.logout);
  const { theme } = useTheme();

  const [parkings, setParkings] = useState<Parking[]>([]);
  const [selectedParkingId, setSelectedParkingId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isListDrawerOpen, setIsListDrawerOpen] = useState(false);
  const [searchQuery, setTextQuery] = useState('');
  // Zona elegida con "Buscar en esta zona" [oeste, sur, este, norte]. Escribir en el buscador la descarta: el texto manda y mueve el mapa.
  const [mapArea, setMapArea] = useState<[number, number, number, number] | null>(null);
  const setSearchQuery = useCallback((q: string) => {
    setTextQuery(q);
    setMapArea(null);
  }, []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  // Filtros del mapa
  const [filters, setFilters] = useState<MapFilters>(DEFAULT_MAP_FILTERS);

  const setVehicleFilter = useCallback((type: VehicleFilterType | null) => {
    setFilters((prev) => ({ ...prev, vehicleType: type }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_MAP_FILTERS);
    setMapArea(null);
  }, []);

  // Estados para Popup de Vehículos
  // Las rutas /vehicles, /reservations e /invoices abren Home con su panel (no hay páginas aparte).
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(location.pathname.startsWith('/vehicles'));
  const [vehicleModalTab, setVehicleModalTab] = useState<'list' | 'create'>(location.pathname === '/vehicles/new' ? 'create' : 'list');

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
  const [isReservationsModalOpen, setIsReservationsModalOpen] = useState(location.pathname === '/reservations');
  const [reservationsModalTab, setReservationsModalTab] = useState<'active' | 'history'>('active');
  const [clientReservations, setClientReservations] = useState<any[]>([]);
  const [loadingReservations, setLoadingReservations] = useState(false);

  // Facturas: panel lateral; la ruta /invoices abre Home con el panel puesto (p. ej. desde Mi perfil).
  const [isInvoicesOpen, setIsInvoicesOpen] = useState(location.pathname === '/invoices');

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
    setLoadError(false);
    getParking()
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.data || [];
        setParkings(list);
      })
      .catch((err) => {
        console.error('Error al cargar estacionamientos:', err);
        setLoadError(true);
      })
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

  // Se carga al entrar para mostrar el contador de reservas activas en el Sidebar
  useEffect(() => {
    fetchClientReservations();
  }, [fetchClientReservations]);

  // Dar de baja / cancelar reserva
  const handleCancelReservation = async (reservationId: string) => {
    if (!user?.id) throw new Error('Usuario no identificado');
    await cancelReservation(reservationId, user.id);
    fetchClientReservations();
  };

  const handleRateReservation = async (reservationId: string, rating: number) => {
    if (!user?.id) throw new Error('Usuario no identificado');
    await rateReservation(reservationId, rating, user.id);
    fetchClientReservations();
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  // Mismos estados que ACTIVE_RESERVATION_STATUSES del backend
  const activeReservationsCount = clientReservations.filter((r) =>
    ['PENDIENTE', 'CONFIRMADA', 'EN CURSO'].includes(r.status)
  ).length;

  // Cocheras filtradas por buscador y precio, y ordenadas por precio (las sin tarifa quedan al final)
  const filteredParkings = useMemo(() => {
    const priceOf = (p: Parking) =>
      filters.vehicleType ? getParkingPriceForCategory(p, filters.vehicleType) : getParkingMinPrice(p);
    let list = parkings.filter((p) => matchesQuery(searchQuery, p.name, p.address, p.neighborhood, p.locality, p.province));
    if (filters.locality) list = list.filter((p) => localityKey(p) === filters.locality);
    if (mapArea) {
      const [w, s, e, n] = mapArea;
      list = list.filter((p) => Number(p.longitude) >= w && Number(p.longitude) <= e && Number(p.latitude) >= s && Number(p.latitude) <= n);
    }
    if (filters.maxPrice) {
      const max = filters.maxPrice;
      list = list.filter((p) => {
        const price = priceOf(p);
        return price !== null && price <= max;
      });
    }
    if (filters.sort) {
      const dir = filters.sort === 'price-asc' ? 1 : -1;
      list = [...list].sort((a, b) => {
        const pa = priceOf(a);
        const pb = priceOf(b);
        if (pa === null || pb === null) return pa === pb ? 0 : pa === null ? 1 : -1;
        return (pa - pb) * dir;
      });
    }
    return list;
  }, [parkings, searchQuery, mapArea, filters.maxPrice, filters.sort, filters.vehicleType, filters.locality]);

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

  const handleOpenInvoices = useCallback(() => {
    if (!user) {
      setAuthModalTab('login');
      setIsAuthModalOpen(true);
      return;
    }
    setIsSidebarOpen(false);
    setIsUserMenuOpen(false);
    setIsInvoicesOpen(true);
  }, [user]);

  const closeInvoices = useCallback(() => setIsInvoicesOpen(false), []);

  // Navegar a una de esas rutas con Home ya montado (p. ej. desde Mi perfil) abre su panel; al cerrarlo se vuelve al mapa.
  const path = location.pathname;
  useEffect(() => {
    if (path === '/invoices') setIsInvoicesOpen(true);
    else if (path === '/reservations') { setReservationsModalTab('active'); setIsReservationsModalOpen(true); }
    else if (path.startsWith('/vehicles')) { setVehicleModalTab(path === '/vehicles/new' ? 'create' : 'list'); setIsVehicleModalOpen(true); }
  }, [path]);

  const routePanelOpen = isInvoicesOpen || isReservationsModalOpen || isVehicleModalOpen;
  const wasOpen = useRef(routePanelOpen);
  useEffect(() => {
    if (wasOpen.current && !routePanelOpen && path !== '/') navigate('/', { replace: true });
    wasOpen.current = routePanelOpen;
  }, [routePanelOpen, path, navigate]);

  const handleOpenNotifications = useCallback(() => {
    setIsUserMenuOpen(false);
    setIsNotificationsOpen(true);
  }, []);

  const handleOpenSupport = useCallback(() => {
    setIsUserMenuOpen(false);
    setIsSidebarOpen(false);
    setIsSupportOpen(true);
  }, []);

  // notify: el hook corre fuera del ToastProvider (vive en OwnerShell), así que el aviso lo pasa quien lo tiene
  const handleHostClick = useCallback((notify: (msg: string, type?: 'info') => void) => {
    setIsUserMenuOpen(false);
    setIsSidebarOpen(false);
    if (isOwner) {
      navigate('/owner');
    } else if (user) {
      notify('Para ofrecer tu estacionamiento necesitás una cuenta de dueño.', 'info');
    } else {
      setAuthModalTab('register');
      setIsAuthModalOpen(true);
    }
  }, [isOwner, user, navigate]);

  const handleAuthSuccess = useCallback(() => {
    setIsAuthModalOpen(false);
    if (selectedParkingId && !isModalOpen) {
      setIsModalOpen(true);
    }
  }, [selectedParkingId, isModalOpen]);

  return {
    user,
    theme,
    isOwner,
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
    mapArea,
    setMapArea,
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
    handleRateReservation,
    isFavoritesModalOpen,
    setIsFavoritesModalOpen,
    isAuthModalOpen,
    setIsAuthModalOpen,
    authModalTab,
    setAuthModalTab,
    loading,
    loadError,
    unreadCount,
    activeReservationsCount,
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
    isInvoicesOpen,
    handleOpenInvoices,
    closeInvoices,
    handleOpenSupport,
    handleHostClick,
    handleOpenLogin,
    handleOpenRegister,
    handleAuthSuccess,
  };
}

