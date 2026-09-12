import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getParkingSpace,
  updateParkingSpace,
  removeParkingSpace,
  createParkingSpace,
} from '../services/parkingSpace.service';
import { getOneParking, getParkingsByOwner } from '../services/parking.service';
import { getReservationsByOwner } from '../services/reservation.service';
import { useAuthStore } from '../stores/authStore';
import type { Parking } from '../types/parking.types';
import type { ParkingSpace } from '../types/parkingSpace.types';

export function useParkingSpaceEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  const userId =
    currentUser?.id ||
    currentUser?._id ||
    localStorage.getItem('parkflow_user_id') ||
    JSON.parse(localStorage.getItem('user') || '{}')?.id;

  const [parking, setParking] = useState<Parking | null>(null);
  const [ownerParkings, setOwnerParkings] = useState<Parking[]>([]);
  const [spaces, setSpaces] = useState<ParkingSpace[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filtros de Toolbar
  const [vehicleFilter, setVehicleFilter] = useState<'all' | 'Auto' | 'Moto' | 'Camioneta'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'LIBRE' | 'OCUPADO' | 'MANTENIMIENTO'>('all');

  // Modal para Agregar Nueva Plaza
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSpaceCode, setNewSpaceCode] = useState('');
  const [newSpaceVehicleType, setNewSpaceVehicleType] = useState('Auto');
  const [isCreatingSpace, setIsCreatingSpace] = useState(false);
  const [addModalError, setAddModalError] = useState<string | null>(null);

  // Estados de operaciones en Drawer
  const [isUpdatingState, setIsUpdatingState] = useState(false);
  const [drawerError, setDrawerError] = useState<string | null>(null);
  const [drawerSuccess, setDrawerSuccess] = useState<string | null>(null);

  // Diálogo de confirmación para eliminar plaza
  const [spaceToDelete, setSpaceToDelete] = useState<ParkingSpace | null>(null);

  const loadData = useCallback(async (targetId?: string) => {
    const parkingId = targetId || id;
    if (!parkingId) return;

    try {
      setErrorMsg(null);
      const [parkingRes, spacesRes, ownerParkingsRes, reservationsRes] = await Promise.all([
        getOneParking(parkingId).catch(() => null),
        getParkingSpace(parkingId).catch(() => ({ data: [] })),
        userId ? getParkingsByOwner(userId).catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
        userId ? getReservationsByOwner(userId).catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
      ]);

      if (parkingRes) {
        setParking(parkingRes.data || parkingRes);
      }

      const rawSpaces = Array.isArray(spacesRes) ? spacesRes : (spacesRes as any)?.data || [];
      setSpaces(rawSpaces);

      const rawOwnerParkings = Array.isArray(ownerParkingsRes) ? ownerParkingsRes : (ownerParkingsRes as any)?.data || [];
      setOwnerParkings(rawOwnerParkings);

      const rawReservations = Array.isArray(reservationsRes) ? reservationsRes : (reservationsRes as any)?.data || [];
      setReservations(rawReservations);
    } catch (err) {
      console.error('Error al cargar plazas:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, userId]);

  useEffect(() => {
    if (id) {
      setLoading(true);
      loadData(id);
    }
  }, [id, loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleSelectParking = (newId: string) => {
    if (newId !== id) {
      navigate(`/parking-space/${newId}`);
    }
  };

  // KPIs de capacidad
  const kpis = useMemo(() => {
    const total = spaces.length;
    const libres = spaces.filter((s) => (s.state || 'LIBRE') === 'LIBRE').length;
    const ocupadas = spaces.filter((s) => s.state === 'OCUPADO').length;
    const mantenimiento = spaces.filter((s) => s.state === 'MANTENIMIENTO').length;
    const occupancyPct = total > 0 ? Math.round((ocupadas / total) * 100) : 0;
    return { total, libres, ocupadas, mantenimiento, occupancyPct };
  }, [spaces]);

  // Filtrado de plazas
  const filteredSpaces = useMemo(() => {
    return spaces.filter((s) => {
      const vType = s.vehicleType || (s as any).vehicle_type || 'Auto';
      if (vehicleFilter !== 'all' && vType !== vehicleFilter) return false;
      const state = s.state || 'LIBRE';
      if (statusFilter !== 'all' && state !== statusFilter) return false;
      return true;
    });
  }, [spaces, vehicleFilter, statusFilter]);

  // Agrupación por sector
  const sectors = useMemo(() => {
    const autos = filteredSpaces.filter((s) => (s.vehicleType || (s as any).vehicle_type || 'Auto') === 'Auto');
    const motos = filteredSpaces.filter((s) => (s.vehicleType || (s as any).vehicle_type) === 'Moto');
    const utilitarios = filteredSpaces.filter((s) => (s.vehicleType || (s as any).vehicle_type) === 'Camioneta');
    return { autos, motos, utilitarios };
  }, [filteredSpaces]);

  // Plaza seleccionada y su reserva activa
  const selectedSpace = useMemo(() => {
    return spaces.find((s) => s.id === selectedSpaceId || (s as any)._id === selectedSpaceId) || null;
  }, [spaces, selectedSpaceId]);

  const activeReservationForSelected = useMemo(() => {
    if (!selectedSpace) return null;
    return reservations.find(
      (r) =>
        (r.parkingSpaceId === selectedSpace.id || r.parkingSpace?._id === selectedSpace.id) &&
        (r.status === 'CONFIRMED' || r.status === 'ACTIVE' || r.status === 'PENDING')
    );
  }, [selectedSpace, reservations]);

  // Operaciones sobre la plaza
  const handleUpdateSpaceState = async (newState: 'LIBRE' | 'OCUPADO' | 'MANTENIMIENTO') => {
    if (!selectedSpace?.id) return;
    setIsUpdatingState(true);
    setDrawerError(null);
    setDrawerSuccess(null);
    try {
      await updateParkingSpace(selectedSpace.id, {
        state: newState,
        vehicleType: selectedSpace.vehicleType || (selectedSpace as any).vehicle_type || 'Auto',
      });
      setSpaces((prev) =>
        prev.map((s) => (s.id === selectedSpace.id ? { ...s, state: newState } : s))
      );
      setDrawerSuccess(`Plaza actualizada a estado ${newState}`);
      setTimeout(() => setDrawerSuccess(null), 3000);
    } catch (err: any) {
      setDrawerError(err.response?.data?.message || 'Error al actualizar el estado de la plaza');
    } finally {
      setIsUpdatingState(false);
    }
  };

  const handleUpdateVehicleType = async (newType: string) => {
    if (!selectedSpace?.id) return;
    setIsUpdatingState(true);
    setDrawerError(null);
    setDrawerSuccess(null);
    try {
      await updateParkingSpace(selectedSpace.id, {
        state: selectedSpace.state || 'LIBRE',
        vehicleType: newType,
      });
      setSpaces((prev) =>
        prev.map((s) => (s.id === selectedSpace.id ? { ...s, vehicleType: newType } : s))
      );
      setDrawerSuccess(`Tipo de vehículo actualizado a ${newType}`);
      setTimeout(() => setDrawerSuccess(null), 3000);
    } catch (err: any) {
      setDrawerError(err.response?.data?.message || 'Error al cambiar tipo de vehículo');
    } finally {
      setIsUpdatingState(false);
    }
  };

  const handleCreateSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newSpaceCode.trim()) {
      setAddModalError('Ingresá un código o número de plaza.');
      return;
    }
    setIsCreatingSpace(true);
    setAddModalError(null);
    try {
      const created = await createParkingSpace(id, {
        spaceCode: newSpaceCode.trim().toUpperCase(),
        vehicleType: newSpaceVehicleType,
        state: 'LIBRE',
      });
      const newSpaceItem = (created as any)?.data || created;
      setSpaces((prev) => [...prev, newSpaceItem]);
      setIsAddModalOpen(false);
      setNewSpaceCode('');
      setNewSpaceVehicleType('Auto');
      setSelectedSpaceId(newSpaceItem.id || newSpaceItem._id);
    } catch (err: any) {
      setAddModalError(err.response?.data?.message || 'Error al crear la plaza');
    } finally {
      setIsCreatingSpace(false);
    }
  };

  const validateCanDeleteSpace = useCallback((space: ParkingSpace): { canDelete: boolean; reason?: string } => {
    if (space.state === 'OCUPADO') {
      return {
        canDelete: false,
        reason: 'Vehículo en estancia. Esta plaza no puede eliminarse mientras esté ocupada.',
      };
    }

    const vType = space.vehicleType || (space as any).vehicle_type || 'Auto';
    const normalizedType = vType.toUpperCase();

    // Contar plazas activas del mismo tipo en esta sucursal
    const activeSpacesOfType = spaces.filter((s) => {
      const sType = (s.vehicleType || (s as any).vehicle_type || 'Auto').toUpperCase();
      return sType.includes(normalizedType) || normalizedType.includes(sType);
    }).length;

    // Contar reservas activas o comprometidas para esta sucursal y categoría
    const activeReservationsOfType = reservations.filter((r) => {
      const isStatusActive =
        r.status === 'CONFIRMED' ||
        r.status === 'ACTIVE' ||
        r.status === 'PENDING' ||
        r.status === 'CONFIRMADA' ||
        r.status === 'EN CURSO' ||
        r.status === 'PENDIENTE';
      if (!isStatusActive) return false;
      const resVehType = (
        r.vehicle?.vehicleType?.name ||
        r.vehicleType ||
        r.vehicle?.vehicleType ||
        'Auto'
      ).toUpperCase();
      return resVehType.includes(normalizedType) || normalizedType.includes(resVehType);
    }).length;

    if (activeSpacesOfType <= activeReservationsOfType) {
      return {
        canDelete: false,
        reason: 'No es posible eliminar la plaza: existen reservas activas comprometidas para este tipo de vehículo.',
      };
    }

    return { canDelete: true };
  }, [spaces, reservations]);

  const requestDeleteSpace = useCallback((space: ParkingSpace) => {
    setDrawerError(null);
    const validation = validateCanDeleteSpace(space);
    if (!validation.canDelete) {
      setDrawerError(validation.reason || 'No es posible eliminar la plaza');
      return;
    }
    setSpaceToDelete(space);
  }, [validateCanDeleteSpace]);

  const handleDeleteSpace = async () => {
    if (!spaceToDelete?.id) return;
    try {
      await removeParkingSpace(spaceToDelete.id);
      setSpaces((prev) => prev.filter((s) => s.id !== spaceToDelete.id));
      if (selectedSpaceId === spaceToDelete.id) {
        setSelectedSpaceId(null);
      }
      setSpaceToDelete(null);
    } catch (err: any) {
      setDrawerError(err.response?.data?.message || 'Error al eliminar la plaza');
    }
  };

  return {
    id,
    navigate,
    parking,
    ownerParkings,
    spaces,
    filteredSpaces,
    sectors,
    selectedSpaceId,
    setSelectedSpaceId,
    selectedSpace,
    activeReservationForSelected,
    loading,
    refreshing,
    errorMsg,
    handleRefresh,
    handleSelectParking,
    kpis,
    vehicleFilter,
    setVehicleFilter,
    statusFilter,
    setStatusFilter,
    isAddModalOpen,
    setIsAddModalOpen,
    newSpaceCode,
    setNewSpaceCode,
    newSpaceVehicleType,
    setNewSpaceVehicleType,
    isCreatingSpace,
    addModalError,
    handleCreateSpace,
    isUpdatingState,
    drawerError,
    drawerSuccess,
    handleUpdateSpaceState,
    handleUpdateVehicleType,
    spaceToDelete,
    setSpaceToDelete,
    requestDeleteSpace,
    handleDeleteSpace,
  };
}

export type ParkingSpaceEditProps = ReturnType<typeof useParkingSpaceEdit>;

