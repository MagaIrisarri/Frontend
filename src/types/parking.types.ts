export interface Parking {
  id: string;
  province?: string | null; // las sucursales previas pueden no tenerla
  locality: string;
  neighborhood?: string | null; // barrio o zona (Centro, Pichincha…)
  postalCode: string;
  address: string;
  // R-30: plazas y tarifas por tipo de vehículo (la capacidad es la cantidad de plazas activas de cada tipo).
  spaceTypes?: SpaceType[];
  totalCapacity?: number;
  availableSpaces?: number;
  openingTime: string;
  closingTime: string;
  minReservationHours: number;
  maxReservationHours: number;
  reservationMargin: number; // minutos libres entre reservas de la misma plaza
  isActive: boolean;
  walkInOnly?: boolean; // L-44: pausada solo para reservas online; sigue en el mapa y atiende en el lugar
  state?: string;
  name: string;
  latitude: number; 
  longitude: number;
  image?: string;
  imageUrl?: string;
  prices?: ParkingPriceRow[];
  services?: any[];
}

// Tipo de vehículo tal como lo usan los filtros y las pantallas (id del catálogo del administrador y su nombre).
export interface VehicleTypeRef { id: string; name: string }

// Plazas de un tipo en la cochera: capacidad, libres ahora y en mantenimiento.
export interface SpaceType { vehicleTypeId: string; name: string; capacity: number; available: number; maintenance: number }

// Tarifa vigente de un tipo.
export interface ParkingPriceRow { id: string; vehicleTypeId: string; vehicleType: string; price: number }

export interface CreateParkingInput {
  province?: string | null; // las sucursales previas pueden no tenerla
  locality: string;
  neighborhood?: string | null;
  postalCode: string;
  address: string;
  spaces: { vehicleTypeId: string; quantity: number }[]; // plazas iniciales por tipo (R-30)
  openingTime: string;
  closingTime: string;
  minReservationHours: number;
  maxReservationHours: number;
  reservationMargin: number;
  name: string;
  latitude: number; 
  longitude: number;
  image?: string;
  imageUrl?: string;
  ownerId?: string;
}

// Sin capacidades: después del alta, las plazas se gestionan desde la pestaña Plazas (R-18).
export interface UpdateParkingInput {
  province?: string | null; // las sucursales previas pueden no tenerla
  locality: string;
  neighborhood?: string | null;
  postalCode: string;
  address: string;
  openingTime: string;
  closingTime: string;
  minReservationHours: number;
  maxReservationHours: number;
  reservationMargin: number;
  name: string;
  latitude: number; 
  longitude: number;
  image?: string;
  imageUrl?: string;
}


  



