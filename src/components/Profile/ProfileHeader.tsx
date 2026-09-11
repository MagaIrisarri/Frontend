import React from 'react';
import { ArrowLeft, LogOut } from 'lucide-react';
import { ThemeToggle } from '../shared/ThemeToggle';
import type { ProfileProps } from '../../hooks/useProfile';

export const ProfileHeader: React.FC<ProfileProps> = ({
  backNavigation,
  handleLogout,
  navigate,
}) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-zinc-800/80 pb-5">
      <button
        onClick={() => navigate(backNavigation.path)}
        className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>{backNavigation.label}</span>
      </button>

      <div className="flex items-center gap-3">
        <ThemeToggle />
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 font-semibold text-xs transition-colors cursor-pointer"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
};

