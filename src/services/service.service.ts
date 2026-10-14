import { api } from './api';
import type { Service, ServiceInput } from '../types/service.types';

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

