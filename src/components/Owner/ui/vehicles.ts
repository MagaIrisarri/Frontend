import { Car, Motorbike, createLucideIcon } from 'lucide-react';
import type { VehicleKey } from '../../../pages/Owner/owner.lib';

// Lucide no trae pickup: caja atrás, cabina adelante, misma grilla de 24 y trazo que el resto.
const Pickup = createLucideIcon('pickup', [
  ['path', { d: 'M5 17H3a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h8V7a1 1 0 0 1 1-1h4.5a1 1 0 0 1 .8.4L20 11h1a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-2', key: 'body' }],
  ['path', { d: 'M11 11h9', key: 'belt' }],
  ['path', { d: 'M9 17h6', key: 'base' }],
  ['circle', { cx: '7', cy: '17', r: '2', key: 'rear' }],
  ['circle', { cx: '17', cy: '17', r: '2', key: 'front' }],
]);

// Íconos de vehículo del estándar: los mismos en el panel del dueño y en Home. No importar Car/Motorbike de lucide en pantallas migradas.
export const VICON: Record<VehicleKey, typeof Car> = { AUTO: Car, MOTO: Motorbike, CAMIONETA: Pickup };

// Forma del ícono para un tipo de vehículo (texto u objeto con nombre). Es solo visual: un tipo nuevo como
// "Utilitario" lleva el de camioneta; plazas y tarifas van por el id del tipo (R-30).
export const vehicleKey = (raw: unknown): VehicleKey => {
  const t = String((raw as { name?: string } | null)?.name ?? raw ?? '').trim().toUpperCase();
  if (t.includes('MOTO') || t.includes('BICI')) return 'MOTO';
  if (/CAMION|VAN|UTIL|PICK|SUV/.test(t)) return 'CAMIONETA';
  return 'AUTO';
};

export const iconOf = (raw: unknown) => VICON[vehicleKey(raw)];
