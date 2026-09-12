import React from 'react';
import { Car, Bike, Truck } from 'lucide-react';
import type { ParkingSpaceEditProps } from '../../hooks/useParkingSpaceEdit';

export const ParkingSpaceToolbar: React.FC<ParkingSpaceEditProps> = ({
  vehicleFilter,
  setVehicleFilter,
  statusFilter,
  setStatusFilter,
  filteredSpaces,
}) => {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Filtros de Tipo de Vehículo */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mr-1">
          Vehículo:
        </span>
        <button
          type="button"
          onClick={() => setVehicleFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
            vehicleFilter === 'all'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700'
          }`}
        >
          Todas
        </button>
        <button
          type="button"
          onClick={() => setVehicleFilter('Auto')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
            vehicleFilter === 'Auto'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700'
          }`}
        >
          <Car className="h-3.5 w-3.5" />
          <span>Autos</span>
        </button>
        <button
          type="button"
          onClick={() => setVehicleFilter('Moto')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
            vehicleFilter === 'Moto'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700'
          }`}
        >
          <Bike className="h-3.5 w-3.5" />
          <span>Motos</span>
        </button>
        <button
          type="button"
          onClick={() => setVehicleFilter('Camioneta')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
            vehicleFilter === 'Camioneta'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700'
          }`}
        >
          <Truck className="h-3.5 w-3.5" />
          <span>Utilitarios</span>
        </button>
      </div>

      {/* Filtros de Estado & Leyenda */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
            Estado:
          </span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs font-semibold text-slate-900 dark:text-white outline-none cursor-pointer"
          >
            <option value="all">Todas ({filteredSpaces.length})</option>
            <option value="LIBRE">Libres</option>
            <option value="OCUPADO">Ocupadas</option>
            <option value="MANTENIMIENTO">En Mantenimiento</option>
          </select>
        </div>

        {/* Leyenda de Estados */}
        <div className="hidden lg:flex items-center gap-3 text-[11px] font-medium text-slate-500 dark:text-zinc-400 border-l border-slate-200 dark:border-zinc-800 pl-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Libre
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> Ocupada
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Mantenimiento
          </span>
        </div>
      </div>
    </div>
  );
};

