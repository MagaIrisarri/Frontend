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
