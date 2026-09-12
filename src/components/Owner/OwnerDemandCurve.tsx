import React from 'react';
import { BarChart2 } from 'lucide-react';
import type { OwnerDashboardProps } from '../../hooks/useOwnerDashboard';

export const OwnerDemandCurve: React.FC<OwnerDashboardProps> = ({
  hourlyOccupancy,
  currentHour,
}) => {
  return (
    <section className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <BarChart2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Curva de Ocupación Diaria</h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400">Distribución de demanda por franja horaria</p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-500/20 self-start sm:self-auto">
          Pico estimado: 18:00 hs (95%)
        </span>
      </div>

      <div className="pt-6">
        <div className="grid grid-cols-8 gap-2 items-end h-36">
          {hourlyOccupancy.map((item, idx) => {
            const nextHourNum = hourlyOccupancy[idx + 1]?.hourNum ?? 24;
            const isCurrentSlot = currentHour >= item.hourNum && currentHour < nextHourNum;

            return (
              <div key={item.hour} className="flex flex-col items-center gap-2 h-full justify-end group relative">
                {isCurrentSlot && (
                  <span className="absolute -top-7 px-1.5 py-0.5 rounded-md text-[9px] font-black bg-blue-600 text-white shadow-md flex items-center gap-1 uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    Ahora
                  </span>
                )}
                <span
                  className={`text-[10px] font-bold transition-opacity ${
                    isCurrentSlot
                      ? 'text-blue-600 dark:text-blue-400 opacity-100'
                      : 'text-slate-600 dark:text-zinc-400 opacity-0 group-hover:opacity-100'
                  }`}
                >
                  {item.percent}%
                </span>
                <div
                  className={`w-full max-w-[48px] rounded-xl overflow-hidden h-full flex flex-col justify-end p-1 transition-all ${
                    isCurrentSlot
                      ? 'bg-blue-50 dark:bg-blue-950/50 ring-2 ring-blue-500/50 shadow-inner'
                      : 'bg-slate-100 dark:bg-zinc-800'
                  }`}
                >
                  <div
                    className={`w-full rounded-lg transition-all duration-500 ${
                      item.percent >= 85
                        ? 'bg-blue-600 shadow-md shadow-blue-600/30'
                        : item.percent >= 60
                        ? 'bg-blue-500/80'
                        : 'bg-blue-400/60'
                    }`}
                    style={{ height: `${item.percent}%` }}
                  />
                </div>
                <div className="flex items-center gap-1">
                  {isCurrentSlot && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping shrink-0" />}
                  <span
                    className={`text-[11px] font-semibold ${
                      isCurrentSlot ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {item.hour}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

