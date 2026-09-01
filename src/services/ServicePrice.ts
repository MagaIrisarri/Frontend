import axios from "axios";
import type { ServicePrice } from '../types/ServicePrice.js';
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

export const getParkingServices = (parkingId: string) =>
  api.get(`/api/parkings/${parkingId}/service-prices`).then(res => res.data);