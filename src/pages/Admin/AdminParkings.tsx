import { createElement, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertTriangle, Building2 } from 'lucide-react';
import { Empty, ErrorBox, PageHead, SkeletonRows } from '../../components/Owner/ui/Page';
import { FilterBar } from '../../components/Owner/ui/FilterBar';
import { Pager } from '../../components/Owner/ui/Pager';
import { getOneParking, getParkingMetrics, getParkingsPage } from '../../services/parking.service';
import { getEmployeesByOwner } from '../../services/employee.service';
import { usePagedList } from '../../hooks/usePagedList';
import { useAsync, useDebounced } from '../../hooks/useAsync';
import { revealOnMobile } from '../../utils/layout';
import { iconOf } from '../../components/Owner/ui/vehicles';
import { capOf, hrs, maintOf, money, occOf, pct, priceOf, svcOf, missing, typePlural, typesOf, type ParkingLike } from '../Owner/owner.lib';

interface Parking extends ParkingLike {
  name: string; address: string; neighborhood?: string | null; locality: string; province?: string | null; postalCode?: string;
  minReservationHours: number; maxReservationHours: number; reservationMargin: number;
  owner?: { id: string; name?: string; last_name?: string; email?: string; phone?: string } | null;
}
interface Meta { page: number; limit: number; total: number; counts: { on: number; off: number }; localities: { province: string; locality: string }[] }
interface Metrics { reservations: Record<string, number>; totalRevenue: number }

const MOVES: [string, string][] = [['FINALIZADA', 'Finalizadas'], ['EN CURSO', 'En curso'], ['PENDIENTE', 'Pendientes'], ['CANCELADA', 'Canceladas']];
const ownerName = (p: Parking) => [p.owner?.name, p.owner?.last_name].filter(Boolean).join(' ') || 'Sin dueño';
const place = (p: { locality: string; province?: string | null }) => `${p.locality}${p.province ? `, ${p.province}` : ''}`;
const locKey = (l: { province?: string | null; locality: string }) => `${l.province ?? ''}|${l.locality}`;
// Estado en texto además de color: pausada, activa con tarifas incompletas, o activa.
const stateOf = (p: Parking) => !p.isActive ? { c: 'mute', l: 'Pausada' } : missing(p).length ? { c: 'warn', l: 'Falta tarifa' } : { c: 'ok', l: 'Activa' };

// Cocheras de todo el sistema, solo lectura: lista paginada a la izquierda (como Marcas) y el detalle de la elegida a la derecha.
// La edición es del dueño. La búsqueda, los filtros y las páginas los resuelve el servidor; las métricas se piden solo al abrir una cochera.
export default function AdminParkings() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [q, setQ] = useState('');
  const [loc, setLoc] = useState('');
  const [st, setSt] = useState<'all' | 'on' | 'off'>('all');
  const [sel, setSel] = useState<Parking | null>(null);
  const detail = useRef<HTMLElement>(null);

  const [province, locality] = loc ? loc.split('|') : [undefined, undefined];
  const list = usePagedList<Parking, Meta>(getParkingsPage, { q: useDebounced(q.trim()) || undefined, province, locality, status: st === 'all' ? undefined : st });

  // Enlace desde un usuario (?p=<id>): abre esa cochera aunque no esté en la página actual.
  const wanted = params.get('p');
  useEffect(() => {
    if (wanted) getOneParking(wanted).then(x => setSel(x?.data ?? x)).catch(() => {});
  }, [wanted]);

  const clear = () => { setQ(''); setLoc(''); setSt('all'); };
  const filtered = !!(q || loc || st !== 'all');
  const counts = list.meta?.counts;
  const pick = (p: Parking) => { setSel(p); revealOnMobile(detail.current); };

  let side;
  if (list.status === 'error') side = <ErrorBox what="las cocheras" onRetry={list.reload} />;
  else if (list.status === 'loading') side = <SkeletonRows n={6} cols={1} />;
  else if (!list.meta?.total && !filtered) side = <Empty icon={<Building2 className="i" />} title="Todavía no hay cocheras">Las cargan los dueños desde su panel.</Empty>;
  else side = (
    <>
      <div className="bl" aria-busy={list.busy} style={{ opacity: list.busy ? 0.6 : 1 }}>
        {list.items.length ? list.items.map(p => {
          const s = stateOf(p);
          return (
            <button type="button" key={p.id} className="bi" aria-current={sel?.id === p.id} onClick={() => pick(p)}>
              <span className="t"><span className="nm t">{p.name}</span><span className="ad t">{place(p)}</span></span>
              {s.c !== 'ok' && <span className={`st ${s.c}`}>{s.l}</span>}
            </button>
          );
        }) : <p className="ad" style={{ padding: '8px 12px' }}>Ninguna cochera coincide con los filtros.</p>}
      </div>
      <Pager page={list.page} limit={list.limit} total={list.meta?.total ?? 0} busy={list.busy} onPage={list.setPage} />
    </>
  );

  return (
    <>
      <PageHead title="Cocheras" sub="Todas las cocheras del sistema, activas y pausadas." />
      {list.status !== 'error' && (list.meta?.total || filtered) ? (
        <FilterBar search={{ value: q, onChange: setQ, label: 'Buscar cochera', placeholder: 'Buscar por nombre, dirección o dueño' }} active={filtered} onClear={clear}>
          <select className="sel" aria-label="Filtrar por localidad" value={loc} onChange={e => setLoc(e.target.value)}>
            <option value="">Todas las localidades</option>
            {(list.meta?.localities ?? []).map(l => <option key={locKey(l)} value={locKey(l)}>{place(l)}</option>)}
          </select>
          <div className="seg" role="group" aria-label="Filtrar por estado">
            {([['all', 'Todas', counts ? counts.on + counts.off : 0], ['on', 'Activas', counts?.on ?? 0], ['off', 'Pausadas', counts?.off ?? 0]] as const).map(([k, l, n]) => (
              <button type="button" key={k} aria-pressed={st === k} onClick={() => setSt(k)}>{l}<b>{n}</b></button>
            ))}
          </div>
        </FilterBar>
      ) : null}
      <div className="split">
        <section className="panel side" aria-label="Cocheras">{side}</section>
        <section className="panel main" aria-label="Detalle de la cochera" aria-live="polite" ref={detail}>
          {sel ? <Detail key={sel.id} p={sel} onOwner={id => navigate(`/admin/users?u=${id}`)} />
            : <Empty icon={<Building2 className="i" />} title="Elegí una cochera">Mirá su ocupación, tarifas, personal y movimiento.</Empty>}
        </section>
      </div>
    </>
  );
}

function Detail({ p, onOwner }: { p: Parking; onOwner: (ownerId: string) => void }) {
  const metrics = useAsync<Metrics>(() => getParkingMetrics(p.id), [p.id]);
  const team = useAsync<{ id: string; name: string; last_name: string; parkingId?: string }[]>(
    () => p.owner?.id ? getEmployeesByOwner(p.owner.id) : Promise.resolve([]), [p.owner?.id]);

  const s = stateOf(p);
  const types = typesOf(p).filter(t => capOf(p, t.id) > 0);
  const gone = missing(p);
  const m = metrics.data;
  const crew = (team.data ?? []).filter(u => u.parkingId === p.id);

  return (
    <>
      <div className="mhead">
        <div style={{ minWidth: 0 }}>
          <h2>{p.name}</h2>
          <div className="ad">{[p.address, p.neighborhood, place(p)].filter(Boolean).join(', ')}{p.postalCode ? ` (${p.postalCode})` : ''}</div>
        </div>
        <span className={`st ${s.c}`}>{s.l}</span>
      </div>
      {!p.isActive && <p className="ctx" role="note">Pausada por su dueño: los clientes no la ven ni reservan en ella.</p>}
      {gone.length > 0 && <p className="st warn" role="note"><AlertTriangle className="i sm" />Sin tarifa para {gone.map(t => typePlural(t.name).toLowerCase()).join(', ')}: esos clientes no pueden reservar.</p>}

      <div className="fs"><div className="fh"><h3>Dueño</h3>{p.owner?.id && <button type="button" className="link" onClick={() => onOwner(p.owner!.id)}>Ver usuario</button>}</div>
        <dl className="dl">
          <dt>Nombre</dt><dd>{ownerName(p)}</dd>
          {p.owner?.email && <><dt>Email</dt><dd>{p.owner.email}</dd></>}
          {p.owner?.phone && <><dt>Teléfono</dt><dd>{p.owner.phone}</dd></>}
        </dl>
      </div>

      <div className="fs"><div className="fh"><h3>Atención</h3></div>
        <dl className="dl">
          <dt>Horario</dt><dd>{hrs(p)}</dd>
          <dt>Reserva</dt><dd>{p.minReservationHours} a {p.maxReservationHours} h · margen entre reservas {p.reservationMargin} min</dd>
          <dt>Personal</dt><dd>{team.status === 'error' ? '—' : team.status === 'loading' ? 'Cargando…' : crew.length ? crew.map(u => `${u.name} ${u.last_name}`).join(', ') : 'Sin empleados asignados'}</dd>
        </dl>
      </div>

      <div className="fs"><div className="fh"><h3>Plazas y tarifas</h3></div>
        {types.length ? (
          <div className="panel tw"><table className="tbl">
            <thead><tr><th>Tipo</th><th className="r">En servicio</th><th className="r">Ocupadas</th><th className="r">Mantenimiento</th><th className="r">Tarifa por hora</th></tr></thead>
            <tbody>{types.map(t => {
              const pr = priceOf(p, t.id);
              return (
                <tr key={t.id}>
                  <td className="nm" data-label="Tipo"><span className="cap">{createElement(iconOf(t.name), { className: 'i', 'aria-hidden': true })}{typePlural(t.name)}</span></td>
                  <td className="r" data-label="En servicio">{svcOf(p, t.id)}</td>
                  <td className="r" data-label="Ocupadas">{occOf(p, t.id)}</td>
                  <td className="r" data-label="Mantenimiento">{maintOf(p, t.id)}</td>
                  <td className="r" data-label="Tarifa por hora">{pr ? money(pr.price) : <span className="st warn">Sin tarifa</span>}</td>
                </tr>
              );
            })}</tbody>
          </table></div>
        ) : <p className="ad">Todavía no tiene plazas cargadas.</p>}
        {types.length > 0 && <p className="ad">Ocupación ahora: {pct(p)} % de las plazas en servicio.</p>}
      </div>

      <div className="fs"><div className="fh"><h3>Movimiento</h3></div>
        {metrics.status === 'error' ? <ErrorBox what="las métricas de la cochera" onRetry={metrics.reload} />
          : !m ? <span className="sk" style={{ height: 72 }} />
          : <>
              <div className="srow" style={{ paddingTop: 0 }}><span className="lab">Facturado</span><span className="val">{money(m.totalRevenue ?? 0)}</span></div>
              <div className="types">{MOVES.map(([k, l]) => {
                const n = m.reservations?.[k] ?? 0, total = MOVES.reduce((a, [kk]) => a + (m.reservations?.[kk] ?? 0), 0);
                return (
                  <div className="trow" key={k}><span className="n">{l}</span>
                    <div className="bar-t" role="img" aria-label={`${l}: ${n}`}><i style={{ width: `${total ? Math.round((n / total) * 100) : 0}%` }} /></div>
                    <span className="v">{n}</span></div>
                );
              })}</div>
            </>}
      </div>
    </>
  );
}
