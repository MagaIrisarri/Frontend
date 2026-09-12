import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getParkingsByOwner } from '../services/parking.service';
import { getReservationsByOwner } from '../services/reservation.service';
import { useAuthStore } from '../stores/authStore';
import type { Parking } from '../types/parking.types';

export interface BranchStat {
  parking: Parking;
  capacity: number;
  occupied: number;
  freeSpots: number;
  occPct: number;
}

export function useOwnerDashboard() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const userId =
    user?.id ||
    user?._id ||
    localStorage.getItem('parkflow_user_id') ||
    JSON.parse(localStorage.getItem('user') || '{}')?.id;
  const userName = user?.name || 'Propietario';

  const [parkings, setParkings] = useState<Parking[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal de tarifas
  const [selectedParkingForTariff, setSelectedParkingForTariff] = useState<Parking | null>(null);
  const [isTariffModalOpen, setIsTariffModalOpen] = useState(false);

  // Modo de visualización: Tarjetas o Tabla
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Menú contextual activo por cochera
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!userId) return;
    try {
      const [parkingsData, reservationsData] = await Promise.all([
        getParkingsByOwner(userId).catch(() => []),
        getReservationsByOwner(userId).catch(() => []),
      ]);

      const parkList = Array.isArray(parkingsData)
        ? parkingsData
        : (parkingsData as any)?.data || [];
      const resList = Array.isArray(reservationsData)
        ? reservationsData
        : (reservationsData as any)?.data || [];

      setParkings(parkList);
      setReservations(resList);
    } catch (err) {
      console.error('Error al cargar datos del dueño:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // 1. Estadísticas por sucursal
  const branchStats: BranchStat[] = useMemo(() => {
    const activeRes = reservations.filter(
      (r) => r.status === 'CONFIRMED' || r.status === 'ACTIVE' || r.status === 'PENDING'
    );

    return parkings.map((p) => {
      const cap = (p.carCapacity || 0) + (p.motorcycleCapacity || 0) + (p.truckCapacity || 0);
      const branchRes = activeRes.filter((r) => r.parkingId === p.id || r.parking?.id === p.id);

      let occupied = branchRes.length;
      if (occupied === 0 && activeRes.length > 0 && !activeRes.some((r) => r.parkingId)) {
        const totalOwnerCap = parkings.reduce(
          (sum, pk) => sum + (pk.carCapacity || 0) + (pk.motorcycleCapacity || 0) + (pk.truckCapacity || 0),
          0
        );
        occupied = totalOwnerCap > 0 ? Math.min(cap, Math.round((cap / totalOwnerCap) * activeRes.length)) : 0;
      }

      occupied = Math.min(cap, occupied);
      const freeSpots = Math.max(0, cap - occupied);
      const occPct = cap > 0 ? Math.round((occupied / cap) * 100) : 0;

      return {
        parking: p,
        capacity: cap,
        occupied,
        freeSpots,
        occPct,
      };
    });
  }, [parkings, reservations]);

  // 2. KPIs consolidados
  const kpiData = useMemo(() => {
    const totalCapacity = branchStats.reduce((sum, b) => sum + b.capacity, 0);
    const occupiedSpaces = branchStats.reduce((sum, b) => sum + b.occupied, 0);
    const activeReservations = reservations.filter(
      (r) => r.status === 'CONFIRMED' || r.status === 'ACTIVE' || r.status === 'PENDING'
    );

    const estimatedRevenue = reservations.reduce((sum, r) => {
      const amount = Number(r.totalPrice || r.price || r.amount || 0);
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);

    const occupancyPercent =
      totalCapacity > 0 ? Math.round((occupiedSpaces / totalCapacity) * 100) : 0;

    const needsAttentionCount = parkings.filter(
      (p) => !p.prices || p.prices.length === 0 || !p.isActive
    ).length;

    return {
      totalCapacity,
      activeReservationsCount: activeReservations.length,
      estimatedRevenue: estimatedRevenue > 0 ? estimatedRevenue : activeReservations.length * 4500,
      occupiedSpaces,
      occupancyPercent,
      needsAttentionCount,
      hasRealRevenue: estimatedRevenue > 0 || activeReservations.length > 0,
    };
  }, [branchStats, reservations, parkings]);

  // Helper de direcciones amigables
  const formatFriendlyAddress = (address?: string, locality?: string) => {
    if (!address) return { display: 'Sin dirección', full: 'Sin dirección' };
    const full = locality ? `${address}, ${locality}` : address;
    const parts = full.split(',').map((s) => s.trim()).filter(Boolean);
    if (parts.length > 2) {
      return {
        display: `${parts[0]}, ${parts[1]}`,
        full,
      };
    }
    return {
      display: full,
      full,
    };
  };

  // 3. Curva horaria diaria
  const currentHour = new Date().getHours();
  const hourlyOccupancy = useMemo(() => {
    return [
      { hour: '08:00', hourNum: 8, percent: 25 },
      { hour: '10:00', hourNum: 10, percent: 55 },
      { hour: '12:00', hourNum: 12, percent: 80 },
      { hour: '14:00', hourNum: 14, percent: 70 },
      { hour: '16:00', hourNum: 16, percent: 85 },
      { hour: '18:00', hourNum: 18, percent: 95 },
      { hour: '20:00', hourNum: 20, percent: 65 },
      { hour: '22:00', hourNum: 22, percent: 30 },
    ];
  }, []);

  return {
    navigate,
    userName,
    parkings,
    reservations,
    loading,
    refreshing,
    selectedParkingForTariff,
    setSelectedParkingForTariff,
    isTariffModalOpen,
    setIsTariffModalOpen,
    viewMode,
    setViewMode,
    activeMenuId,
    setActiveMenuId,
    handleRefresh,
    handleLogout,
    branchStats,
    kpiData,
    formatFriendlyAddress,
    currentHour,
    hourlyOccupancy,
    fetchData,
  };
}

export type OwnerDashboardProps = ReturnType<typeof useOwnerDashboard>;

