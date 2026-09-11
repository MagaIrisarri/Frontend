import React from 'react';
import { X, Layers, AlertCircle, Loader2 } from 'lucide-react';
import type { ParkingSpaceEditProps } from '../../hooks/useParkingSpaceEdit';

export const AddSpaceModal: React.FC<ParkingSpaceEditProps> = ({
  isAddModalOpen,
  setIsAddModalOpen,
  newSpaceCode,
  setNewSpaceCode,
  newSpaceVehicleType,
  setNewSpaceVehicleType,
  isCreatingSpace,
  addModalError,
  handleCreateSpace,
}) => {
  if (!isAddModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white">
            <Layers className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-bold text-base">Nueva Plaza</h3>
          </div>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {addModalError && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{addModalError}</span>
          </div>
        )}

        <form onSubmit={handleCreateSpace} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Identificador / Número de Plaza
            </label>
            <input
              type="text"
              value={newSpaceCode}
              onChange={(e) => setNewSpaceCode(e.target.value)}
              placeholder="Ej: A-01, P-14, M-02"
              required
              autoFocus
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-slate-900 dark:text-white font-mono uppercase text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Tipo de Vehículo
            </label>
            <select
              value={newSpaceVehicleType}
              onChange={(e) => setNewSpaceVehicleType(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-slate-900 dark:text-white text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition cursor-pointer"
            >
              <option value="Auto">Auto / Sedán</option>
              <option value="Moto">Moto</option>
              <option value="Camioneta">Camioneta / Utilitario</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isCreatingSpace}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition cursor-pointer"
            >
              {isCreatingSpace && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Crear Plaza</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

