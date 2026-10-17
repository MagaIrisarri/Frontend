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
  excluded: number; // modelos destildados que quedaron no admitidos (al confirmar)
  // RA-26: descripciones del DNRPA nuevas (sin tipo en la tabla), con cuántos modelos nuevos traen y el tipo sugerido.
  // `notAdmitted`: se sugiere no admitirla (camión, remolque…).
  descriptions: { description: string; models: number; notAdmitted: boolean; suggested: { id: string; name: string } | null }[];
  // Todos los modelos nuevos; `key` es lo que se manda en `exclude` para no agregar ese modelo.
  newModels: { key: string; brand: string; model: string; description: string | null; type: string }[];
}
// Solo agrega marcas y modelos que faltan. Con dryRun el backend cuenta sin escribir (vista previa). Solo lo puede pedir un administrador.
// `typeMap`: el tipo elegido para cada descripción nueva (descripción → id de tipo, o null para no admitirla); sin elegir, va la sugerida.
// `exclude`: las `key` de los modelos nuevos destildados en la vista previa; al confirmar quedan no admitidos (L-33).
export const importCatalog = (items: { brand: string; model: string; type: string }[], dryRun: boolean, typeMap: Record<string, string | null> = {}, exclude: string[] = []): Promise<CatalogImportResult> =>
  api.post('/api/catalog/import', { items, dryRun, typeMap, exclude }).then(res => res.data.data);
// L-33: modelos no admitidos, que las importaciones omiten. Quitar uno lo vuelve a admitir.
export interface ExcludedModel { id: string; brand: string; model: string; createdAt: string }
export const getExcludedModels = (): Promise<ExcludedModel[]> => api.get('/api/catalog/excluded-models').then(res => res.data.data);
export const readmitModel = (id: string) => api.delete(`/api/catalog/excluded-models/${id}`).then(res => res.data);
export const createInsurance =(data: { name: string }) => api.post('/api/insurances', data).then(res => res.data);






