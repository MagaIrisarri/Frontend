import React from 'react';
import { Lock, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import type { ProfileProps } from '../../hooks/useProfile';

export const SecurityDataCard: React.FC<ProfileProps> = ({
  passwordForm,
  setPasswordForm,
  showCurrentPassword,
  setShowCurrentPassword,
  showNewPassword,
  setShowNewPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  passwordError,
  passwordLoading,
  handleSavePassword,
}) => {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
      <div className="flex items-center gap-3 border-b border-slate-100 dark:border-zinc-800/80 pb-3.5">
        <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
          <Lock className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Seguridad y Contraseña</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">Actualizá tu clave de acceso</p>
        </div>
      </div>

      {passwordError && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{passwordError}</span>
        </div>
      )}

      <form onSubmit={handleSavePassword} className="space-y-3.5">
        {/* Contraseña Actual */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Contraseña Actual</label>
          <div className="relative">
            <input
              type={showCurrentPassword ? 'text' : 'password'}
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              required
              placeholder="••••••••"
              className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950/60 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
            >
              {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Nueva Contraseña */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Nueva Contraseña</label>
          <div className="relative">
            <input
              type={showNewPassword ? 'text' : 'password'}
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              required
              placeholder="Mínimo 6 caracteres"
              className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950/60 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
            >
              {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Confirmar Nueva Contraseña */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Confirmar Nueva Contraseña</label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              required
              placeholder="Repetí la contraseña"
              className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950/60 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={passwordLoading}
          className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer mt-1"
        >
          {passwordLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          <span>Actualizar Contraseña</span>
        </button>
      </form>
    </div>
  );
};

