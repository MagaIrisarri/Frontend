import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, RefreshCw, ExternalLink, Calendar, User, LogOut } from 'lucide-react';
import { ThemeToggle } from '../shared/ThemeToggle';
import type { OwnerDashboardProps } from '../../hooks/useOwnerDashboard';

export const OwnerHeader: React.FC<OwnerDashboardProps> = ({
  userName,
  refreshing,
  handleRefresh,
  handleLogout,
  navigate,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-zinc-900/95 border-b border-slate-200 dark:border-zinc-800 shadow-sm backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Identidad y Subtítulo encapsulados sin márgenes negativos ni absolute */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-600/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                Hola, {userName}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                Panel de Dueño
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Monitoreo operativo y administración de sucursales en tiempo real
            </p>
          </div>
        </div>

        {/* Acciones de la cabecera */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 transition-colors cursor-pointer"
            title="Actualizar datos"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          {/* Botón Secundario: Ver en Mapa */}
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-xs font-semibold text-slate-800 dark:text-zinc-200 transition-colors cursor-pointer"
          >
            <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
            <span className="hidden md:inline">Ver en Mapa</span>
          </button>

          {/* Acceso a Planilla de Reservas */}
          <button
            type="button"
            onClick={() => navigate('/owner/reservations')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-xs font-semibold text-slate-800 dark:text-zinc-200 transition-colors cursor-pointer"
          >
            <Calendar className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span className="hidden md:inline">Planilla de Reservas</span>
          </button>

          {/* Mi Perfil */}
          <Link
            to="/profile"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-xs font-semibold text-slate-700 dark:text-zinc-300 transition-colors"
          >
            <User className="h-3.5 w-3.5 text-slate-500" />
            <span className="hidden sm:inline">Mi Perfil</span>
          </Link>

          <ThemeToggle />

          <button
            type="button"
            onClick={handleLogout}
            className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 transition-colors cursor-pointer"
            title="Cerrar sesión"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
