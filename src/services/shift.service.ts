import axios from 'axios';
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

export const getShiftsByEmployee = (employeeId: string) => 
  api.get(`/api/shifts/employee/${employeeId}`).then(res => res.data.data);

export const createShift = (payload: any) =>
  api.post('/api/shifts', payload).then(res => res.data.data);

export const getCoverage = (parkingId: string, dayOfWeek: string) =>
  api.get(`/api/shifts/coverage/${parkingId}/${dayOfWeek}`).then(res => res.data.data);

