import axios from "axios";
import type { CreateParkingInput, UpdateParkingInput } from '../types/parking.types';
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

export const getParking = () => api.get('/api/parkings/active').then(res => res.data.data);
export const getPriceParking = (id: string, vehicleType: string) =>
  api.get(`/api/parkings/${id}/prices/active/${vehicleType}`).then(res => res.data);
// Panel del administrador: una página de cocheras (activas y pausadas) con dueño, ocupación en vivo y tarifas vigentes.
// El servidor busca, filtra por localidad y estado, y devuelve `meta` con el total, los conteos por estado y las localidades.
export const getParkingsPage = (query: Record<string, unknown>) =>
  api.get('/api/parkings', { params: query }).then(res => ({ data: res.data.data, meta: res.data.meta }));
export const getOneParking = (id: string) => api.get(`/api/parkings/${id}`).then(res => res.data);
export const getParkingsByOwner = (idOwner: string) => api.get(`/api/parkings/owner/${idOwner}`).then(res => res.data);
export const createParking = (data: CreateParkingInput) => api.post(`/api/parkings`, data).then(res => res.data); 
export const putParking = (data: UpdateParkingInput, id: string) => api.put(`/api/parkings/${id}`, data).then(res => res.data);
export const deleteParking = (id: string) => api.delete(`/api/parkings/${id}`).then(res => res.data);
export const createParkingPrice = (parkingId: string, data: any) => api.post('/api/parkings/' + parkingId + '/prices', data).then(res => res.data);
export const deleteParkingPrice = (priceId: string) => api.delete('/api/parkings/prices/' + priceId).then(res => res.data);
export const reactivateParking = (parkingId: string) => api.post('/api/parkings/' + parkingId + '/reactivate').then(res => res.data);
// Reservas por estado (PENDIENTE, CONFIRMADA, EN CURSO, FINALIZADA, CANCELADA) y facturación total de la sucursal.
export const getParkingMetrics = (parkingId: string) => api.get(`/api/parkings/${parkingId}/metrics`).then(res => res.data.data ?? res.data);
