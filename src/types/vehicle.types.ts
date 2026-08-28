export interface Brand {
  id: string;
  name: string;
}

export interface VehicleType {
  id: string;
  name: string;
}

export interface Model {
  id: string;
  name: string;
  brand: Brand;
  vehicleType: VehicleType;
}

export interface Client {
  id: string;
  name: string;
  last_name: string;
  email?: string;
  phone?: string;
}

export interface Vehicle {
  id: string;
  plate: string;
  year: number;
  brand?: { id: string; name: string };
  model?: { id: string; name: string };
  client?: Client;
  insurance?: { id: string; name: string };
  vehicleType?: { id: string; name: string };
}