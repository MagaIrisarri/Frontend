import { Bike, Car, Truck } from 'lucide-react';
import type { VehicleKey } from '../../../pages/Owner/owner.lib';

// Íconos de vehículo del estándar: los mismos en el panel del dueño y en Home. No importar Car/Bike/Truck de lucide en pantallas migradas.
export const VICON: Record<VehicleKey, typeof Car> = { AUTO: Car, MOTO: Bike, CAMIONETA: Truck };

// Categoría de un tipo de vehículo que viene del backend (texto u objeto con nombre).
export const vehicleKey = (raw: unknown): VehicleKey => {
  const t = String((raw as { name?: string } | null)?.name ?? raw ?? '').trim().toUpperCase();
  if (t.includes('MOTO')) return 'MOTO';
  if (/CAMION|VAN|UTIL|PICK/.test(t)) return 'CAMIONETA';
  return 'AUTO';
};
