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
  reassigned?: number; // al guardar: reservas que pasaron al empleado de turno (R-06)
}

export interface Holiday {
  id: string;
  date: string;
  name: string;
  origin: 'oficial' | 'manual';
  scope: 'nacional' | 'propio'; // nacional: lo carga el administrador; propio: lo ve solo su dueño (R-10)
  open?: boolean; // solo cuando se pide con parkingId; por defecto true (la sucursal trabaja)
}

// Detalle de un 409 de turnos/feriados (R-05, R-06, R-10).
export interface ScheduleConflict {
  reservationId: string;
  from?: string;
  to?: string;
  employeeId?: string | null;
  kind: 'cobertura' | 'empleado' | 'cierre';
}
