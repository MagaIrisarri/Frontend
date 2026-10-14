import { useEffect, useState } from 'react';
import { getVehicleTypes } from '../services/vehicleType.service';
import type { VehicleType } from '../types/vehicle.types';

// Tipos de vehículo activos del catálogo del administrador (R-30: plazas y tarifas van por tipo).
// Una sola consulta por carga de la app; los base primero (AUTO, MOTO, CAMIONETA) y después los demás por nombre.
const BASE = ['AUTO', 'MOTO', 'CAMIONETA'];
const rank = (n: string) => { const i = BASE.indexOf(n); return i < 0 ? BASE.length : i; };
let cache: Promise<VehicleType[]> | null = null;
const load = () => (cache ??= getVehicleTypes()
  .then(res => res.data.filter(t => t.isActive !== false).sort((a, b) => rank(a.name) - rank(b.name) || a.name.localeCompare(b.name, 'es')))
  .catch(err => { cache = null; throw err; }));

export function useVehicleTypes(): { types: VehicleType[]; error: boolean } {
  const [types, setTypes] = useState<VehicleType[]>([]);
  const [error, setError] = useState(false);
  useEffect(() => {
    let alive = true;
    load().then(t => { if (alive) setTypes(t); }).catch(() => { if (alive) setError(true); });
    return () => { alive = false; };
  }, []);
  return { types, error };
}

// El administrador agregó, renombró o dio de baja un tipo: la próxima pantalla vuelve a pedirlos.
export const invalidateVehicleTypes = () => { cache = null; };
