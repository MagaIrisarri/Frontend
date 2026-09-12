export type VehicleFilterType = 'MOTO' | 'AUTO' | 'CAMIONETA';

export interface MapFilters {
  vehicleType: VehicleFilterType | null;
  // Preparado para extensiones futuras:
  maxPrice?: number | null;
  onlyAvailable?: boolean;
  minAvailableSpaces?: number;
  services?: string[];
  maxDistanceKm?: number;
}

export const DEFAULT_MAP_FILTERS: MapFilters = {
  vehicleType: null,
};

