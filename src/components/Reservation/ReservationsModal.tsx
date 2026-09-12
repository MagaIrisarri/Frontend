import React, { useState } from 'react';
import { X, Calendar, Clock, CheckCircle } from 'lucide-react';
import type { Reservation } from '../../types/reservation.types';
import { ReservationCard } from './ReservationCard';
import { CancelReservationDialog } from './CancelReservationDialog';

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
            currentList.map((res) => (
              <ReservationCard
                key={res.id}
                reservation={res}
                onCancel={
                  onCancelReservation
                    ? (reservation) => {
                        setCancelError(null);
                        setConfirmingReservation(reservation);
                      }
                    : undefined
                }
              />
            ))
          )}
        </div>
      </div>

      {/* MODAL DE CONFIRMACIÓN DE BAJA */}
      <CancelReservationDialog
        isOpen={!!confirmingReservation}
        reservation={confirmingReservation}
        onClose={() => {
          setConfirmingReservation(null);
          setCancelError(null);
        }}
        onConfirm={handleConfirmCancel}
        loading={cancelling}
        error={cancelError}
      />
    </div>
  );
}

