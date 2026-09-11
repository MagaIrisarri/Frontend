import React from 'react';
import { Building2, Car, Bike, Truck, DollarSign, Sliders, Edit } from 'lucide-react';
import type { OwnerDashboardProps } from '../../hooks/useOwnerDashboard';

export const OwnerBranchTable: React.FC<OwnerDashboardProps> = ({
  branchStats,
  setSelectedParkingForTariff,
  setIsTariffModalOpen,
  formatFriendlyAddress,
  navigate,
}) => {
  return (
    <div className="overflow-x-auto bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-800/40 text-slate-600 dark:text-zinc-400 font-bold uppercase tracking-wider">
            <th className="py-3.5 px-4">Sucursal</th>
            <th className="py-3.5 px-4">Dirección</th>
            <th className="py-3.5 px-4">Capacidad</th>
            <th className="py-3.5 px-4">Ocupación en Vivo</th>
            <th className="py-3.5 px-4">Estado</th>
            <th className="py-3.5 px-4 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
          {branchStats.map(({ parking: p, capacity: cap, freeSpots, occPct }) => {
            const hasPrices = p.prices && p.prices.length > 0;
            const isEnabled = p.isActive && hasPrices;
            const addr = formatFriendlyAddress(p.address, p.locality);

            return (
              <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-zinc-800/30 transition-colors">
                <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>{p.name}</span>
                  </div>
                </td>
                <td className="py-3.5 px-4 text-slate-600 dark:text-zinc-300">
                  <span title={addr.full} className="cursor-help hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    {addr.display}
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-3 text-slate-700 dark:text-zinc-300 font-semibold">
                    <span className="flex items-center gap-1" title="Autos">
                      <Car className="h-3.5 w-3.5 text-blue-500" /> {p.carCapacity || 0}
                    </span>
                    <span className="flex items-center gap-1" title="Motos">
                      <Bike className="h-3.5 w-3.5 text-emerald-500" /> {p.motorcycleCapacity || 0}
                    </span>
                    <span className="flex items-center gap-1" title="Utilitarios">
                      <Truck className="h-3.5 w-3.5 text-purple-500" /> {p.truckCapacity || 0}
                    </span>
                  </div>
                </td>
                <td className="py-3.5 px-4">
                  <div className="w-36 space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500 dark:text-zinc-400 font-medium">
                        Libres: <strong className="text-slate-900 dark:text-white">{freeSpots}</strong>/{cap}
                      </span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">{occPct}%</span>
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
                </td>
                <td className="py-3.5 px-4">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 border ${
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
                </td>
                <td className="py-3.5 px-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedParkingForTariff(p);
                        setIsTariffModalOpen(true);
                      }}
                      title="Configurar tarifas y servicios"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/60 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 font-semibold text-xs transition cursor-pointer"
                    >
                      <DollarSign className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                      <span>Tarifas</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(`/parking-space/${p.id}`)}
                      title="Gestionar distribución de plazas"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/60 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 font-semibold text-xs transition cursor-pointer"
                    >
                      <Sliders className="h-3.5 w-3.5 text-slate-500 dark:text-zinc-400" />
                      <span>Plazas</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(`/my-parkings/edit/${p.id}`)}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/60 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white transition cursor-pointer"
                      title="Editar Sucursal"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

