import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getParkingsByOwner } from '../../services/parking.service';
import { getReservationsByOwner } from '../../services/reservation.service';
import { getEmployeesByOwner } from '../../services/employee.service';
import { useAuthStore } from '../../stores/authStore';
import type { Parking } from '../../types/parking.types';
import { getTemplate } from '../../services/shift.service';
import { fromServer, normRes, type Day, type Res } from './owner.lib';

export interface Emp {
  id: string; dni: string; name: string; last_name: string; email: string; phone?: string;
  date_of_birth?: string; parkingId?: string | null;
}

interface OwnerData {
  ownerId: string;
  me: Record<string, any>;
  parkings: Parking[];
  employees: Emp[];
  reservations: Res[];
  templates: Record<string, Day[]>; // semana tipo por sucursal (lunes a domingo)
  status: 'loading' | 'ready' | 'error';
  refresh: () => Promise<boolean>; // true si se cargó todo
  refreshParkings: () => Promise<boolean>; // solo las sucursales (plazas, ocupación y tarifas), sin reservas, empleados ni semanas tipo
  lastParking: string | null; // última sucursal elegida en Plazas, Servicios o Turnos
  setLastParking: (id: string) => void;
}

const Ctx = createContext<OwnerData | null>(null);

export const useOwner = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error('useOwner fuera de OwnerProvider');
  return v;
};

const list = (x: any) => (Array.isArray(x) ? x : x?.data ?? []);

// Datos compartidos por todas las vistas del dueño; cada vista llama refresh() después de guardar.
export function OwnerProvider({ children }: { children: ReactNode }) {
  const me = useAuthStore(s => s.user) ?? {};
  const ownerId: string = me.id || me._id || '';
  const [state, setState] = useState<Omit<OwnerData, 'refresh' | 'refreshParkings' | 'ownerId' | 'me' | 'lastParking' | 'setLastParking'>>({ parkings: [], employees: [], reservations: [], templates: {}, status: 'loading' });
  const [lastParking, setLastParking] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!ownerId) return false;
    try {
      const [p, r, e] = await Promise.all([getParkingsByOwner(ownerId), getReservationsByOwner(ownerId), getEmployeesByOwner(ownerId)]);
      const parkings: Parking[] = list(p);
      const weeks = await Promise.all(parkings.map(x => getTemplate(x.id).then(w => w.map(fromServer)).catch(() => null)));
      const templates = Object.fromEntries(parkings.map((x, i) => [x.id, weeks[i] ?? []]));
      setState({ parkings, templates, reservations: list(r).map(normRes), employees: list(e), status: 'ready' });
      return true;
    } catch (err) {
      console.error('Error al cargar datos del dueño:', err);
      setState(s => ({ ...s, status: 'error' }));
      return false;
    }
  }, [ownerId]);

  useEffect(() => { refresh(); }, [refresh]);

  // Un cambio de tarifa o de plazas solo toca la sucursal: no hace falta volver a pedir reservas, empleados y semanas tipo.
  const refreshParkings = useCallback(async () => {
    if (!ownerId) return false;
    try {
      const parkings: Parking[] = list(await getParkingsByOwner(ownerId));
      setState(s => ({ ...s, parkings }));
      return true;
    } catch (err) {
      console.error('Error al actualizar las sucursales:', err);
      return false;
    }
  }, [ownerId]);

  return <Ctx.Provider value={{ ...state, ownerId, me, refresh, refreshParkings, lastParking, setLastParking }}>{children}</Ctx.Provider>;
}

// Sucursal activa de las vistas por sucursal (Plazas, Servicios, Turnos): la de ?p, si no la última elegida, si no la primera.
// Cambiar de vista la conserva aunque la URL no la traiga (PanelBar lleva ?p, pero el Panel lo usa para abrir un detalle).
export function useActiveParking() {
  const { parkings, lastParking, setLastParking } = useOwner();
  const [params, setParams] = useSearchParams();
  const wanted = params.get('p');
  const parking = parkings.find(x => x.id === wanted) ?? parkings.find(x => x.id === lastParking) ?? parkings[0];
  const id = parking?.id;
  useEffect(() => { if (id) setLastParking(id); }, [id, setLastParking]);
  return { parking, select: (pid: string) => setParams({ p: pid }) };
}
