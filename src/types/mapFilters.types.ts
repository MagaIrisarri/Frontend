import type { VehicleTypeRef } from './parking.types';

// R-30: el filtro es un tipo del catálogo (cualquiera que haya cargado el administrador), no una de tres categorías fijas.
export type VehicleFilterType = VehicleTypeRef;

export interface MapFilters {
  vehicleType: VehicleFilterType | null;
  // Preparado para extensiones futuras:
  maxPrice?: number | null; // $ por hora; con vehículo elegido compara su tarifa, sin vehículo la menor
  sort?: 'price-asc' | 'price-desc' | 'near' | null; // 'near': por distancia a la ubicación del usuario (solo con ubicación)
  locality?: string | null; // localityKey(): provincia y localidad, porque hay localidades homónimas
  onlyAvailable?: boolean;
  minAvailableSpaces?: number;
  services?: string[];
  maxDistanceKm?: number;
}

export const DEFAULT_MAP_FILTERS: MapFilters = {
  vehicleType: null,
};

