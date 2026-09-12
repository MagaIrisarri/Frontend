export interface ParkingSpace{
  id: string;
  spaceCode: string;
  vehicleType: string;
  isActive: boolean;
  parking: string;
  state: 'LIBRE' | 'OCUPADO' | 'MANTENIMIENTO';
}

export interface ParkingSpaceState{
  state: 'LIBRE' | 'OCUPADO' | 'MANTENIMIENTO';
}