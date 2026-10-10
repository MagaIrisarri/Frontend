export interface Parking {
  id: string;
  locality: string;
  postalCode: string;
  address: string;
  carCapacity: number;
  motorcycleCapacity: number;
  truckCapacity: number;
  openingTime: string;
  closingTime: string;
  minReservationHours: number;
  maxReservationHours: number;
  reservationMargin: number;
  isActive: boolean;
  state?: string;
  name: string;
  latitude: number; 
  longitude: number;
  image?: string;
  imageUrl?: string;
  prices?: any[];
  services?: any[];
  availableCarSpaces?: number;
  availableMotorcycleSpaces?: number;
  availableTruckSpaces?: number;
}

export interface CreateParkingInput {
  locality: string;
  postalCode: string;
  address: string;
  carCapacity: number;
  motorcycleCapacity: number;
  truckCapacity?: number;
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
  locality: string;
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


  



