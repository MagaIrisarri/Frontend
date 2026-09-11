import React from 'react';
import { Mail, Building2 } from 'lucide-react';
import type { ProfileProps } from '../../hooks/useProfile';

export const ProfileIdentityCard: React.FC<ProfileProps> = ({
  personalData,
  roleBadge,
  userInitials,
  isOwner,
  parkingsCount,
}) => {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
      <div className="flex items-center gap-4 sm:gap-5">
        <div className="h-16 w-16 sm:h-18 sm:w-18 rounded-2xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-2xl sm:text-3xl border border-blue-500/20 shadow-inner shrink-0">
          {userInitials}
        </div>
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {personalData.name} {personalData.last_name}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              {roleBadge}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5" />
            {personalData.email}
          </p>
        </div>
      </div>

      {isOwner && (
        <div className="flex items-center gap-3 bg-slate-100 dark:bg-zinc-800/70 border border-slate-200 dark:border-zinc-700/60 px-4 py-3 rounded-xl self-start md:self-auto">
          <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0" />
          <div>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">Sucursales Activas</p>
            <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              {parkingsCount !== null ? (
                <span className="font-bold text-slate-900 dark:text-white">
                  {parkingsCount} {parkingsCount === 1 ? 'sucursal' : 'sucursales'}
                </span>
              ) : (
                <div className="animate-pulse bg-slate-200 dark:bg-zinc-700 rounded h-4 w-24 my-0.5" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

