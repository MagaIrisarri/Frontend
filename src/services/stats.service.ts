import axios from "axios";

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

export interface Locality { province: string; locality: string }

export interface StatsSummary {
  periodDays: number;
  scope: Locality | null; // null: todo el sistema
  localities: Locality[]; // localidades con cocheras, para elegir el alcance
  users: { total: number; byRole: Record<string, number> };
  parkings: { total: number; active: number };
  spaces: { total: number; occupied: number; maintenance: number };
  reservations: { total: number; byStatus: Record<string, number>; previousTotal: number };
  billing: { total: number; paid: number; count: number; previousTotal: number };
  topParkings: { id: string; name: string; total: number; count: number }[];
}

// Panel del administrador: estado actual y últimos `periodDays` días, con el período anterior para comparar.
// Con `scope`, cocheras, plazas, reservas y facturación son las de esa localidad; los usuarios, de todo el sistema.
export const getStatsSummary = (scope?: Locality | null) =>
  api.get('/api/stats/summary', { params: scope ?? undefined }).then(res => res.data.data as StatsSummary);
