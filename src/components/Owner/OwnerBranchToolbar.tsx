import React from 'react';
import { LayoutGrid, List, Plus } from 'lucide-react';
import type { OwnerDashboardProps } from '../../hooks/useOwnerDashboard';

export const OwnerBranchToolbar: React.FC<OwnerDashboardProps> = ({
  parkings,
  viewMode,
  setViewMode,
  navigate,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
          Tus Sucursales ({parkings.length})
        </h2>
        <p className="text-xs text-slate-500 dark:text-zinc-400">
          Monitoreá el estado individual, configurá tarifas y gestioná plazas
        </p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {/* Selector de Vista: Tarjetas vs Tabla */}
        <div className="flex items-center bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl border border-slate-200 dark:border-zinc-700/60">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Vista de Cuadrícula"
          >
            <LayoutGrid className="h-4 w-4" />
            <span className="hidden sm:inline">Tarjetas</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              viewMode === 'table'
                ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Vista de Tabla Detallada"
          >
            <List className="h-4 w-4" />
            <span className="hidden sm:inline">Tabla</span>
          </button>
        </div>

        {/* Botón Registrar Sucursal */}
        <button
          type="button"
          onClick={() => navigate('/my-parkings/create')}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-sm active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          <span>Registrar Nueva Sucursal</span>
        </button>
      </div>
    </div>
  );
};

