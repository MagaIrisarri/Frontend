import React from 'react';
import { cn } from '@/lib/utils';
import type { Parking } from '../../types/Parking.js';
import { Link } from 'react-router-dom';
import { MapPin, Clock } from 'lucide-react';

interface ParkingSpotCardProps {
  spot: Parking;
  selected: boolean;
  onSelect: (id: string) => void;
  price?: number;
  vehicleId?: string;
  vehicleType?: string;
}

const DEFAULT_PARKING_IMAGE =
  'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=400&q=80';

export function ParkingCard({
  spot,
  selected,
  onSelect,
  price,
  vehicleId,
  vehicleType,
}: ParkingSpotCardProps) {
  const imageUrl = spot.imageUrl || spot.image || DEFAULT_PARKING_IMAGE;

  return (
    <div
      onClick={() => onSelect(spot.id)}
      className={cn(
        'relative flex gap-3.5 p-3.5 rounded-2xl border cursor-pointer transition-all duration-200',
        selected
          ? 'border-blue-500 bg-zinc-800/90 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/50'
          : 'border-zinc-800 bg-zinc-900/80 hover:bg-zinc-850 hover:border-zinc-700'
      )}
    >
      {selected && (
        <div className="absolute top-2 bottom-2 left-0 w-1 bg-blue-500 rounded-r-full" />
      )}

      {/* Imagen */}
      <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-zinc-950 border border-zinc-800">
        <img
          src={imageUrl}
          alt={spot.name}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src = DEFAULT_PARKING_IMAGE;
          }}
        />
      </div>

      {/* Datos */}
      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div>
          <h3 className="text-sm font-bold text-white leading-tight truncate">
            {spot.name}
          </h3>
          <p className="text-xs text-zinc-400 flex items-center gap-1 mt-1 truncate">
            <MapPin className="h-3 w-3 shrink-0 text-blue-400" />
            {spot.address ? `${spot.address}, ${spot.locality || ''}` : spot.locality || 'Ubicación'}
          </p>
          {(spot.openingTime || spot.closingTime) && (
            <p className="text-[11px] text-zinc-500 flex items-center gap-1 mt-0.5">
              <Clock className="h-3 w-3 shrink-0" />
              {spot.openingTime} - {spot.closingTime} hs
            </p>
          )}
        </div>

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-800/60">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-semibold text-zinc-400">Tarifa</span>
            <span className="text-xs font-bold text-blue-400">
              {price !== undefined ? `$${price}/h` : 'Ver en detalle'}
            </span>
          </div>

          <Link
            state={{ vehicleId, vehicleType }}
            to={`/parkings/${spot.id}/reservar`}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium shadow-md shadow-blue-600/20 active:scale-95 transition-all inline-flex items-center justify-center"
          >
            Reservar
          </Link>
        </div>
      </div>
    </div>
  );
}