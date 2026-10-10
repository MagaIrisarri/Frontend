import axios from 'axios';
import type { Holiday, ResolvedDay } from '../types/schedule.types';
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

// Con parkingId cada feriado trae `open` para esa sucursal (por defecto cierra, R-10).
export const getHolidays = (year?: number, parkingId?: string): Promise<Holiday[]> =>
  api.get('/api/holidays', { params: { year, parkingId } }).then(res => res.data.data);

export const createHoliday = (date: string, name: string): Promise<Holiday> =>
  api.post('/api/holidays', { date, name }).then(res => res.data.data);

export const removeHoliday = (id: string) => api.delete(`/api/holidays/${id}`);

export const setHolidayOpen = (holidayId: string, parkingId: string, open: boolean): Promise<ResolvedDay> =>
  api.put(`/api/holidays/${holidayId}/parkings/${parkingId}`, { open }).then(res => res.data.data);
