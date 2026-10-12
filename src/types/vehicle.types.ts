export interface Brand {
  id: string;
  name: string;
}

export interface Model {
  id: string;
  name: string;
  vehicleType?: { id: string; name: string };
}

export interface VehicleType {
  id: string;
  name: string;
  isActive?: boolean;
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
  year?: number | null;
  brand?: { id: string; name: string };
  model?: { id: string; name: string };
  client?: Client;
  insurance?: { id: string; name: string };
  vehicleType?: { id: string; name: string };
}

export interface CreateVehicle {
  plate: string;
  year?: number;
  brandId: string;
  modelId: string;
  insuranceId?: string;
}

export interface UpdateVehicle {
  plate: string;
  year?: number | null; // null quita el año
  brandId: string;
  modelId: string;
  insuranceId?: string | null;
}
export interface VehicleTypeInput {
  name: string;
}