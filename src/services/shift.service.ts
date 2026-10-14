import axios from 'axios';
import { api } from './api';
import type { DayClosure, DayOfWeek, DayShift, ResolvedDay, ScheduleConflict, Transfer } from '../types/schedule.types';

// ---- Calendario por fecha ----

export const getDay = (parkingId: string, date: string): Promise<ResolvedDay> =>
  api.get(`/api/shifts/day/${parkingId}/${date}`).then(res => res.data.data);

export const saveDay = (parkingId: string, date: string, body: { shifts: DayShift[]; closures: DayClosure[]; transfers?: Transfer[] }): Promise<ResolvedDay> =>
  api.put(`/api/shifts/day/${parkingId}/${date}`, body).then(res => res.data.data);

export const resetDay = (parkingId: string, date: string): Promise<ResolvedDay> =>
  api.delete(`/api/shifts/day/${parkingId}/${date}`).then(res => res.data.data);

export const getRange = (parkingId: string, from: string, to: string): Promise<ResolvedDay[]> =>
  api.get(`/api/shifts/range/${parkingId}`, { params: { from, to } }).then(res => res.data.data);

// Semana tipo de lunes a domingo.
export const getTemplate = (parkingId: string): Promise<({ dayOfWeek: DayOfWeek } & { shifts: DayShift[]; closures: DayClosure[] })[]> =>
  api.get(`/api/shifts/template/${parkingId}`).then(res => res.data.data);

export const saveTemplateDay = (parkingId: string, dayOfWeek: DayOfWeek, body: { shifts: DayShift[]; closures: DayClosure[]; transfers?: Transfer[] }) =>
  api.put(`/api/shifts/template/${parkingId}/${dayOfWeek}`, body).then(res => res.data.data);

// Reservas que bloquean un cambio (409), para ofrecer la transferencia (R-06).
export const conflictsOf = (err: unknown): ScheduleConflict[] =>
  (axios.isAxiosError(err) && err.response?.status === 409 && err.response.data?.details?.conflicts) || [];
