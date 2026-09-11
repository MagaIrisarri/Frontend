import React from 'react';
import { Activity, DollarSign, Calendar, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';
import type { OwnerDashboardProps } from '../../hooks/useOwnerDashboard';

export const OwnerKpis: React.FC<OwnerDashboardProps> = ({ kpiData }) => {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* KPI 1: Ocupación Actual */}
      <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
            Ocupación Actual
          </span>
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Activity className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              {kpiData.occupancyPercent}%
            </span>
            <span className="text-xs text-slate-500 dark:text-zinc-400">
              ({kpiData.occupiedSpaces} / {kpiData.totalCapacity} plazas)
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden mt-3">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${kpiData.occupancyPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* KPI 2: Ingresos Estimados */}
      <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
            Facturación Estimada
          </span>
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <DollarSign className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              ${kpiData.estimatedRevenue.toLocaleString('es-AR')}
            </span>
            {kpiData.hasRealRevenue && (
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                <TrendingUp className="h-3 w-3" />
                <span>Activa</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-2">
            {kpiData.hasRealRevenue ? 'Calculada sobre reservas activas' : 'Sin movimientos registrados hoy'}
          </p>
        </div>
      </div>

      {/* KPI 3: Reservas Activas */}
      <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
            Reservas Activas
          </span>
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <Calendar className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              {kpiData.activeReservationsCount}
            </span>
            <span className="text-xs text-slate-500 dark:text-zinc-400">en curso</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-2">
            Turnos ocupando cocheras en este momento
          </p>
        </div>
      </div>

      {/* KPI 4: Alertas Operativas */}
      <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
            Alertas Operativas
          </span>
          <div
            className={`p-2 rounded-xl ${
              kpiData.needsAttentionCount > 0
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {kpiData.needsAttentionCount > 0 ? (
              <AlertTriangle className="h-4 w-4" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              {kpiData.needsAttentionCount}
            </span>
            <span className="text-xs text-slate-500 dark:text-zinc-400">
              {kpiData.needsAttentionCount === 1 ? 'sucursal' : 'sucursales'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-2">
            {kpiData.needsAttentionCount > 0
              ? 'Sucursales requieren configurar tarifas'
              : 'Todas las sucursales 100% operativas'}
          </p>
        </div>
      </div>
    </section>
  );
};

