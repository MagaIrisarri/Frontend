import { api } from './api';
import type { UpdateVehicle, CreateVehicle } from '@/types/vehicle.types.js';



export const getUserVehicle = (userId: string) => api.get(`/api/vehicles/client/${userId}`).then(res => res.data);
export const createVehicle = (userId: string, data: CreateVehicle) => api.post(`/api/vehicles/client/${userId}`, data).then(res => res.data);
export const updateVehicle = (id: string, data: UpdateVehicle) => api.put(`/api/vehicles/${id}`, data).then(res => res.data);
export const removeVehicle = (id: string) => api.delete(`/api/vehicles/${id}`).then(res => res.data);
export const getBrands = () => api.get('/api/brands').then(res => res.data);
export const getModels = (brandId?: string) => api.get('/api/models', { params: brandId ? { brandId } : undefined }).then(res => res.data);
export const getInsurances = () => api.get('/api/insurances').then(res => res.data);
export const getOneVehicle = (id: string) => api.get(`/api/vehicles/${id}`).then(res => res.data);
// Panel del administrador: todos los vehículos registrados y alta de aseguradoras.
export const getVehicles = () => api.get('/api/vehicles').then(res => res.data);
export interface CatalogImportResult {
  unique: number; brandsNew: number; modelsNew: number; reactivated: number; described: number; existing: number; skipped: number;
  // RA-26: descripciones del DNRPA nuevas (sin tipo en la tabla), con cuántos modelos nuevos traen y el tipo sugerido.
  descriptions: { description: string; models: number; suggested: { id: string; name: string } | null }[];
  sample: { brand: string; model: string; type: string }[];
}
// Solo agrega marcas y modelos que faltan. Con dryRun el backend cuenta sin escribir (vista previa). Solo lo puede pedir un administrador.
// `typeMap`: el tipo elegido para cada descripción nueva (descripción → id de tipo); sin elegir, va la sugerida.
export const importCatalog = (items: { brand: string; model: string; type: string }[], dryRun: boolean, typeMap: Record<string, string> = {}): Promise<CatalogImportResult> =>
  api.post('/api/catalog/import', { items, dryRun, typeMap }).then(res => res.data.data);
export const createInsurance =(data: { name: string }) => api.post('/api/insurances', data).then(res => res.data);






