import React from 'react';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';

export type ReservationStatusType =
  | 'PENDIENTE'
  | 'CONFIRMADA'
  | 'EN CURSO'
  | 'FINALIZADA'
  | 'CANCELADA'
  | string;

export interface ReservationStatusBadgeProps {
  status: ReservationStatusType;
  className?: string;
  showIcon?: boolean;
}

export const ReservationStatusBadge: React.FC<ReservationStatusBadgeProps> = ({
  status,
  className = '',
  showIcon = true,
}) => {
  const normalized = (status || '').toUpperCase().trim();

  switch (normalized) {
    case 'EN CURSO':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 ${className}`}
        >
          {showIcon && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />}
          En Curso
        </span>
      );

    case 'CONFIRMADA':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 ${className}`}
        >
          {showIcon && <CheckCircle2 className="h-3 w-3 shrink-0" />}
          Confirmada
        </span>
      );

    case 'PENDIENTE':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 ${className}`}
        >
          {showIcon && <Clock className="h-3 w-3 shrink-0" />}
          Pendiente
        </span>
      );

    case 'FINALIZADA':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 ${className}`}
        >
          {showIcon && <CheckCircle2 className="h-3 w-3 text-zinc-400 shrink-0" />}
          Finalizada
        </span>
      );

    case 'CANCELADA':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 ${className}`}
        >
          {showIcon && <XCircle className="h-3 w-3 shrink-0" />}
          Cancelada
        </span>
      );

    default:
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700 ${className}`}
        >
          {status || 'Desconocido'}
        </span>
      );
  }
};

export default ReservationStatusBadge;

