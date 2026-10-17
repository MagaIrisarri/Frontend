import { api } from './api';
import type { Holiday, ResolvedDay } from '../types/schedule.types';

// El dueño ve los nacionales y los propios; el administrador, los nacionales. Con parkingId cada feriado trae `open`
// para esa sucursal: por defecto trabaja, y con open = false se adhiere y cierra (R-10, D-09).
export const getHolidays = (year?: number, parkingId?: string): Promise<Holiday[]> =>
  api.get('/api/holidays', { params: { year, parkingId } }).then(res => res.data.data);

export const createHoliday = (date: string, name: string): Promise<Holiday> =>
  api.post('/api/holidays', { date, name }).then(res => res.data.data);

export const removeHoliday = (id: string) => api.delete(`/api/holidays/${id}`);

export const setHolidayOpen = (holidayId: string, parkingId: string, open: boolean): Promise<ResolvedDay> =>
  api.put(`/api/holidays/${holidayId}/parkings/${parkingId}`, { open }).then(res => res.data.data);

// L-12: diferencias con el calendario oficial (argentinadatos.com) desde hoy hasta fin del año próximo. `missing` son los
// nacionales de origen oficial que ya no figuran; `closures`, cuántas sucursales cierran ese día.
export interface OfficialHolidaysDiff {
  toAdd: { date: string; name: string }[];
  missing: { id: string; date: string; name: string; closures: number }[];
}

export const previewOfficialHolidays = (): Promise<OfficialHolidaysDiff> =>
  api.post('/api/holidays/import', { dryRun: true }).then(res => res.data.data);

// Agrega todas las fechas nuevas y quita las de `remove` (ids de `missing`).
export const importOfficialHolidays = (remove: string[]): Promise<{ added: number; removed: number }> =>
  api.post('/api/holidays/import', { dryRun: false, remove }).then(res => res.data.data);
