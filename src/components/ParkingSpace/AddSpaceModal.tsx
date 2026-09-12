import React from 'react';
import { X, Layers, AlertCircle, Loader2, Plus, Minus, Info } from 'lucide-react';
import type { ParkingSpaceEditProps } from '../../hooks/useParkingSpaceEdit';

export const AddSpaceModal: React.FC<ParkingSpaceEditProps> = ({
  isAddModalOpen,
  setIsAddModalOpen,
  newSpaceCount,
  setNewSpaceCount,
  newSpaceVehicleType,
  setNewSpaceVehicleType,
  isCreatingSpace,
  addModalError,
  handleCreateSpace,
}) => {
  if (!isAddModalOpen) return null;

  const count = Number(newSpaceCount) || 1;

  const handleStep = (delta: number) => {
    setNewSpaceCount(Math.max(1, count + delta));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
          <div className="flex items-center gap-2.5 text-slate-900 dark:text-white">
            <div className="p-2 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Agregar Plazas</h3>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">Asignación automática correlativa</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(false)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
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

        <form onSubmit={handleCreateSpace} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
              Tipo de Vehículo
            </label>
            <select
              value={newSpaceVehicleType}
              onChange={(e) => setNewSpaceVehicleType(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-white text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition cursor-pointer"
            >
              <option value="Auto">Auto / Sedán (A-XX)</option>
              <option value="Moto">Moto (M-XX)</option>
              <option value="Camioneta">Camioneta / Utilitario (C-XX)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
              Cantidad de Plazas a Crear
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleStep(-1)}
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 transition cursor-pointer"
              >
                <Minus className="h-4 w-4" />
              </button>
              <input
                type="number"
                min="1"
                max="100"
                value={count}
                onChange={(e) => setNewSpaceCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-full text-center font-bold text-base py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600"
                required
              />
              <button
                type="button"
                onClick={() => handleStep(1)}
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 transition cursor-pointer"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {/* Accesos directos de cantidad rápida */}
            <div className="flex items-center gap-2 pt-1">
              {[1, 5, 10, 20].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setNewSpaceCount(num)}
                  className={`flex-1 py-1 text-[11px] font-semibold rounded-lg border transition cursor-pointer ${
                    count === num
                      ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  +{num}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 flex items-start gap-2.5">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-relaxed">
              Las plazas recibirán automáticamente el identificador correlativo disponible según el tipo elegido.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isCreatingSpace}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/20 transition cursor-pointer disabled:opacity-50"
            >
              {isCreatingSpace && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Generar {count} {count === 1 ? 'Plaza' : 'Plazas'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

