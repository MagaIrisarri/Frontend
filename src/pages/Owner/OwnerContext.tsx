import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
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
  refresh: () => Promise<void>;
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
  const [state, setState] = useState<Omit<OwnerData, 'refresh' | 'ownerId' | 'me'>>({ parkings: [], employees: [], reservations: [], templates: {}, status: 'loading' });

  const refresh = useCallback(async () => {
    if (!ownerId) return;
    try {
      const [p, r, e] = await Promise.all([getParkingsByOwner(ownerId), getReservationsByOwner(ownerId), getEmployeesByOwner(ownerId)]);
      const parkings: Parking[] = list(p);
      const weeks = await Promise.all(parkings.map(x => getTemplate(x.id).then(w => w.map(fromServer)).catch(() => null)));
      const templates = Object.fromEntries(parkings.map((x, i) => [x.id, weeks[i] ?? []]));
      setState({ parkings, templates, reservations: list(r).map(normRes), employees: list(e), status: 'ready' });
    } catch (err) {
      console.error('Error al cargar datos del dueño:', err);
      setState(s => ({ ...s, status: 'error' }));
    }
  }, [ownerId]);

  useEffect(() => { refresh(); }, [refresh]);

  return <Ctx.Provider value={{ ...state, ownerId, me, refresh }}>{children}</Ctx.Provider>;
}
