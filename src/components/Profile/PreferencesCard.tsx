import React from 'react';
import { BellRing, CheckCircle2 } from 'lucide-react';
import type { ProfileProps } from '../../hooks/useProfile';

export const PreferencesCard: React.FC<ProfileProps> = ({
  preferences,
  handleTogglePref,
}) => {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4 flex flex-col justify-between">
      <div className="space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-zinc-800/80 pb-3.5">
          <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
            <BellRing className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Preferencias y Notificaciones</h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">Alertas operativas de tus cocheras</p>
          </div>
        </div>

        <div className="space-y-3.5">
          {/* Item 1: Ocupación 100% */}
          <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800">
            <div>
              <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">Alerta de Capacidad Total</p>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">Avisar cuando una cochera alcance el 100% de ocupación</p>
            </div>
            <button
              type="button"
              onClick={() => handleTogglePref('alertFullCapacity')}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                preferences.alertFullCapacity ? 'bg-blue-600' : 'bg-slate-300 dark:bg-zinc-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  preferences.alertFullCapacity ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Item 2: Nuevas Reservas */}
          <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800">
            <div>
              <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">Nuevas Reservas</p>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">Notificación inmediata al confirmarse una nueva reserva</p>
            </div>
            <button
              type="button"
              onClick={() => handleTogglePref('alertNewBooking')}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                preferences.alertNewBooking ? 'bg-blue-600' : 'bg-slate-300 dark:bg-zinc-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  preferences.alertNewBooking ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Item 3: Tarifas */}
          <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-100 dark:border-zinc-800">
            <div>
              <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">Avisos de Tarifas</p>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">Recordatorio para sucursales sin tarifas vigentes</p>
            </div>
            <button
              type="button"
              onClick={() => handleTogglePref('alertTariffExpiring')}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                preferences.alertTariffExpiring ? 'bg-blue-600' : 'bg-slate-300 dark:bg-zinc-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  preferences.alertTariffExpiring ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Nota sutil con icono informativo al pie para equilibrar altura con Datos Fiscales */}
      <div className="pt-3 border-t border-slate-100 dark:border-zinc-800/80 flex items-start gap-2 text-slate-500 dark:text-zinc-400 text-xs">
        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
        <span>Los ajustes de notificaciones se actualizan automáticamente al cambiar cada switch.</span>
      </div>
    </div>
  );
};

