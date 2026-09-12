import React from 'react';
import { AlertTriangle, AlertCircle, Trash2 } from 'lucide-react';
import type { Reservation } from '../../types/reservation.types';
import { formatReservationDate } from '../../utils/date';

export interface CancelReservationDialogProps {
  isOpen: boolean;
  reservation: Reservation | null;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  loading?: boolean;
  error?: string | null;
}

export function CancelReservationDialog({
  isOpen,
  reservation,
  onClose,
  onConfirm,
  loading = false,
  error = null,
}: CancelReservationDialogProps) {
  if (!isOpen || !reservation) return null;

  const parkingName =
    reservation.parkingSpace?.parking?.name ||
    reservation.parking?.name ||
    'Cochera';
  const spaceCode = reservation.parkingSpace?.spaceCode || reservation.spaceCode;
  const vehiclePlate = reservation.vehicle?.plate || reservation.plate;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 animate-in fade-in">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
        <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
          <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 shrink-0">
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
          <div className="flex justify-between gap-2">
            <span className="text-zinc-500">Estacionamiento:</span>
            <span className="font-bold text-zinc-900 dark:text-white text-right">
              {parkingName}
            </span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-zinc-500">Fecha y Hora:</span>
            <span className="font-semibold text-zinc-900 dark:text-white text-right">
              {formatReservationDate(reservation.startTime)}
            </span>
          </div>
          {spaceCode && (
            <div className="flex justify-between gap-2">
              <span className="text-zinc-500">Plaza:</span>
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                #{spaceCode}
              </span>
            </div>
          )}
          {vehiclePlate && (
            <div className="flex justify-between gap-2">
              <span className="text-zinc-500">Vehículo:</span>
              <span className="font-mono font-bold uppercase text-zinc-900 dark:text-white">
                {vehiclePlate}
              </span>
            </div>
          )}
        </div>

        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs">
          La plaza asignada quedará disponible de inmediato para otros conductores.
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
          >
            Volver
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/25 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
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
  );
}

