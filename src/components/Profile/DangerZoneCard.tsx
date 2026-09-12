import React from 'react';
import { Trash2, AlertCircle, Loader2 } from 'lucide-react';
import type { ProfileProps } from '../../hooks/useProfile';

export const DangerZoneCard: React.FC<ProfileProps> = ({
  confirmingDelete,
  setConfirmingDelete,
  deleteInput,
  setDeleteInput,
  deleteLoading,
  handleOpenDeleteModal,
  confirmDelete,
}) => {
  return (
    <>
      <div className="bg-red-50/40 dark:bg-red-950/15 border border-red-200/80 dark:border-red-900/30 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-xs sm:text-sm">
            <Trash2 className="h-4 w-4" />
            <span>Zona de Peligro</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
            Eliminar tu cuenta es una acción permanente: se darán de baja tus accesos a la plataforma y no podrás volver a iniciar sesión.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenDeleteModal}
          className="py-2.5 px-4 rounded-xl border border-red-500/40 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white dark:hover:bg-red-600 dark:hover:text-white text-xs font-semibold shadow-sm transition-all cursor-pointer shrink-0 self-start sm:self-auto"
        >
          Eliminar cuenta
        </button>
      </div>

      {/* Modal de confirmación con doble chequeo ("ELIMINAR") */}
      {confirmingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <div className="p-2.5 rounded-xl bg-red-100 dark:bg-red-950/50">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">¿Eliminar tu cuenta?</h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">Esta acción no se puede deshacer.</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 leading-relaxed">
              Se eliminarán tus datos de acceso de manera definitiva. Para confirmar, por favor escribí <strong className="text-red-600 dark:text-red-400 select-all font-mono">ELIMINAR</strong> a continuación:
            </p>

            <div className="space-y-1.5">
              <input
                type="text"
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
                placeholder='Escribí "ELIMINAR"'
                autoFocus
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-slate-900 dark:text-white placeholder-slate-400 text-sm font-mono outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={deleteLoading}
                onClick={() => setConfirmingDelete(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={deleteInput.trim() !== 'ELIMINAR' || deleteLoading}
                onClick={confirmDelete}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition shadow-sm cursor-pointer"
              >
                {deleteLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>Confirmar Eliminación</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

