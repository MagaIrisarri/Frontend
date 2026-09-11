import React from 'react';
import { Receipt, Loader2 } from 'lucide-react';
import type { ProfileProps } from '../../hooks/useProfile';

export const FiscalDataCard: React.FC<ProfileProps> = ({
  fiscalData,
  setFiscalData,
  fiscalLoading,
  handleSaveFiscal,
}) => {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
      <div className="flex items-center gap-3 border-b border-slate-100 dark:border-zinc-800/80 pb-3.5">
        <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
          <Receipt className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Datos Fiscales / Facturación</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">Información para cobro de servicios</p>
        </div>
      </div>

      <form onSubmit={handleSaveFiscal} className="space-y-3.5">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Razón Social o Nombre Fantasía</label>
          <input
            type="text"
            value={fiscalData.businessName}
            onChange={(e) => setFiscalData({ ...fiscalData, businessName: e.target.value })}
            placeholder="Ej: Cocheras del Centro S.R.L."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950/60 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">CUIT / CUIL</label>
            <input
              type="text"
              value={fiscalData.cuit}
              onChange={(e) => setFiscalData({ ...fiscalData, cuit: e.target.value })}
              placeholder="30-XXXXXXXX-X"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950/60 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Condición IVA</label>
            <select
              value={fiscalData.vatCondition}
              onChange={(e) => setFiscalData({ ...fiscalData, vatCondition: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950/60 text-slate-900 dark:text-white text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all cursor-pointer"
            >
              <option value="Responsable Inscripto">Responsable Inscripto</option>
              <option value="Monotributo">Monotributo</option>
              <option value="Exento">Exento</option>
              <option value="Consumidor Final">Consumidor Final</option>
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Dirección Fiscal</label>
          <input
            type="text"
            value={fiscalData.fiscalAddress}
            onChange={(e) => setFiscalData({ ...fiscalData, fiscalAddress: e.target.value })}
            placeholder="Ej: Av. Corrientes 1234, CABA"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950/60 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={fiscalLoading}
          className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer mt-1"
        >
          {fiscalLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          <span>Guardar Datos Fiscales</span>
        </button>
      </form>
    </div>
  );
};

