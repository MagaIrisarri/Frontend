export type VehicleFilterType = 'MOTO' | 'AUTO' | 'CAMIONETA';

export interface MapFilters {
  vehicleType: VehicleFilterType | null;
  // Preparado para extensiones futuras:
  maxPrice?: number | null; // $ por hora; con vehículo elegido compara su tarifa, sin vehículo la menor
  sort?: 'price-asc' | 'price-desc' | null;
  onlyAvailable?: boolean;
  minAvailableSpaces?: number;
  services?: string[];
  maxDistanceKm?: number;
}

export const DEFAULT_MAP_FILTERS: MapFilters = {
  vehicleType: null,
};

