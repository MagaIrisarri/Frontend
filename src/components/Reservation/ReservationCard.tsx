import React from 'react';
import { Clock, MapPin, Car, Trash2, Sparkles } from 'lucide-react';
import type { Reservation } from '../../types/reservation.types';
import { ReservationStatusBadge } from '../Shared/ReservationStatusBadge';
import { formatReservationDate } from '../../utils/date';

export interface ReservationCardProps {
  reservation: Reservation;
  onCancel?: (reservation: Reservation) => void;
  showCancelButton?: boolean;
  className?: string;
}

export function ReservationCard({
  reservation,
  onCancel,
  showCancelButton = true,
  className = '',
}: ReservationCardProps) {
  const parkingName =
    reservation.parkingSpace?.parking?.name ||
    reservation.parking?.name ||
    'Estacionamiento';
  const parkingAddress =
    reservation.parkingSpace?.parking?.address ||
    reservation.parking?.address ||
    '';
  const spaceCode = reservation.parkingSpace?.spaceCode || reservation.spaceCode;

  const vehiclePlate = reservation.vehicle?.plate || reservation.plate;
  const brandName =
    reservation.vehicle?.brand?.name ||
    (typeof reservation.vehicle?.brand === 'string' ? reservation.vehicle.brand : null) ||
    reservation.brand;
  const modelName =
    reservation.vehicle?.model?.name ||
    (typeof reservation.vehicle?.model === 'string' ? reservation.vehicle.model : null) ||
    reservation.model;

  const services = reservation.services || [];

  const isFuture =
    !reservation.startTime ||
    isNaN(new Date(reservation.startTime).getTime()) ||
    new Date(reservation.startTime) > new Date();

  const isCancellable =
    (reservation.status === 'PENDIENTE' || reservation.status === 'CONFIRMADA') && isFuture;

  const canCancel = Boolean(showCancelButton && onCancel && isCancellable);

  return (
    <div
      className={`p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors shadow-sm ${className}`}
    >
      {/* Cabecera de la tarjeta: Nombre de la cochera, plaza y badge de estado */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2 flex-wrap">
            <span>{parkingName}</span>
            {spaceCode && (
              <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[11px] font-mono font-bold">
                Plaza #{spaceCode}
              </span>
            )}
          </h4>
          {parkingAddress && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1 mt-0.5">
              <MapPin className="h-3 w-3 text-blue-500 shrink-0" />
              <span>{parkingAddress}</span>
            </p>
          )}
        </div>
        <ReservationStatusBadge status={reservation.status} />
      </div>

      {/* Grid de tiempos y vehículo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-zinc-50/80 dark:bg-zinc-950/60 p-3 rounded-xl border border-zinc-200/70 dark:border-zinc-800/80">
        <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
          <Clock className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
          <div className="min-w-0">
            <span className="text-[10px] text-zinc-400 block font-medium">Desde</span>
            <span className="font-semibold truncate block">
              {formatReservationDate(reservation.startTime)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
          <Clock className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
          <div className="min-w-0">
            <span className="text-[10px] text-zinc-400 block font-medium">Hasta</span>
            <span className="font-semibold truncate block">
              {formatReservationDate(reservation.endTime)}
            </span>
          </div>
        </div>

        {vehiclePlate && (
          <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 sm:col-span-2 pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60 mt-1">
            <Car className="h-3.5 w-3.5 text-blue-500 shrink-0" />
            <span className="text-[11px] text-zinc-500 font-medium">Vehículo:</span>
            <span className="font-bold text-zinc-900 dark:text-white uppercase font-mono">
              {vehiclePlate}
            </span>
            {(brandName || modelName) && (
              <span className="text-zinc-500 text-[11px]">
                ({[brandName, modelName].filter(Boolean).join(' ')})
              </span>
            )}
          </div>
        )}
      </div>

      {/* Servicios extra si existen */}
      {services.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
          <span className="text-[10px] text-zinc-400 font-bold uppercase flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-amber-500" />
            Servicios:
          </span>
          {services.map((s, idx) => (
            <span
              key={s.id || idx}
              className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-semibold border border-amber-500/20"
            >
              {s.serviceCatalog?.name || s.name || 'Servicio'} (${s.price})
            </span>
          ))}
        </div>
      )}

      {/* Botón para dar de baja la reserva */}
      {canCancel && (
        <div className="pt-2 border-t border-zinc-200/70 dark:border-zinc-800 flex items-center justify-between">
          <span className="text-[11px] text-zinc-400">
            ¿No vas a utilizar la cochera?
          </span>
          <button
            type="button"
            onClick={() => onCancel?.(reservation)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-500/10 border border-red-500/20 transition-all cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Dar de baja</span>
          </button>
        </div>
      )}
    </div>
  );
}
