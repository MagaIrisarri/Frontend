import { Bike, Car, Truck } from 'lucide-react';
import type { VehicleKey } from '../../../pages/Owner/owner.lib';

// Íconos de vehículo del estándar: los mismos en el panel del dueño y en Home. No importar Car/Bike/Truck de lucide en pantallas migradas.
export const VICON: Record<VehicleKey, typeof Car> = { AUTO: Car, MOTO: Bike, CAMIONETA: Truck };

// Forma del ícono para un tipo de vehículo (texto u objeto con nombre). Es solo visual: un tipo nuevo como
// "Utilitario" lleva el de camioneta; plazas y tarifas van por el id del tipo (R-30).
export const vehicleKey = (raw: unknown): VehicleKey => {
  const t = String((raw as { name?: string } | null)?.name ?? raw ?? '').trim().toUpperCase();
  if (t.includes('MOTO') || t.includes('BICI')) return 'MOTO';
  if (/CAMION|VAN|UTIL|PICK|SUV/.test(t)) return 'CAMIONETA';
  return 'AUTO';
};

export const iconOf = (raw: unknown) => VICON[vehicleKey(raw)];
