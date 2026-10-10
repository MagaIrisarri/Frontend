// Calendario por fecha del rol dueño (backend: /api/shifts/day, /api/holidays).
export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

export interface DayShift { employeeId: string; from: string; to: string }
export interface DayClosure { from: string; to: string }
export interface Transfer { fromEmployeeId: string; toEmployeeId: string }

export interface ResolvedDay {
  parkingId: string;
  date: string; // YYYY-MM-DD
  source: 'exception' | 'holiday-closed' | 'template';
  modified: boolean; // D-01: etiqueta "Modificado"
  editable: boolean; // R-09
  holiday: { id: string; name: string; open: boolean } | null;
  shifts: DayShift[];
  closures: DayClosure[];
}

export interface Holiday {
  id: string;
  date: string;
  name: string;
  origin: 'oficial' | 'manual';
  open?: boolean; // solo cuando se pide con parkingId
}

// Detalle de un 409 de turnos/feriados (R-05, R-06, R-10).
export interface ScheduleConflict {
  reservationId: string;
  from?: string;
  to?: string;
  employeeId?: string | null;
  kind: 'cobertura' | 'empleado' | 'cierre';
}
