import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { ErrorBox, PageHead, SkeletonRows } from '../../components/Owner/ui/Page';
import { getStatsSummary, type Locality, type StatsSummary } from '../../services/stats.service';
import { money, plural } from '../Owner/owner.lib';

const RES_ST: [string, string][] = [['FINALIZADA', 'Finalizadas'], ['EN CURSO', 'En curso'], ['PENDIENTE', 'Pendientes'], ['CANCELADA', 'Canceladas']];
// Los administradores no se muestran: son quienes miran el panel.
const ROLES: [string, string][] = [['CLIENTE', 'Clientes'], ['DUEÑO', 'Dueños'], ['EMPLEADO', 'Empleados']];

// Variación contra el período anterior, con ícono, signo y texto (no solo color). Más reservas o facturación es mejor: sube en verde.
function Delta({ now, prev, days, fmt = (n: number) => String(n) }: { now: number; prev: number; days: number; fmt?: (n: number) => string }) {
  if (!prev) return <span className="ctx">{now ? 'Sin datos del período anterior' : 'Sin movimiento'}</span>;
  const pct = Math.round(((now - prev) / prev) * 100);
  const Icon = pct > 0 ? ArrowUpRight : pct < 0 ? ArrowDownRight : Minus;
  return <span className="ctx"><span className={`trend${pct > 0 ? ' up' : pct < 0 ? ' down' : ''}`}><Icon className="i sm" /> {pct > 0 ? '+' : ''}{pct}%</span> vs. los {days} días anteriores ({fmt(prev)})</span>;
}

// Barras de una distribución (reservas por estado, usuarios por rol).
function Bars({ rows, total }: { rows: [string, number][]; total: number }) {
  return (
    <div className="types">{rows.map(([l, n]) => (
      <div className="trow" key={l}><span className="n">{l}</span>
        <div className="bar-t" role="img" aria-label={`${l}: ${n}`}><i style={{ width: `${total ? Math.round((n / total) * 100) : 0}%` }} /></div>
        <span className="v">{n}</span></div>
    ))}</div>
  );
}

// Inicio del administrador: usuarios, cocheras y plazas hoy; reservas y facturación del último mes.
// Una localidad se identifica con su provincia: hay localidades con el mismo nombre en distintas provincias.
const locKey = (l: Locality) => `${l.locality}, ${l.province}`;

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [s, setS] = useState<StatsSummary | null>(null);
  const [failed, setFailed] = useState(false);
  const [loc, setLoc] = useState(''); // '' = todo el sistema
  const [localities, setLocalities] = useState<Locality[]>([]);
  const scope = localities.find(l => locKey(l) === loc) ?? null;
  const province = scope?.province, locality = scope?.locality;
  const load = useCallback(() => {
    setFailed(false); setS(null);
    getStatsSummary(province && locality ? { province, locality } : null)
      .then(r => { setS(r); setLocalities(r.localities); }).catch(() => setFailed(true));
  }, [province, locality]);
  useEffect(() => { load(); }, [load]);

  const days = s?.periodDays ?? 30;
  const users = s ? s.users.total - (s.users.byRole.ADMINISTRADOR ?? 0) : 0;
  const paid = s?.billing.total ? Math.round((s.billing.paid / s.billing.total) * 100) : 0;
  const occ = s?.spaces.total ? Math.round((s.spaces.occupied / s.spaces.total) * 100) : 0;
  const where = scope ? ` en ${scope.locality}` : ' del sistema';
  return (
    <>
      <PageHead title="Panel" sub={`Estado actual${where} y movimiento de los últimos ${days} días.`}
        actions={localities.length > 1 && (
          <select className="sel" aria-label="Filtrar por localidad" style={{ width: 'auto', minWidth: 220 }} value={loc} onChange={e => setLoc(e.target.value)}>
            <option value="">Todas las localidades</option>
            {localities.map(l => <option key={locKey(l)} value={locKey(l)}>{locKey(l)}</option>)}
          </select>
        )} />
      {failed ? <ErrorBox what="el resumen" onRetry={load} /> : !s ? <SkeletonRows n={3} cols={2} /> : <>
        <div className="kpis">
          <section className="panel occ" aria-label="Facturación del último mes" style={{ gridTemplateColumns: '1fr' }}>
            <div className="kfig">
              <div>
                <div className="lab">Facturación · últimos {days} días</div>
                <div className="big">{money(s.billing.total)}</div>
                <Delta now={s.billing.total} prev={s.billing.previousTotal} days={days} fmt={money} />
              </div>
              <div className="occ2">
                <div className="bar-t" role="img" aria-label={`Cobrado: ${paid} % de lo facturado`}><i style={{ width: `${paid}%` }} /></div>
                <div className="meta"><span><b>{money(s.billing.paid)}</b> cobrado ({paid} %)</span><span><b>{money(s.billing.total - s.billing.paid)}</b> por cobrar</span></div>
                <div className="ctx" style={{ marginTop: 4 }}>{plural(s.billing.count, 'factura emitida', 'facturas emitidas')}</div>
              </div>
            </div>
          </section>
          <section className="panel stats" aria-label="Indicadores">
            <div className="srow"><div><div className="lab">Reservas · últimos {days} días</div><Delta now={s.reservations.total} prev={s.reservations.previousTotal} days={days} /></div><div className="val">{s.reservations.total}</div></div>
            <div className="srow"><div><div className="lab">Cocheras</div><div className="ctx">{s.parkings.active} activas · {s.parkings.total - s.parkings.active} pausadas</div></div><div className="val">{s.parkings.total}</div></div>
            <div className="srow"><div><div className="lab">Plazas</div><div className="ctx">{s.spaces.occupied} ocupadas ahora ({occ} %) · {s.spaces.maintenance} en mantenimiento</div></div><div className="val">{s.spaces.total}</div></div>
          </section>
        </div>

        <div className="g2" style={{ gap: 16 }}>
          <section className="panel bars" aria-label="Reservas por estado">
            <div className="phead"><span className="lab">Reservas por estado · últimos {days} días</span></div>
            {s.reservations.total
              ? <Bars rows={RES_ST.map(([k, l]) => [l, s.reservations.byStatus[k] ?? 0] as [string, number]).filter(([, n]) => n)} total={s.reservations.total} />
              : <span className="ctx">No hubo reservas en el período.</span>}
          </section>
          <section className="panel bars" aria-label="Usuarios por rol">
            <div className="phead"><span className="lab">{plural(users, 'usuario activo', 'usuarios activos')}{scope && <span className="ctx"> · de todo el sistema</span>}</span>
              <button type="button" className="link" onClick={() => navigate('/admin/users')}>Ver usuarios</button></div>
            <Bars rows={ROLES.map(([k, l]) => [l, s.users.byRole[k] ?? 0] as [string, number])} total={users} />
          </section>
        </div>

        <div className="fs" style={{ paddingTop: 0 }}>
          <div className="fh"><h3>Cocheras con más facturación · últimos {days} días</h3></div>
          {s.topParkings.length ? (
            <div className="panel tw"><table className="tbl rank">
              <colgroup><col style={{ width: 48 }} /><col /><col style={{ width: 140 }} /><col style={{ width: 160 }} /></colgroup>
              <thead><tr><th>#</th><th>Cochera</th><th className="r">Facturas</th><th className="r">Facturado</th></tr></thead>
              <tbody>{s.topParkings.map((p, i) => (
                <tr key={p.id}><td className="c-n">{i + 1}</td><td className="c-nm"><span className="nm">{p.name}</span></td>
                  <td className="r c-ct">{p.count}</td><td className="r c-tt">{money(p.total)}</td></tr>
              ))}</tbody>
            </table></div>
          ) : <p className="ctx" style={{ margin: 0 }}>Todavía no hay facturación en el período.</p>}
        </div>
      </>}
    </>
  );
}
