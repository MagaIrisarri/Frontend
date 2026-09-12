import axios from "axios";
import type { ServicePrice } from '../types/servicePrice.types';
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

export const getParkingServices = (parkingId: string) =>
  api.get(`/api/parkings/${parkingId}/service-prices`).then(res => res.data);
export const getServiceCatalog = () => api.get('/api/service-catalog').then(res => res.data.data || res.data);
export const getServicePrices = (parkingId: string) => api.get('/api/parkings/' + parkingId + '/service-prices').then(res => res.data.data || res.data);
export const createServicePrice = (parkingId: string, data: any) => api.post('/api/parkings/' + parkingId + '/service-prices', data).then(res => res.data);
export const deleteServicePrice = (servicePriceId: string) => api.delete('/api/parkings/service-prices/' + servicePriceId).then(res => res.data);

export interface ServiceCatalogItem {
  id: string;
  name: string;
  description: string;
}
