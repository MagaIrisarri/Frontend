import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { BarChart3 } from 'lucide-react';
import OwnerShell from '../../components/Owner/ui/OwnerShell';
import PanelBar from '../../components/Owner/ui/PanelBar';
import { Empty, ErrorBox, PageHead } from '../../components/Owner/ui/Page';
import { money } from './owner.lib';

interface Metrics { totalRevenue?: number; activeReservations?: number; occupancyRate?: number; totalCapacity?: number; reservations?: Record<string, number> }

// Métricas de una sucursal, con la misma barra y estilos que el resto del panel del dueño.
export default function MetricsView() {
  const { id } = useParams();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading');

  const load = () => {
    setState('loading');
    axios.create({ baseURL: import.meta.env.VITE_API_URL }).get(`/api/parkings/${id}/metrics`)
      .then(res => { setMetrics(res.data?.data || res.data); setState('ok'); })
      .catch(() => setState('error'));
  };
  useEffect(() => { if (id) load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const rows: [string, string, string][] = metrics ? [
    ['Recaudación', money(metrics.totalRevenue || 0), 'monto total pagado'],
    ['Reservas activas', String(metrics.activeReservations || 0), 'en curso ahora'],
    ['Ocupación actual', `${metrics.occupancyRate ?? 0}%`, `${metrics.totalCapacity || 0} plazas`],
    ['Finalizadas', String(metrics.reservations?.FINALIZADA || 0), 'reservas completadas'],
  ] : [];

  return (
    <OwnerShell>
      <PanelBar home="/owner" role="Dueño" />
      <main className="page">
        <PageHead eyebrow="Sucursal" title="Métricas de la sucursal" />
        {state === 'error' && <ErrorBox what="las métricas" onRetry={load} />}
        {state === 'ok' && !metrics && <Empty icon={<BarChart3 className="i" />} title="Sin métricas">No se encontraron métricas para esta sucursal.</Empty>}
        {state === 'ok' && metrics && (
          <section className="panel stats" aria-label="Métricas">
            {rows.map(([label, value, ctx]) => (
              <div className="srow" key={label}>
                <div><div className="lab">{label}</div><div className="ctx">{ctx}</div></div>
                <div className="val">{value}</div>
              </div>
            ))}
          </section>
        )}
      </main>
    </OwnerShell>
  );
}
