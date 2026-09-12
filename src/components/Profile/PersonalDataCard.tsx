import React from 'react';
import { User, Lock, Loader2 } from 'lucide-react';
import type { ProfileProps } from '../../hooks/useProfile';

export const PersonalDataCard: React.FC<ProfileProps> = ({
  personalData,
  setPersonalData,
  personalLoading,
  handleSavePersonal,
}) => {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
      <div className="flex items-center gap-3 border-b border-slate-100 dark:border-zinc-800/80 pb-3.5">
        <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
          <User className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Datos Personales</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">Información básica y contacto</p>
        </div>
      </div>

      <form onSubmit={handleSavePersonal} className="space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Nombre</label>
            <input
              type="text"
              value={personalData.name}
              onChange={(e) => setPersonalData({ ...personalData, name: e.target.value })}
              required
              placeholder="Tu nombre"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950/60 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Apellido</label>
            <input
              type="text"
              value={personalData.last_name}
              onChange={(e) => setPersonalData({ ...personalData, last_name: e.target.value })}
              required
              placeholder="Tu apellido"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950/60 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all"
            />
          </div>
        </div>

        {/* Email con estilo read-only disabled discreto */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Correo Electrónico</label>
            <span className="text-[10px] text-slate-400 dark:text-zinc-500 flex items-center gap-1 font-medium">
              <Lock className="h-3 w-3" /> No editable
            </span>
          </div>
          <div className="relative">
            <input
              type="email"
              value={personalData.email}
              readOnly
              disabled
              placeholder="correo@ejemplo.com"
              className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-100/70 dark:bg-zinc-800/40 text-slate-500 dark:text-zinc-400 text-sm cursor-not-allowed select-none outline-none"
            />
            <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-zinc-500" />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Teléfono de Contacto</label>
          <input
            type="tel"
            value={personalData.phone}
            onChange={(e) => setPersonalData({ ...personalData, phone: e.target.value.replace(/\D/g, '') })}
            placeholder="Ej: 1123456789"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950/60 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={personalLoading}
          className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer mt-1"
        >
          {personalLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          <span>Guardar Datos Personales</span>
        </button>
      </form>
    </div>
  );
};

