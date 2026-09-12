import axios from "axios";
import type { Parking, CreateParkingInput, UpdateParkingInput } from '../types/parking.types';
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

export const getParking = () => api.get('/api/parkings/active').then(res => res.data.data);
export const getPriceParking = (id: string, vehicleType: string) =>
  api.get(`/api/parkings/${id}/prices/active/${vehicleType}`).then(res => res.data);
export const getOneParking = (id: string) => api.get(`/api/parkings/${id}`).then(res => res.data);
export const getParkingsByOwner = (idOwner: string) => api.get(`/api/parkings/owner/${idOwner}`).then(res => res.data);
export const createParking = (data: CreateParkingInput) => api.post(`/api/parkings`, data).then(res => res.data); 
export const putParking = (data: UpdateParkingInput, id: string) => api.put(`/api/parkings/${id}`, data).then(res => res.data);
export const deleteParking = (id: string) => api.delete(`/api/parkings/${id}`).then(res => res.data);
export const getParkingPrices = (parkingId: string) => api.get('/api/parkings/' + parkingId + '/prices').then(res => res.data.data || res.data);
export const createParkingPrice = (parkingId: string, data: any) => api.post('/api/parkings/' + parkingId + '/prices', data).then(res => res.data);
export const updateParkingPrice = (priceId: string, data: any) => api.put('/api/parkings/prices/' + priceId, data).then(res => res.data);
export const deleteParkingPrice = (priceId: string) => api.delete('/api/parkings/prices/' + priceId).then(res => res.data);
export const reactivateParking = (parkingId: string) => api.post('/api/parkings/' + parkingId + '/reactivate').then(res => res.data);
export const getParkingMetrics = (parkingId: string) => api.get('/api/parkings/' + parkingId + '/metrics').then(res => res.data.data || res.data);
