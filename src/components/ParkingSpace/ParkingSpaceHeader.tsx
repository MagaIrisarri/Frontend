import React from 'react';
import { ArrowLeft, Building2, ChevronDown, RefreshCw, Plus } from 'lucide-react';
import { ThemeToggle } from '../shared/ThemeToggle';
import type { ParkingSpaceEditProps } from '../../hooks/useParkingSpaceEdit';

export const ParkingSpaceHeader: React.FC<ParkingSpaceEditProps> = ({
  id,
  parking,
  ownerParkings,
  kpis,
  refreshing,
  handleRefresh,
  handleSelectParking,
  setIsAddModalOpen,
  navigate,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-zinc-900/95 border-b border-slate-200 dark:border-zinc-800 shadow-sm backdrop-blur-sm min-h-[72px] flex items-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 w-full flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Lado Izquierdo: Regreso, Título / Dropdown de Sucursales */}
        <div className="flex items-center gap-3 min-w-0 max-w-full md:max-w-[50%]">
          <button
            type="button"
            onClick={() => navigate('/owner')}
            className="p-2 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 transition-colors cursor-pointer shrink-0"
            title="Volver al Panel de Dueño"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0" />
              {ownerParkings.length > 1 ? (
                <div className="relative inline-block w-52 sm:w-64 max-w-full">
                  <select
                    value={id}
                    onChange={(e) => handleSelectParking(e.target.value)}
                    className="w-full appearance-none bg-transparent font-bold text-lg sm:text-xl text-slate-900 dark:text-white pr-7 truncate cursor-pointer outline-none hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {ownerParkings.map((op) => (
                      <option key={op.id} value={op.id} className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-white">
                        {op.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              ) : (
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white truncate max-w-[200px] sm:max-w-xs md:max-w-md">
                  {parking?.name || 'Distribución de Plazas'}
                </h1>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 truncate">
              Distribución y ocupación interactiva de cocheras
            </p>
          </div>
        </div>

        {/* Lado Derecho: Métricas y Acciones (Estabilidad total sin wraps en escritorio) */}
        <div className="shrink-0 flex items-center gap-2 sm:gap-3 flex-nowrap self-start md:self-auto overflow-x-auto max-w-full pb-1 md:pb-0">
          {/* Badges de KPIs */}
          <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-100 dark:bg-zinc-800/70 p-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-semibold shrink-0">
            <span className="px-2 py-1 rounded-lg bg-white dark:bg-zinc-700 shadow-xs text-slate-700 dark:text-zinc-200 whitespace-nowrap">
              Total: {kpis.total}
            </span>
            <span className="px-2 py-1 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
              Libres: {kpis.libres}
            </span>
            <span className="px-2 py-1 rounded-lg bg-blue-500/15 text-blue-700 dark:text-blue-400 whitespace-nowrap">
              Ocupadas: {kpis.ocupadas}
            </span>
            <span className="px-2 py-1 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-400 whitespace-nowrap">
              Mantenimiento: {kpis.mantenimiento}
            </span>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 transition-colors cursor-pointer shrink-0"
            title="Refrescar plazas"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          <div className="shrink-0">
            <ThemeToggle />
          </div>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 sm:gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm transition-all cursor-pointer shrink-0 whitespace-nowrap"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>+ Agregar Plaza</span>
          </button>
        </div>

      </div>
    </header>
  );
};
