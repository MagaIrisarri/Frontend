import axios from "axios";

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

export interface StatsSummary {
  periodDays: number;
  users: { total: number; byRole: Record<string, number> };
  parkings: { total: number; active: number };
  spaces: { total: number; occupied: number; maintenance: number };
  reservations: { total: number; byStatus: Record<string, number>; previousTotal: number };
  billing: { total: number; paid: number; count: number; previousTotal: number };
  topParkings: { id: string; name: string; total: number; count: number }[];
}

// Panel del administrador: estado actual y últimos `periodDays` días, con el período anterior para comparar.
export const getStatsSummary = () => api.get('/api/stats/summary').then(res => res.data.data as StatsSummary);
