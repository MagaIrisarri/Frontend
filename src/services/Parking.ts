import axios from "axios";
import type { Parking, CreateParkingInput } from '../types/Parking.ts';
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

export const getParking = () => api.get('/api/parkings/active').then(res => res.data.data);
export const getPriceParking = (id: string, vehicleType: string) =>
  api.get(`/api/parkings/${id}/prices/active/${vehicleType}`).then(res => res.data);
export const getOneParking = (id: string) => api.get(`/api/parkings/${id}`).then(res => res.data);
export const getParkingsByOwner = (idOwner: string) => api.get(`/api/parkings/owner/${idOwner}`).then(res => res.data);
export const createParking = (data: CreateParkingInput) => api.post(`/api/parkings`, data).then(res => res.data); 