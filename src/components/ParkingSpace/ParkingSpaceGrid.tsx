import React from 'react';
import { Car, Bike, Truck } from 'lucide-react';
import { type ParkingSpaceEditProps, getCanonicalVehicleCategory } from '../../hooks/useParkingSpaceEdit';
import type { ParkingSpace } from '../../types/parkingSpace.types';

export const ParkingSpaceGrid: React.FC<ParkingSpaceEditProps> = ({
  filteredSpaces,
  sectors,
  selectedSpaceId,
  setSelectedSpaceId,
  setIsAddModalOpen,
}) => {
  const renderSpaceCard = (space: ParkingSpace) => {
    const isSelected = selectedSpaceId === space.id || selectedSpaceId === (space as any)._id;
    const state = space.state || 'LIBRE';
    const isLibre = state === 'LIBRE';
    const isOcupado = state === 'OCUPADO';

    const vCategory = getCanonicalVehicleCategory(space.vehicleType || (space as any).vehicle_type);
    const VehicleIcon = vCategory === 'Moto' ? Bike : vCategory === 'Camioneta' ? Truck : Car;

    return (
      <button
        key={space.id || (space as any)._id}
        type="button"
        onClick={() => setSelectedSpaceId(space.id || (space as any)._id)}
        className={`p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between h-28 cursor-pointer ${
          isSelected
            ? 'ring-2 ring-blue-600 border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 shadow-md scale-[1.02]'
            : isLibre
            ? 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 hover:border-emerald-500/50 hover:shadow-sm'
            : isOcupado
            ? 'bg-blue-50/30 dark:bg-blue-950/20 border-blue-200/80 dark:border-blue-900/40 hover:border-blue-400'
            : 'bg-amber-50/30 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-900/40 hover:border-amber-400'
        }`}
      >
        <div className="flex items-center justify-between w-full">
          <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
            {space.spaceCode || (space as any).id_parking_space || `#${space.id}`}
          </span>
          <div
            className={`p-1.5 rounded-lg ${
              isLibre
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : isOcupado
                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
            }`}
          >
            <VehicleIcon className="h-4 w-4" />
          </div>
        </div>

        <div className="space-y-1">
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 border ${
              isLibre
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                : isOcupado
                ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20'
                : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isLibre ? 'bg-emerald-500' : isOcupado ? 'bg-blue-600' : 'bg-amber-500'
              }`}
            />
            {isLibre ? 'Libre' : isOcupado ? 'Ocupada' : 'Mantenimiento'}
          </span>
        </div>
      </button>
    );
  };

  return (
    <div className="space-y-6">
      {filteredSpaces.length === 0 ? (
        <div className="p-12 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-center space-y-3">
          <p className="text-slate-500 dark:text-zinc-400 text-sm">
            No se encontraron plazas con los filtros seleccionados.
          </p>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 transition cursor-pointer"
          >
            + Crear nueva plaza
          </button>
        </div>
      ) : (
        <>
          {/* Sector Autos */}
          {sectors.autos.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                <Car className="h-4 w-4 text-blue-500" />
                <span>Sector Autos ({sectors.autos.length})</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {sectors.autos.map(renderSpaceCard)}
              </div>
            </div>
          )}

          {/* Sector Motos */}
          {sectors.motos.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                <Bike className="h-4 w-4 text-emerald-500" />
                <span>Sector Motos ({sectors.motos.length})</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {sectors.motos.map(renderSpaceCard)}
              </div>
            </div>
          )}

          {/* Sector Utilitarios */}
          {sectors.utilitarios.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                <Truck className="h-4 w-4 text-purple-500" />
                <span>Sector Utilitarios / Camionetas ({sectors.utilitarios.length})</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {sectors.utilitarios.map(renderSpaceCard)}
              </div>
            </div>
          )}

          {/* Otros Sectores */}
          {sectors.otros && sectors.otros.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                <Car className="h-4 w-4 text-amber-500" />
                <span>Otras Plazas ({sectors.otros.length})</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {sectors.otros.map(renderSpaceCard)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

