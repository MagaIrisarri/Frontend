import React, { useState } from 'react';
import { X, Calendar, Clock, MapPin, Car, CheckCircle, AlertTriangle, Trash2, AlertCircle } from 'lucide-react';
import type { Reservation } from '../../types/reservation.types';

interface ReservationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tab: 'active' | 'history';
  onTabChange: (tab: 'active' | 'history') => void;
  reservations: Reservation[];
  loading: boolean;
  onExploreParkings: () => void;
  onCancelReservation?: (reservationId: string) => Promise<void>;
}

export function ReservationsModal({
  isOpen,
  onClose,
  tab,
  onTabChange,
  reservations,
  loading,
  onExploreParkings,
  onCancelReservation,
}: ReservationsModalProps) {
  const [confirmingReservation, setConfirmingReservation] = useState<Reservation | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelSuccess, setCancelSuccess] = useState<string | null>(null);

  const activeReservations = React.useMemo(() => 
    (reservations || []).filter(
      (r) => r.status === 'PENDIENTE' || r.status === 'CONFIRMADA' || r.status === 'EN CURSO'
    ), [reservations]);

  const historyReservations = React.useMemo(() => 
    (reservations || []).filter(
      (r) => r.status === 'FINALIZADA' || r.status === 'CANCELADA'
    ), [reservations]);

  const currentList = tab === 'active' ? activeReservations : historyReservations;

  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (status: Reservation['status']) => {
    switch (status) {
      case 'EN CURSO':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-green-500/15 text-green-600 dark:text-green-400 border border-green-500/30 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            En curso
          </span>
        );
      case 'CONFIRMADA':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
            Confirmada
          </span>
        );
      case 'PENDIENTE':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            Pendiente
          </span>
        );
      case 'FINALIZADA':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
            Finalizada
          </span>
        );
      case 'CANCELADA':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30">
            Cancelada
          </span>
        );
      default:
        return null;
    }
  };

  const handleConfirmCancel = async () => {
    if (!confirmingReservation || !onCancelReservation) return;
    try {
      setCancelling(true);
      setCancelError(null);
      await onCancelReservation(confirmingReservation.id);
      setCancelSuccess('La reserva fue dada de baja correctamente.');
      setConfirmingReservation(null);
      setTimeout(() => setCancelSuccess(null), 4000);
    } catch (err: any) {
      setCancelError(err.response?.data?.message || err.message || 'Error al dar de baja la reserva');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60  animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-2xl w-full max-h-[85vh] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Cabecera */}
        <div className="p-5 sm:p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                {tab === 'active' ? 'Mis Reservas' : 'Historial de Reservas'}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {tab === 'active' ? 'Reservas activas y programadas' : 'Historial de estadías anteriores'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mensaje de éxito tras cancelar */}
        {cancelSuccess && (
          <div className="mx-5 mt-4 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span>{cancelSuccess}</span>
          </div>
        )}

        {/* Selector de Pestañas */}
        <div className="px-5 pt-3 pb-2 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 flex gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onTabChange('active')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              tab === 'active'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Activas ({activeReservations.length})</span>
          </button>
          <button
            type="button"
            onClick={() => onTabChange('history')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              tab === 'history'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700'
            }`}
          >
            <CheckCircle className="h-3.5 w-3.5" />
            <span>Historial ({historyReservations.length})</span>
          </button>
        </div>

        {/* Contenido de la lista */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-zinc-500">Cargando reservas...</p>
            </div>
          ) : currentList.length === 0 ? (
            <div className="py-12 px-4 flex flex-col items-center justify-center text-center space-y-3">
              <div className="p-4 rounded-3xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400">
                {tab === 'active' ? <Calendar className="h-8 w-8" /> : <CheckCircle className="h-8 w-8" />}
              </div>
              <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
                {tab === 'active' ? 'No tenés reservas activas' : 'Sin reservas en el historial'}
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm">
                {tab === 'active'
                  ? 'Buscá un estacionamiento en el mapa y reservá tu lugar seguro por horas.'
                  : 'Acá verás tus reservas pasadas y comprobantes una vez completadas.'}
              </p>
              {tab === 'active' && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onExploreParkings();
                  }}
                  className="mt-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-blue-600/25"
                >
                  Explorar Estacionamientos
                </button>
              )}
            </div>
          ) : (
            currentList.map((res) => {
              const parkingName = res.parkingSpace?.parking?.name || 'Estacionamiento';
              const parkingAddress = res.parkingSpace?.parking?.address || '';
              const spaceCode = res.parkingSpace?.spaceCode;
              const vehiclePlate = res.vehicle?.plate;
              const brandName = res.vehicle?.brand?.name;
              const modelName = res.vehicle?.model?.name;

              return (
                <div
                  key={res.id}
                  className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800/80 space-y-3 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                        {parkingName}
                        {spaceCode && (
                          <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-mono font-bold">
                            Plaza #{spaceCode}
                          </span>
                        )}
                      </h4>
                      {parkingAddress && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3 text-blue-500" />
                          {parkingAddress}
                        </p>
                      )}
                    </div>
                    {getStatusBadge(res.status)}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-white dark:bg-zinc-900/80 p-3 rounded-xl border border-zinc-200/70 dark:border-zinc-800">
                    <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                      <Clock className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-[10px] text-zinc-400 block font-medium">Desde</span>
                        <span className="font-semibold truncate block">{formatDate(res.startTime)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                      <Clock className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-[10px] text-zinc-400 block font-medium">Hasta</span>
                        <span className="font-semibold truncate block">{formatDate(res.endTime)}</span>
                      </div>
                    </div>

                    {vehiclePlate && (
                      <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 sm:col-span-2 pt-1 border-t border-zinc-100 dark:border-zinc-800/60 mt-1">
                        <Car className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                        <span className="text-[11px] text-zinc-500 font-medium">Vehículo:</span>
                        <span className="font-bold text-zinc-900 dark:text-white uppercase font-mono">{vehiclePlate}</span>
                        {(brandName || modelName) && (
                          <span className="text-zinc-500 text-[11px]">({brandName} {modelName})</span>
                        )}
                      </div>
                    )}
                  </div>

                  {res.services && res.services.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-zinc-400 font-bold uppercase">Servicios:</span>
                      {res.services.map((s, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-semibold border border-amber-500/20"
                        >
                          {s.serviceCatalog?.name || 'Servicio'} (${s.price})
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Botón para dar de baja la reserva */}
                  {(res.status === 'PENDIENTE' || res.status === 'CONFIRMADA') && onCancelReservation && (
                    <div className="pt-2 border-t border-zinc-200/70 dark:border-zinc-800 flex items-center justify-between">
                      <span className="text-[11px] text-zinc-400">
                        ¿No vas a utilizar la cochera?
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setCancelError(null);
                          setConfirmingReservation(res);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-500/10 border border-red-500/20 transition-all cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Dar de baja</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* MODAL DE CONFIRMACIÓN DE BAJA */}
      {confirmingReservation && (
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
                  Esta acción liberará la plaza inmediatamente
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-500">Estacionamiento:</span>
                <span className="font-bold text-zinc-900 dark:text-white">
                  {confirmingReservation.parkingSpace?.parking?.name || 'Cochera'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Fecha y Hora:</span>
                <span className="font-semibold text-zinc-900 dark:text-white">
                  {formatDate(confirmingReservation.startTime)}
                </span>
              </div>
              {confirmingReservation.parkingSpace?.spaceCode && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">Plaza:</span>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                    #{confirmingReservation.parkingSpace.spaceCode}
                  </span>
                </div>
              )}
              {confirmingReservation.vehicle?.plate && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">Vehículo:</span>
                  <span className="font-mono font-bold uppercase text-zinc-900 dark:text-white">
                    {confirmingReservation.vehicle.plate}
                  </span>
                </div>
              )}
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs">
              La plaza asignada quedará disponible de inmediato para otros conductores.
            </div>

            {cancelError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{cancelError}</span>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                disabled={cancelling}
                onClick={() => {
                  setConfirmingReservation(null);
                  setCancelError(null);
                }}
                className="flex-1 py-2.5 px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-bold transition-all cursor-pointer"
              >
                Volver
              </button>
              <button
                type="button"
                disabled={cancelling}
                onClick={handleConfirmCancel}
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
}

