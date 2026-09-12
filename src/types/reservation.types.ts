export interface Reservation {
  id: string;
  startTime: string;
  endTime: string;
  vehicle: any;
  parkingSpace: any;
  status: string;
  client?: any;
  plate?: string;
  brand?: string;
  model?: string;
  vehicleType?: string;
  services?: any[];
  parking?: any;
  spaceCode?: string;
  totalPrice?: number;
}
