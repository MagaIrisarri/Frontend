import React from 'react';
import {
  MoreVertical,
  DollarSign,
  Calendar,
  Sliders,
  Settings,
  MapPin,
  Car,
  Bike,
  Truck,
} from 'lucide-react';
import type { OwnerDashboardProps } from '../../hooks/useOwnerDashboard';

export const OwnerBranchGrid: React.FC<OwnerDashboardProps> = ({
  branchStats,
  activeMenuId,
  setActiveMenuId,
  setSelectedParkingForTariff,
  setIsTariffModalOpen,
  formatFriendlyAddress,
  navigate,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
      {branchStats.map(({ parking: p, capacity: cap, freeSpots, occPct }) => {
        const hasPrices = p.prices && p.prices.length > 0;
        const isEnabled = p.isActive && hasPrices;
        const addr = formatFriendlyAddress(p.address, p.locality);

        return (
          <div
            key={p.id}
            className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between gap-4 transition-all hover:border-slate-300 dark:hover:border-zinc-700 relative"
          >
            <div>
              {/* Estado y Menú de Acciones */}
              <div className="flex items-start justify-between gap-2">
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border flex items-center gap-1.5 ${
                    isEnabled
                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                      : !hasPrices
                      ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
                      : 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isEnabled ? 'bg-emerald-500' : !hasPrices ? 'bg-amber-500' : 'bg-zinc-500'
                    }`}
                  />
                  {isEnabled ? 'Habilitada' : !hasPrices ? 'Falta Tarifa' : 'Cerrada'}
                </span>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setActiveMenuId(activeMenuId === p.id ? null : p.id)}
                    className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>

                  {activeMenuId === p.id && (
                    <>
                      <div
                        className="fixed inset-0 z-30"
                        onClick={() => setActiveMenuId(null)}
                      />
                      <div className="absolute right-0 mt-1 w-52 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xl z-40 py-1.5 text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveMenuId(null);
                            setSelectedParkingForTariff(p);
                            setIsTariffModalOpen(true);
                          }}
                          className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-zinc-800 text-left font-medium text-slate-700 dark:text-zinc-200 cursor-pointer"
                        >
                          <DollarSign className="h-4 w-4 text-blue-500" />
                          <span>Configurar Tarifas</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveMenuId(null);
                            navigate(`/owner/reservations?parkingId=${p.id}`);
                          }}
                          className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-zinc-800 text-left font-medium text-slate-700 dark:text-zinc-200 cursor-pointer"
                        >
                          <Calendar className="h-4 w-4 text-purple-500" />
                          <span>Ver Reservas</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveMenuId(null);
                            navigate(`/parking-space/${p.id}`);
                          }}
                          className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-zinc-800 text-left font-medium text-slate-700 dark:text-zinc-200 cursor-pointer"
                        >
                          <Sliders className="h-4 w-4 text-emerald-500" />
                          <span>Distribución de Plazas</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveMenuId(null);
                            navigate(`/my-parkings/edit/${p.id}`);
                          }}
                          className="w-full flex items-center gap-2 px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-zinc-800 text-left font-medium text-slate-700 dark:text-zinc-200 cursor-pointer border-t border-slate-100 dark:border-zinc-800"
                        >
                          <Settings className="h-4 w-4 text-slate-400" />
                          <span>Editar Datos de Sucursal</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Nombre y Dirección con Tooltip Amigable */}
              <div className="mt-3">
                <h3 className="font-bold text-base text-slate-900 dark:text-white tracking-tight line-clamp-1">
                  {p.name}
                </h3>
                <p
                  title={addr.full}
                  className="text-xs text-slate-500 dark:text-zinc-400 flex items-center gap-1 mt-1 line-clamp-1 cursor-help hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <MapPin className="h-3 w-3 shrink-0 text-blue-500" />
                  <span>{addr.display}</span>
                </p>
              </div>

              {/* Indicador de Ocupación en Tiempo Real */}
              <div className="space-y-1.5 pt-3 mt-3 border-t border-slate-100 dark:border-zinc-800/80">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-zinc-400 font-medium">
                    Libres: <strong className="text-slate-900 dark:text-white">{freeSpots}</strong> / {cap}
                  </span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">{occPct}% ocupado</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      occPct >= 90 ? 'bg-red-500' : occPct >= 60 ? 'bg-amber-500' : 'bg-blue-600'
                    }`}
                    style={{ width: `${occPct}%` }}
                  />
                </div>
              </div>

              {/* Desglose de Plazas por Vehículo */}
              <div className="grid grid-cols-3 gap-1.5 bg-slate-50 dark:bg-zinc-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-zinc-800/80 mt-3 text-center">
                <div>
                  <p className="text-[10px] text-slate-500 dark:text-zinc-400 flex items-center justify-center gap-1">
                    <Car className="h-3 w-3 text-blue-500" /> Autos
                  </p>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{p.carCapacity || 0}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 dark:text-zinc-400 flex items-center justify-center gap-1">
                    <Bike className="h-3 w-3 text-emerald-500" /> Motos
                  </p>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{p.motorcycleCapacity || 0}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 dark:text-zinc-400 flex items-center justify-center gap-1">
                    <Truck className="h-3 w-3 text-purple-500" /> Utilit.
                  </p>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{p.truckCapacity || 0}</p>
                </div>
              </div>
            </div>

            {/* Botones de Acción Rápida */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800/80">
              <button
                type="button"
                onClick={() => {
                  setSelectedParkingForTariff(p);
                  setIsTariffModalOpen(true);
                }}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/60 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 text-xs font-semibold transition cursor-pointer"
              >
                <DollarSign className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                <span>Tarifas</span>
              </button>

              <button
                type="button"
                onClick={() => navigate(`/parking-space/${p.id}`)}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/60 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 text-xs font-semibold transition cursor-pointer"
              >
                <Sliders className="h-3.5 w-3.5 text-slate-500 dark:text-zinc-400" />
                <span>Plazas</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

