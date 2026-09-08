import axios from "axios";
import type { Service, ServiceInput } from '../types/Service.js';
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

export const getService = (serviceId: string) =>
  api.get(`/api/service-catalog/${serviceId}`).then(res => res.data);
export const getServices = () =>
  api.get(`/api/service-catalog`).then(res => res.data);
export const createService = (data: ServiceInput) =>
  api.post(`/api/service-catalog`,data).then(res => res.data);
export const updateService = (serviceId: string, data: ServiceInput) =>
  api.patch(`/api/service-catalog/${serviceId}`,data).then(res => res.data);
export const removeService = (serviceId: string) =>
  api.delete(`/api/service-catalog/${serviceId}`).then(res => res.data);

