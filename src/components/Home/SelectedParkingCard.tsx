import React from 'react';
import { X, Star, MapPin, Clock, ChevronRight } from 'lucide-react';
import type { Parking } from '../../types/Parking';
import type { VehicleFilterType } from '../../types/MapFilters';
import { matchesVehicleCategory } from '../../utils/parkingPriceUtils';

interface SelectedParkingCardProps {
  selectedParking: Parking | null;
  setSelectedParkingId: (id: string | null) => void;
  favoriteIds: string[];
  toggleFavorite: (id: string) => void;
  filters: { vehicleType: VehicleFilterType | null };
  handleOpenReservation: (parking: Parking) => void;
}

const DEFAULT_PARKING_IMAGE =
  'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=600&q=80';

export const SelectedParkingCard: React.FC<any> = (props: any) => {
  const {
    selectedParking,
    setSelectedParkingId,
    favoriteIds = [],
    toggleFavorite,
    filters = { vehicleType: null },
    handleOpenReservation,
  } = props;

  if (!selectedParking) return null;

  return (
    <div className="absolute bottom-6 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-30 animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-white/95 dark:bg-zinc-900/95 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-4 shadow-2xl flex flex-col gap-3.5 transition-colors">
        <div className="flex gap-3.5">
          <div className="relative w-24 h-24 rounded-2xl overflow-hidden shrink-0 bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
            <img
              src={selectedParking.imageUrl || selectedParking.image || DEFAULT_PARKING_IMAGE}
              alt={selectedParking.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = DEFAULT_PARKING_IMAGE;
              }}
            />
            <button
              type="button"
              onClick={() => toggleFavorite(selectedParking.id)}
              className="absolute top-1.5 left-1.5 p-1.5 rounded-full bg-black/60 text-white hover:scale-110 transition-transform cursor-pointer"
              title={favoriteIds.includes(selectedParking.id) ? 'Quitar de favoritos' : 'Guardar en favoritos'}
            >
              <Star className={`h-3.5 w-3.5 ${favoriteIds.includes(selectedParking.id) ? 'fill-amber-400 text-amber-400' : 'text-white'}`} />
            </button>
          </div>

          <div className="flex-1 min-w-0 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-base font-bold text-zinc-900 dark:text-white line-clamp-2 leading-snug">
                  {selectedParking.name}
                </h3>
                <button
                  type="button"
                  onClick={() => setSelectedParkingId(null)}
                  className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white p-0.5 rounded-lg transition-colors cursor-pointer shrink-0 mt-0.5"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 mt-1 truncate">
                <MapPin className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                {selectedParking.address}, {selectedParking.locality}
              </p>
            </div>

            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-[11px] font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                <Clock className="h-3 w-3 text-zinc-400" />
                {selectedParking.openingTime} - {selectedParking.closingTime} hs
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1.5 text-center text-[11px]">
          <div className="p-1.5 rounded-xl bg-blue-50/80 dark:bg-[#161F30] border border-blue-200/60 dark:border-blue-900/50">
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium block">🚗</span>
            <span className="font-extrabold text-blue-600 dark:text-blue-400">
              {selectedParking.availableCarSpaces ?? selectedParking.carCapacity ?? 0}
            </span>
            <span className="text-[10px] text-zinc-400 font-normal"> / {selectedParking.carCapacity ?? 0}</span>
          </div>
          <div className="p-1.5 rounded-xl bg-purple-50/80 dark:bg-[#161F30] border border-purple-200/60 dark:border-purple-900/50">
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium block">🛵</span>
            <span className="font-extrabold text-purple-600 dark:text-purple-400">
              {selectedParking.availableMotorcycleSpaces ?? selectedParking.motorcycleCapacity ?? 0}
            </span>
            <span className="text-[10px] text-zinc-400 font-normal"> / {selectedParking.motorcycleCapacity ?? 0}</span>
          </div>
          <div className="p-1.5 rounded-xl bg-emerald-50/80 dark:bg-[#161F30] border border-emerald-200/60 dark:border-emerald-900/50">
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium block">🛻</span>
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
              {selectedParking.availableTruckSpaces ?? selectedParking.truckCapacity ?? 0}
            </span>
            <span className="text-[10px] text-zinc-400 font-normal"> / {selectedParking.truckCapacity ?? 0}</span>
          </div>
        </div>

        {selectedParking.prices && selectedParking.prices.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {selectedParking.prices.map((pr: any) => {
              const isSelectedCategory = matchesVehicleCategory(pr.vehicleType, filters.vehicleType);
              const t = (pr.vehicleType || '').toUpperCase();
              const icon = t.includes('MOTO') ? '🛵' : t.includes('CAMION') || t.includes('UTIL') ? '🛻' : '🚗';
              const label = t.includes('MOTO') ? 'Moto' : t.includes('CAMION') || t.includes('UTIL') ? 'Camioneta' : 'Auto';
              return (
                <span
                  key={pr.id || pr.vehicleType}
                  className={`px-2 py-0.5 rounded-lg text-[11px] transition-all flex items-center gap-1 ${
                    isSelectedCategory
                      ? 'bg-blue-50 dark:bg-blue-950/60 border border-blue-400 dark:border-blue-600 text-blue-700 dark:text-blue-300 font-bold ring-1 ring-blue-500/30 shadow-sm'
                      : 'bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/60 text-zinc-700 dark:text-zinc-300 font-medium'
                  }`}
                >
                  <span>{icon} {label}:</span>
                  <span className={isSelectedCategory ? 'font-extrabold text-blue-900 dark:text-blue-100' : 'font-bold text-zinc-900 dark:text-white'}>
                    ${Number(pr.price).toLocaleString('es-AR')}/h
                  </span>
                  {isSelectedCategory && (
                    <span className="ml-0.5 text-[9px] px-1 py-0.2 rounded bg-blue-600 text-white font-extrabold uppercase tracking-wide">
                      Tu selección
                    </span>
                  )}
                </span>
              );
            })}
          </div>
        )}

        <button
          type="button"
          onClick={() => handleOpenReservation(selectedParking)}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/25 active:scale-98 transition-all cursor-pointer"
        >
          <span>Reservar en esta Cochera</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
