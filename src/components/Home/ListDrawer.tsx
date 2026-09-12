import React from 'react';
import { X, Star, MapPin, ArrowLeft, Clock, ChevronRight } from 'lucide-react';
import type { Parking } from '../../types/parking.types';
import type { VehicleFilterType } from '../../types/mapFilters.types';
import { formatSpotPrice, matchesVehicleCategory } from '../../utils/parkingPriceUtils';

interface ListDrawerProps {
  isListDrawerOpen: boolean;
  setIsListDrawerOpen: (v: boolean) => void;
  filteredParkings: Parking[];
  selectedParking: Parking | null;
  selectedParkingId: string | null;
  setSelectedParkingId: (id: string | null) => void;
  favoriteIds: string[];
  toggleFavorite: (id: string) => void;
  filters: { vehicleType: VehicleFilterType | null };
  handleOpenReservation: (parking: Parking) => void;
}

const DEFAULT_PARKING_IMAGE =
  'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=600&q=80';

export const ListDrawer: React.FC<any> = (props: any) => {
  const {
    isListDrawerOpen,
    selectedParking,
    setIsListDrawerOpen,
    filteredParkings = [],
    selectedParkingId,
    setSelectedParkingId,
    favoriteIds = [],
    toggleFavorite,
    filters = { vehicleType: null },
    handleOpenReservation,
  } = props;

  const isOpen = isListDrawerOpen || !!selectedParking;

  if (!isOpen) return null;

  return (
    <aside
      className="absolute top-20 right-4 bottom-6 z-30 w-[calc(100vw-2rem)] sm:w-96 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden will-change-transform transform-gpu animate-in slide-in-from-right duration-200 transition-all ease-out"
    >
      {selectedParking ? (
        /* VISTA DETALLADA DE LA COCHERA SELECCIONADA */
        <div className="flex flex-col h-full overflow-hidden animate-in fade-in duration-200">
          {/* Header con botón Volver y Cerrar */}
          <div className="p-3.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-white/80 dark:bg-zinc-900/80">
            <button
              type="button"
              onClick={() => setSelectedParkingId(null)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4 text-blue-500" />
              <span>Volver al listado</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedParkingId(null);
                setIsListDrawerOpen(false);
              }}
              className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Cerrar panel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Cuerpo con Scroll */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Foto principal con favorito */}
            <div className="relative w-full h-44 rounded-2xl overflow-hidden shrink-0 bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
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
                className="absolute top-2.5 left-2.5 p-2 rounded-full bg-black/60 text-white hover:scale-110 transition-transform cursor-pointer shadow-md"
                title={favoriteIds.includes(selectedParking.id) ? 'Quitar de favoritos' : 'Guardar en favoritos'}
              >
                <Star className={`h-4 w-4 ${favoriteIds.includes(selectedParking.id) ? 'fill-amber-400 text-amber-400' : 'text-white'}`} />
              </button>
            </div>

            {/* Título, dirección y horario */}
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white leading-snug">
                {selectedParking.name}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 mt-1.5">
                <MapPin className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                <span>{selectedParking.address}, {selectedParking.locality}</span>
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-[11px] font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Clock className="h-3 w-3 text-zinc-400" />
                  {selectedParking.openingTime} - {selectedParking.closingTime} hs
                </span>
              </div>
            </div>

            {/* Disponibilidad por categoría */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5">
                Disponibilidad de Plazas
              </p>
              <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                <div className="p-2 rounded-xl bg-blue-50/80 dark:bg-[#161F30] border border-blue-200/60 dark:border-blue-900/50">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium block">🚗 Auto</span>
                  <span className="font-extrabold text-blue-600 dark:text-blue-400 text-sm">
                    {selectedParking.availableCarSpaces ?? selectedParking.carCapacity ?? 0}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-normal"> / {selectedParking.carCapacity ?? 0}</span>
                </div>
                <div className="p-2 rounded-xl bg-purple-50/80 dark:bg-[#161F30] border border-purple-200/60 dark:border-purple-900/50">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium block">🛵 Moto</span>
                  <span className="font-extrabold text-purple-600 dark:text-purple-400 text-sm">
                    {selectedParking.availableMotorcycleSpaces ?? selectedParking.motorcycleCapacity ?? 0}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-normal"> / {selectedParking.motorcycleCapacity ?? 0}</span>
                </div>
                <div className="p-2 rounded-xl bg-emerald-50/80 dark:bg-[#161F30] border border-emerald-200/60 dark:border-emerald-900/50">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium block">🛻 Camioneta</span>
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                    {selectedParking.availableTruckSpaces ?? selectedParking.truckCapacity ?? 0}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-normal"> / {selectedParking.truckCapacity ?? 0}</span>
                </div>
              </div>
            </div>

            {/* Tarifas vigentes */}
            {selectedParking.prices && selectedParking.prices.length > 0 && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5">
                  Tarifas por hora
                </p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {selectedParking.prices.map((pr: any) => {
                    const isSelectedCategory = matchesVehicleCategory(pr.vehicleType, filters.vehicleType);
                    const t = (pr.vehicleType || '').toUpperCase();
                    const icon = t.includes('MOTO') ? '🛵' : t.includes('CAMION') || t.includes('UTIL') ? '🛻' : '🚗';
                    const label = t.includes('MOTO') ? 'Moto' : t.includes('CAMION') || t.includes('UTIL') ? 'Camioneta' : 'Auto';
                    return (
                      <span
                        key={pr.id || pr.vehicleType}
                        className={`px-2.5 py-1 rounded-xl text-xs transition-all flex items-center gap-1.5 ${
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
              </div>
            )}
          </div>

          {/* Footer Fijo con CTA de Reserva */}
          <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm shrink-0">
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
      ) : (
        /* VISTA DE LISTA DE ESTACIONAMIENTOS */
        <div className="flex flex-col h-full overflow-hidden animate-in fade-in duration-200">
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Estacionamientos ({filteredParkings.length})</h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Seleccioná uno para ver en el mapa y detalles</p>
            </div>
            <button
              type="button"
              onClick={() => setIsListDrawerOpen(false)}
              className="p-1 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Cerrar listado"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {filteredParkings.map((p: any) => {
              const isSelected = p.id === selectedParkingId;
              const isFav = favoriteIds.includes(p.id);
              const imgUrl = p.imageUrl || p.image || DEFAULT_PARKING_IMAGE;

              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedParkingId(p.id)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex gap-3 ${
                    isSelected
                      ? 'bg-zinc-100 dark:bg-zinc-800 border-blue-500 ring-1 ring-blue-500/40 shadow-lg shadow-blue-500/10'
                      : 'bg-zinc-50 dark:bg-zinc-950/60 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                >
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                    <img
                      src={imgUrl}
                      alt={p.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = DEFAULT_PARKING_IMAGE;
                      }}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(p.id);
                      }}
                      className="absolute top-1 left-1 p-1 rounded-full bg-black/60 text-white hover:scale-110 transition-transform cursor-pointer"
                      title={isFav ? 'Quitar de favoritos' : 'Guardar en favoritos'}
                    >
                      <Star className={`h-3 w-3 ${isFav ? 'fill-amber-400 text-amber-400' : 'text-white'}`} />
                    </button>
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-zinc-900 dark:text-white truncate">{p.name}</h4>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3 text-blue-500 shrink-0" />
                        {p.address}
                      </p>
                      <div className="flex items-center gap-1 flex-wrap mt-1.5">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-[#161F30] border border-blue-200/50 dark:border-blue-900/50 text-blue-600 dark:text-blue-400 font-bold" title="Plazas de Auto disponibles">
                          🚗 {p.availableCarSpaces ?? p.carCapacity ?? 0}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 dark:bg-[#161F30] border border-purple-200/50 dark:border-purple-900/50 text-purple-600 dark:text-purple-400 font-bold" title="Plazas de Moto disponibles">
                          🛵 {p.availableMotorcycleSpaces ?? p.motorcycleCapacity ?? 0}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-[#161F30] border border-emerald-200/50 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400 font-bold" title="Plazas de Camioneta disponibles">
                          🛻 {p.availableTruckSpaces ?? p.truckCapacity ?? 0}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="text-[11px] text-zinc-500 truncate">
                        {p.prices && p.prices.length > 0 ? (
                          <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                            <span className="font-extrabold text-zinc-900 dark:text-white">
                              {formatSpotPrice(p, filters.vehicleType).text}
                            </span>
                          </span>
                        ) : (
                          <span>{p.openingTime} - {p.closingTime} hs</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenReservation(p);
                        }}
                        className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        Reservar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
};

