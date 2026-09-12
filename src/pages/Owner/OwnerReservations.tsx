import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileSpreadsheet,
  Download,
  Search,
  Building2,
  Calendar,
  Car,
  User,
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Sparkles,
  RefreshCw,
  Phone,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { ThemeToggle } from '../../components/Shared/ThemeToggle';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { useTheme } from '../../context/ThemeContext';
import { getReservationsByOwner, cancelReservation } from '../../services/reservation.service';
import { getParkingsByOwner } from '../../services/parking.service';
import type { Reservation } from '../../types/reservation.types';
import type { Parking } from '../../types/parking.types';

export const OwnerReservations: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = useCurrentUser();
  const { theme } = useTheme();

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [parkings, setParkings] = useState<Parking[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [selectedParkingId, setSelectedParkingId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Estados de baja de reserva
  const [confirmingCancel, setConfirmingCancel] = useState<Reservation | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const handleCancelReservation = async () => {
    if (!confirmingCancel || !currentUser?.id) return;
    try {
      setCancelling(true);
      setActionError(null);
      await cancelReservation(confirmingCancel.id, currentUser.id);
      setActionSuccess(`Reserva #${confirmingCancel.id.substring(0, 8)} dada de baja con éxito.`);
      setConfirmingCancel(null);
      await loadData();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Error al dar de baja la reserva';
      setActionError(msg);
      setTimeout(() => setActionError(null), 5000);
    } finally {
      setCancelling(false);
    }
  };

  const loadData = async () => {
    if (!currentUser?.id) return;
    try {
      setLoading(true);
      const [resData, parkingsData] = await Promise.all([
        getReservationsByOwner(currentUser.id).catch(() => ({ data: [] })),
        getParkingsByOwner(currentUser.id).catch(() => ({ data: [] })),
      ]);

      const resList = Array.isArray(resData) ? resData : (resData?.data || []);
      const parkList = Array.isArray(parkingsData) ? parkingsData : (parkingsData?.data || []);

      setReservations(resList);
      setParkings(parkList);
    } catch (err) {
      console.error('Error al cargar reporte de reservas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  // Filtrado reactivo
  const filteredReservations = useMemo(() => {
    return reservations.filter((r) => {
      // Filtro por cochera
      if (selectedParkingId !== 'all' && r.parkingSpace?.parking?.id !== selectedParkingId) {
        return false;
      }

      // Filtro por estado
      if (statusFilter === 'active') {
        if (!['EN CURSO', 'CONFIRMADA', 'PENDIENTE'].includes(r.status)) return false;
      } else if (statusFilter === 'completed') {
        if (r.status !== 'FINALIZADA') return false;
      } else if (statusFilter === 'cancelled') {
        if (r.status !== 'CANCELADA') return false;
      } else if (statusFilter !== 'all' && r.status !== statusFilter) {
        return false;
      }

      // Filtro por fechas
      if (startDate) {
        const resStart = new Date(r.startTime).toISOString().split('T')[0];
        if (resStart < startDate) return false;
      }
      if (endDate) {
        const resStart = new Date(r.startTime).toISOString().split('T')[0];
        if (resStart > endDate) return false;
      }

      // Filtro de búsqueda por texto (patente, cliente, plaza, ID)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const plate = r.vehicle?.plate?.toLowerCase() || '';
        const clientName = `${r.vehicle?.client?.name || ''} ${r.vehicle?.client?.last_name || ''}`.toLowerCase();
        const clientPhone = r.vehicle?.client?.phone || '';
        const spaceCode = r.parkingSpace?.spaceCode?.toLowerCase() || '';
        const parkingName = r.parkingSpace?.parking?.name?.toLowerCase() || '';
        const resId = r.id?.toLowerCase() || '';

        return (
          plate.includes(q) ||
          clientName.includes(q) ||
          clientPhone.includes(q) ||
          spaceCode.includes(q) ||
          parkingName.includes(q) ||
          resId.includes(q)
        );
      }

      return true;
    });
  }, [reservations, selectedParkingId, statusFilter, searchQuery, startDate, endDate]);

  // Estadísticas calculadas
  const stats = useMemo(() => {
    const total = reservations.length;
    const active = reservations.filter((r) => ['EN CURSO', 'CONFIRMADA', 'PENDIENTE'].includes(r.status)).length;
    const completed = reservations.filter((r) => r.status === 'FINALIZADA').length;
    const cancelled = reservations.filter((r) => r.status === 'CANCELADA').length;

    return { total, active, completed, cancelled };
  }, [reservations]);

  // Exportar a Excel (CSV con UTF-8 BOM)
  const exportToCSV = () => {
    if (filteredReservations.length === 0) {
      alert('No hay reservas para exportar con los filtros actuales.');
      return;
    }

    const headers = [
      'ID Reserva',
      'Cochera',
      'Direccion',
      'Plaza',
      'Estado',
      'Fecha Ingreso',
      'Hora Entrada',
      'Hora Salida',
      'Patente',
      'Vehiculo',
      'Tipo',
      'Cliente',
      'Telefono / Contacto',
      'Email',
      'Servicios Extra',
    ];

    const rows = filteredReservations.map((r) => {
      const startDateObj = new Date(r.startTime);
      const endDateObj = new Date(r.endTime);
      const formattedDate = startDateObj.toLocaleDateString('es-AR');
      const entryHour = startDateObj.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
      const exitHour = endDateObj.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
      const clientFullName = `${r.vehicle?.client?.name || ''} ${r.vehicle?.client?.last_name || ''}`.trim() || 'Cliente';
      const vehicleDesc = `${r.vehicle?.brand?.name || ''} ${r.vehicle?.model?.name || ''}`.trim() || '-';
      const vehicleType = r.vehicle?.vehicleType?.name || 'Auto';
      const servicesList = r.services && r.services.length > 0
        ? r.services.map((s) => `${s.serviceCatalog?.name || 'Servicio'} ($${s.price})`).join(' + ')
        : 'Ninguno';

      return [
        `"${r.id}"`,
        `"${r.parkingSpace?.parking?.name || 'Cochera'}"`,
        `"${r.parkingSpace?.parking?.address || '-'}"`,
        `"${r.parkingSpace?.spaceCode || '-'}"`,
        `"${r.status}"`,
        `"${formattedDate}"`,
        `"${entryHour}"`,
        `"${exitHour}"`,
        `"${r.vehicle?.plate || '-'}"`,
        `"${vehicleDesc}"`,
        `"${vehicleType}"`,
        `"${clientFullName}"`,
        `"${r.vehicle?.client?.phone || '-'}"`,
        `"${r.vehicle?.client?.email || '-'}"`,
        `"${servicesList}"`,
      ].join(';');
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().split('T')[0];

    link.setAttribute('href', url);
    link.setAttribute('download', `planilla_reservas_${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'EN CURSO':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            En Curso
          </span>
        );
      case 'CONFIRMADA':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="h-3 w-3" />
            Confirmada
          </span>
        );
      case 'PENDIENTE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            <Clock className="h-3 w-3" />
            Pendiente
          </span>
        );
      case 'FINALIZADA':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
            Finalizada
          </span>
        );
      case 'CANCELADA':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
            <XCircle className="h-3 w-3" />
            Cancelada
          </span>
        );
      default:
        return <span className="text-xs text-zinc-500">{status}</span>;
    }
  };

  const shineColors = theme === 'dark'
    ? ['#2563EB', '#38BDF8', '#818CF8']
    : ['#93C5FD', '#3B82F6', '#60A5FA'];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white p-4 md:p-8 flex flex-col items-center transition-colors">
      <div className="w-full max-w-7xl space-y-6">
        
        {/* Barra Superior */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/owner')}
              className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al Panel de Dueño
            </button>
            <span className="text-zinc-300 dark:text-zinc-700">|</span>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline transition-colors cursor-pointer"
            >
              <Car className="h-3.5 w-3.5" />
              Ver Mapa / Reservar
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={loadData}
              className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-white transition-colors cursor-pointer shadow-sm"
              title="Refrescar datos"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={exportToCSV}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/25 transition-all cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>Exportar a Excel (CSV)</span>
            </button>
            <ThemeToggle />
          </div>
        </div>

        {/* Tarjeta de Métricas Rápidas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block mb-1">
              Total Registros
            </span>
            <span className="text-2xl font-black text-zinc-900 dark:text-white">{stats.total}</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 block mb-1">
              Vigentes / Hoy
            </span>
            <span className="text-2xl font-black text-blue-600 dark:text-blue-400">{stats.active}</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-1">
              Finalizadas
            </span>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.completed}</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-red-500 block mb-1">
              Canceladas
            </span>
            <span className="text-2xl font-black text-red-500">{stats.cancelled}</span>
          </div>
        </div>

        {/* Planilla Principal */}
        <div
          className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 md:p-8 shadow-sm rounded-3xl"
        >
          {/* Cabecera del Reporte */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-200 dark:border-zinc-800 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-600/10 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 rounded-2xl">
                <FileSpreadsheet className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-black tracking-tight text-zinc-900 dark:text-white">
                  Registro y Planilla de Reservas
                </h1>
                <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400">
                  Control en tiempo real e histórico de todas las reservas de tus cocheras
                </p>
              </div>
            </div>

            {/* Pestañas de estado rápido */}
            <div className="flex p-1 bg-zinc-100 dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                Todas ({stats.total})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('active')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'active'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                Activas ({stats.active})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('completed')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'completed'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                Historial ({stats.completed})
              </button>
            </div>
          </div>

          {/* Barra de Filtros estilo Excel */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200 dark:border-zinc-800">
            {/* Buscador */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Buscar patente, cliente, plaza..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-white focus:border-blue-500 outline-none"
              />
            </div>

            {/* Selector de Cochera */}
            <div>
              <select
                value={selectedParkingId}
                onChange={(e) => setSelectedParkingId(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-white focus:border-blue-500 outline-none"
              >
                <option value="all">Todas las Cocheras ({parkings.length})</option>
                {parkings.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Fecha Desde */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-zinc-500 shrink-0">Desde:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-white focus:border-blue-500 outline-none"
              />
            </div>

            {/* Fecha Hasta */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-zinc-500 shrink-0">Hasta:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-white focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Alertas de Éxito / Error */}
          {actionSuccess && (
            <div className="mb-4 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{actionSuccess}</span>
            </div>
          )}
          {actionError && (
            <div className="mb-4 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          {/* Tabla Interactiva Estilo Planilla */}
          {loading ? (
            <div className="py-20 text-center text-zinc-400 flex flex-col items-center justify-center gap-3">
              <div className="h-7 w-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs">Cargando registros de reservas...</p>
            </div>
          ) : filteredReservations.length === 0 ? (
            <div className="py-16 text-center text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-950/40 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 p-8">
              <FileSpreadsheet className="h-12 w-12 text-zinc-400 dark:text-zinc-600 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">No se encontraron reservas</h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                No hay resultados para los filtros o criterios de búsqueda seleccionados.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-950/70 border-b border-zinc-200 dark:border-zinc-800 text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 sticky top-0">
                  <tr>
                    <th className="py-3.5 px-4">Estado</th>
                    <th className="py-3.5 px-4">Cochera / Plaza</th>
                    <th className="py-3.5 px-4">Horario</th>
                    <th className="py-3.5 px-4">Vehículo</th>
                    <th className="py-3.5 px-4">Cliente</th>
                    <th className="py-3.5 px-4">Servicios Extra</th>
                    <th className="py-3.5 px-4 text-center">Acciones</th>
                    <th className="py-3.5 px-4 text-right">ID Reserva</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60 font-sans">
                  {filteredReservations.map((r) => {
                    const startDateObj = new Date(r.startTime);
                    const endDateObj = new Date(r.endTime);
                    const formattedDate = startDateObj.toLocaleDateString('es-AR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    });
                    const entryHour = startDateObj.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
                    const exitHour = endDateObj.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

                    const clientName = `${r.vehicle?.client?.name || ''} ${r.vehicle?.client?.last_name || ''}`.trim() || 'Cliente';
                    const canCancel = ['PENDIENTE', 'CONFIRMADA'].includes(r.status);

                    return (
                      <tr
                        key={r.id}
                        className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors"
                      >
                        {/* Estado */}
                        <td className="py-3.5 px-4">
                          {getStatusBadge(r.status)}
                        </td>

                        {/* Cochera y Plaza */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-zinc-900 dark:text-white">
                            {r.parkingSpace?.parking?.name || 'Cochera'}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono font-bold text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                              Plaza {r.parkingSpace?.spaceCode || '-'}
                            </span>
                            <span className="text-[11px] text-zinc-400">({r.parkingSpace?.vehicleType || 'Auto'})</span>
                          </div>
                        </td>

                        {/* Horario */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-zinc-800 dark:text-zinc-200">{formattedDate}</div>
                          <div className="text-[11px] text-zinc-500 font-mono">
                            {entryHour} - {exitHour} hs
                          </div>
                        </td>

                        {/* Vehículo */}
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white inline-block mb-0.5">
                            {r.vehicle?.plate || '-'}
                          </span>
                          <div className="text-[11px] text-zinc-500">
                            {r.vehicle?.brand?.name || ''} {r.vehicle?.model?.name || ''}
                          </div>
                        </td>

                        {/* Cliente */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-zinc-900 dark:text-white">{clientName}</div>
                          {r.vehicle?.client?.phone && (
                            <div className="text-[11px] text-zinc-500 flex items-center gap-1 mt-0.5">
                              <Phone className="h-3 w-3" />
                              {r.vehicle.client.phone}
                            </div>
                          )}
                        </td>

                        {/* Servicios Extra */}
                        <td className="py-3.5 px-4">
                          {r.services && r.services.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {r.services.map((s) => (
                                <span
                                  key={s.id}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-300 text-[10px] font-semibold border border-purple-500/20"
                                >
                                  <Sparkles className="h-2.5 w-2.5" />
                                  {s.serviceCatalog?.name || 'Servicio'} (${s.price})
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-zinc-400 text-[11px]">-</span>
                          )}
                        </td>

                        {/* Acciones */}
                        <td className="py-3.5 px-4 text-center">
                          {canCancel ? (
                            <button
                              type="button"
                              onClick={() => {
                                setActionError(null);
                                setConfirmingCancel(r);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-red-600 dark:text-red-400 hover:bg-red-500/10 border border-red-500/20 transition-all cursor-pointer"
                              title="Dar de baja reserva"
                            >
                              <Trash2 className="h-3 w-3" />
                              <span>Dar de baja</span>
                            </button>
                          ) : (
                            <span className="text-zinc-400 text-[11px]">-</span>
                          )}
                        </td>

                        {/* ID Reserva */}
                        <td className="py-3.5 px-4 text-right">
                          <span className="font-mono text-[10px] text-zinc-400" title={r.id}>
                            #{r.id.substring(0, 8)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Confirmación de Cancelación para Dueños */}
      {confirmingCancel && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70  animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                  ¿Dar de baja esta reserva?
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Reserva #{confirmingCancel.id.substring(0, 8)}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-500">Cochera:</span>
                <span className="font-bold text-zinc-900 dark:text-white">
                  {confirmingCancel.parkingSpace?.parking?.name || 'Cochera'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Cliente:</span>
                <span className="font-semibold text-zinc-900 dark:text-white">
                  {`${confirmingCancel.vehicle?.client?.name || ''} ${confirmingCancel.vehicle?.client?.last_name || ''}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Vehículo:</span>
                <span className="font-mono font-bold uppercase text-zinc-900 dark:text-white">
                  {confirmingCancel.vehicle?.plate || '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Plaza:</span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                  #{confirmingCancel.parkingSpace?.spaceCode || '-'}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs">
              ⚠️ La plaza quedará liberada inmediatamente en el sistema para nuevas reservas.
            </div>

            {actionError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                disabled={cancelling}
                onClick={() => {
                  setConfirmingCancel(null);
                  setActionError(null);
                }}
                className="flex-1 py-2.5 px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-bold transition-all cursor-pointer"
              >
                Volver
              </button>
              <button
                type="button"
                disabled={cancelling}
                onClick={handleCancelReservation}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/25 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {cancelling ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Dando de baja...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    <span>Confirmar baja</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerReservations;





