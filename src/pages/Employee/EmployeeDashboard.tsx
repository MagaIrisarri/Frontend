import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Info, MapPin, Plus, Search } from 'lucide-react';
import OwnerShell from '../../components/Owner/ui/OwnerShell';
import PanelBar from '../../components/Owner/ui/PanelBar';
import { Shown } from '../../components/Owner/ui/Presence';
import { Empty, ErrorBox, SkeletonRows } from '../../components/Owner/ui/Page';
import { useAuthStore } from '../../stores/authStore';
import { getReservationsByParking } from '../../services/reservation.service';
import { api } from '../../services/api';
import { iconOf } from '../../components/Owner/ui/vehicles';
import { DOW, addD, occOf, shD, svcOf, today, typePlural, typesOf, wdOf } from '../Owner/owner.lib';
import CalendarDrawer, { AHEAD_DAYS, BACK_DAYS } from './CalendarDrawer';
import ResDrawer from './ResDrawer';
import SummaryDrawer from './SummaryDrawer';
import WalkInDrawer from './WalkInDrawer';
import { hhmm, list, normERes, overdue, person, primaryOf, reservedEnd, stateOf, toPay, useRun, type EParking, type ERes, type Status } from './employee.lib';

const POLL_MS = 30_000;
const SEGS: ['all' | Status, string][] = [['all', 'Todas'], ['PENDIENTE', 'Pendientes'], ['EN CURSO', 'En curso'], ['FINALIZADA', 'Finalizadas'], ['CANCELADA', 'Canceladas']];
interface Shift { d: number; t: string } // d: 0 = lunes (como DOW), t: "08:00–16:00"

// Terminal del empleado: reservas de su sucursal, ingreso de mostrador, cambio de plaza, ingreso, salida y cobro.
export default function EmployeeDashboard() {
  const user = useAuthStore(s => s.user);
  const userId: string = user?.id || user?._id || '';
  const [parking, setParking] = useState<EParking | null | undefined>(undefined); // undefined = cargando
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [reservations, setReservations] = useState<ERes[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  // La sucursal se lee del backend y no del usuario guardado al loguearse: el dueño puede asignarla después.
  const refresh = useCallback(async () => {
    if (!userId) return;
    try {
      const [u, s] = await Promise.all([api.get(`/api/users/${userId}`), api.get(`/api/shifts/employee/${userId}`)]);
      setShifts(list(s.data).map((x: any) => ({ d: DOW.indexOf(x.dayOfWeek), t: `${x.startTime.slice(0, 5)}–${x.endTime.slice(0, 5)}` })));
      const pid: string | null = u.data?.data?.parkingId ?? null;
      if (!pid) { setParking(null); setStatus('ready'); return; }
      const [p, r] = await Promise.all([api.get(`/api/parkings/${pid}`), getReservationsByParking(pid)]);
      setParking({ ...p.data?.data, id: pid, name: p.data?.data?.name ?? 'Tu sucursal' }); // trae capacidades, ocupación, tarifas y horario
      setReservations(list(r).map(normERes));
      setStatus('ready');
    } catch (err) {
      console.error('Error al cargar la terminal del empleado:', err);
      setStatus('error');
    }
  }, [userId]);
  useEffect(() => { refresh(); }, [refresh]);
  // Se actualiza sola cada 30 s mientras la pestaña se ve; el botón de la barra la actualiza al momento.
  useEffect(() => {
    const t = setInterval(() => { if (!document.hidden) refresh(); }, POLL_MS);
    return () => clearInterval(t);
  }, [refresh]);

  return (
    <OwnerShell>
      <PanelBar home="/employee" role="Empleado" onRefresh={refresh} />
      <main className="e-wrap">
        {status === 'error' ? <ErrorBox what="las reservas" onRetry={refresh} />
          : status === 'loading' || parking === undefined ? <SkeletonRows n={5} />
            : parking === null ? <Empty icon={<MapPin className="i" />} title="Sin sucursal asignada">Pedile al dueño que te asigne una sucursal desde Personal para ver y operar sus reservas.</Empty>
              : <Terminal reservations={reservations} parking={parking} shifts={shifts} me={person(user)} onChange={refresh} />}
      </main>
    </OwnerShell>
  );
}

function Terminal({ reservations, parking, shifts, me, onChange }: { reservations: ERes[]; parking: EParking; shifts: Shift[]; me: string; onChange: () => Promise<void> }) {
  const now = today();
  const [rd, setRd] = useState(now);
  const [rs, setRs] = useState<'all' | Status>('all');
  const [rq, setRq] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [panel, setPanel] = useState<'walkin' | 'summary' | 'calendar' | null>(null);
  const search = useRef<HTMLInputElement>(null);
  // Desde una notificación (?r=id): va al día de la reserva y la abre.
  const [params, setParams] = useSearchParams();
  useEffect(() => {
    const target = reservations.find(r => r.id === params.get('r'));
    if (!target) return;
    setRd(target.date);
    setOpenId(target.id);
    setParams({}, { replace: true });
  }, [params, setParams, reservations]);
  const { run, busy } = useRun(onChange);
  const open = reservations.find(r => r.id === openId);

  const turno = shifts.filter(s => s.d === wdOf(now)).map(s => s.t).join(' · ');
  const worked = [...new Set(shifts.map(s => (s.d + 1) % 7))]; // días de la semana de JS (0 = domingo)
  const min = addD(now, -BACK_DAYS), max = addD(now, AHEAD_DAYS);
  const dayLabel = `${rd === now ? 'Hoy · ' : rd === addD(now, 1) ? 'Mañana · ' : ''}${new Date(rd + 'T12:00').toLocaleDateString('es-AR', { weekday: 'short' }).replace('.', '')} ${shD(rd)}`;

  // Atajos de la maqueta: N abre Nuevo ingreso y / va a la búsqueda (no se disparan escribiendo en un campo).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (panel || openId || (e.target as HTMLElement).matches('input,select,textarea') || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'n' || e.key === 'N') { e.preventDefault(); setPanel('walkin'); }
      if (e.key === '/') { e.preventDefault(); search.current?.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [panel, openId]);

  // Hoy también lista los vehículos que siguen adentro desde un día anterior (R-21): si no, su salida no se ve.
  const D = reservations.filter(r => r.date === rd || (rd === now && r.date < rd && r.status === 'EN CURSO'));
  const q = rq.trim().toLowerCase().replace(/[\s-]/g, '');
  const shown = D.filter(r => (rs === 'all' || r.status === rs) && (!q || (r.plate + r.code).toLowerCase().replace(/-/g, '').includes(q)));
  const byStart = (a: ERes, b: ERes) => a.start.localeCompare(b.start);
  const groups: [string, ERes[]][] = [
    ['Por cobrar', shown.filter(r => r.status === 'FINALIZADA' && toPay(r)).sort(byStart)],
    ['En curso', shown.filter(r => r.status === 'EN CURSO').sort((a, b) => Number(overdue(b)) - Number(overdue(a)) || byStart(a, b))], // los pasados de hora primero
    ['Pendientes', shown.filter(r => r.status === 'PENDIENTE').sort(byStart)],
    ['Finalizadas', shown.filter(r => r.status === 'FINALIZADA' && !toPay(r)).sort(byStart)],
    ['Canceladas', shown.filter(r => r.status === 'CANCELADA').sort(byStart)],
  ];
  const clear = () => { setRs('all'); setRq(''); setRd(now); };

  let queue;
  if (!D.length) queue = <div className="e-empty">Sin reservas el {shD(rd)}. <span className="dim">Probá con otra fecha: las reservas de tu sucursal aparecen acá con su código y su plaza.</span></div>;
  else if (!shown.length) queue = <div className="e-empty">{rq ? `Sin resultados para «${rq}».` : 'No hay reservas en este estado.'}<button type="button" className="btn sm" onClick={clear}>Limpiar filtros</button></div>;
  else queue = groups.filter(g => g[1].length).map(([title, rows]) => (
    <section className="e-grp" key={title}>
      <h2>{title} <b>{rows.length}</b></h2>
      <div className="e-list" role="table" aria-label={title}>{rows.map(r => <Row key={r.id} r={r} margin={parking.reservationMargin} busy={busy} run={run} onOpen={() => setOpenId(r.id)} />)}</div>
    </section>
  ));

  return (
    <>
      <h1 className="sr">Reservas</h1>
      <header className="e-hd">
        <div className="e-who"><span className="dim">{parking.name} · Terminal del empleado</span><b>{me || 'Empleado'}</b>
          <span className="dim">{turno ? `Tu turno hoy: ${turno}` : shifts.length ? 'Hoy no tenés turno' : 'Todavía no tenés turnos cargados.'}</span></div>
        <div className="e-occ" aria-label="Ocupación por tipo de vehículo">
          {typesOf(parking).filter(t => svcOf(parking, t.id) > 0).map(t => {
            const o = occOf(parking, t.id), c = svcOf(parking, t.id), I = iconOf(t.name);
            return <div className="e-chip" key={t.id}><span><span className="cap"><I className="i sm" aria-hidden="true" />{typePlural(t.name)}</span> <b>{o}/{c}</b></span><div className={`e-meter${o >= c ? ' full' : ''}`}><i style={{ width: `${Math.min(100, (o / c) * 100)}%` }} /></div></div>;
          })}
        </div>
        <div className="e-tb"><button type="button" className="btn sm" onClick={() => setPanel('summary')}>Resumen</button></div>
        <button type="button" className="btn pri lg e-new" title="Atajo: N" onClick={() => { setRd(now); setPanel('walkin'); }}><Plus className="i" aria-hidden="true" />Nuevo ingreso</button>
      </header>
      {parking.walkInOnly && <div className="e-note" role="note"><Info className="i" aria-hidden="true" /><span><b>Solo en el lugar.</b> La sucursal no toma reservas online por ahora. Registrá a los clientes con “Nuevo ingreso”; las reservas en curso siguen igual.</span></div>}

      <div className="e-tools">
        <div className="e-day" role="group" aria-label="Día">
          <button type="button" className="btn sm" aria-label="Día anterior" disabled={rd <= min} onClick={() => setRd(addD(rd, -1))}><ChevronLeft className="i" /></button>
          <button type="button" className="btn sm e-dayl" aria-label={`Elegir fecha en el calendario. Día actual: ${dayLabel}`} onClick={() => setPanel('calendar')}>{dayLabel}</button>
          <button type="button" className="btn sm" aria-label="Día siguiente" disabled={rd >= max} onClick={() => setRd(addD(rd, 1))}><ChevronRight className="i" /></button>
        </div>
        <div className="search"><Search className="i" /><input ref={search} className="inp" type="search" placeholder="Patente o código de reserva  ( / )" aria-label="Buscar por patente o código" autoComplete="off" value={rq} onChange={e => setRq(e.target.value)} /></div>
        <div className="seg" role="group" aria-label="Filtrar por estado">
          {SEGS.map(([k, l]) => <button type="button" key={k} aria-pressed={rs === k} onClick={() => setRs(k)}>{l}<b>{D.filter(r => k === 'all' || r.status === k).length}</b></button>)}
        </div>
      </div>

      <div className="e-queue">{queue}</div>

      <Shown when={open}>{open => <ResDrawer r={open} parking={parking} onChange={onChange} onClose={() => setOpenId(null)} />}</Shown>
      <WalkInDrawer open={panel === 'walkin'} parking={parking} onChange={onChange} onClose={() => setPanel(null)} />
      <SummaryDrawer open={panel === 'summary'} reservations={reservations} onClose={() => setPanel(null)} />
      <CalendarDrawer open={panel === 'calendar'} value={rd} worked={worked} turno={turno} onPick={d => { setRd(d); setPanel(null); }} onClose={() => setPanel(null)} />
    </>
  );
}

// Una reserva en la cola: patente, plaza y horario con quién ingresó y salió, estado y la acción que toca.
function Row({ r, margin, busy, run, onOpen }: { r: ERes; margin: number; busy: boolean; run: ReturnType<typeof useRun>['run']; onOpen: () => void }) {
  const p = primaryOf(r, margin);
  const st = stateOf(r);
  const io = r.status === 'EN CURSO' || r.status === 'FINALIZADA'
    ? [r.inBy && `Ingresó ${r.inBy}`, r.outBy && `Salió ${r.outBy}`].filter(Boolean).join(' · ') || 'Sin ingreso registrado' : r.services.map(s => s.name).join(', ');
  return (
    <div className="e-row" role="row">
      <div role="cell"><span className="e-pl">{r.plate}</span><div className="e-sub">{[r.code, r.bm, r.client.n].filter(Boolean).join(' · ')}</div></div>
      <div role="cell"><b>Plaza {r.space} · {r.start} – {hhmm(reservedEnd(r))}{r.endDate !== r.date ? ` (${shD(r.endDate)})` : ''}</b><div className="e-sub" title={io}>{io || '—'}</div></div>
      <span role="cell" className={`st ${st.c}`}>{st.l}</span>
      <div role="cell" className="e-acts">
        {p ? <button type="button" className="btn sm pri" aria-label={`${p.label} ${r.plate}`} disabled={busy || p.disabled}
          onClick={() => p.key === 'pay' ? onOpen() : run(p.call!, p.ok!)}>{p.label}</button> : <span />}
        <button type="button" className="btn sm" aria-label={`Gestionar la reserva ${r.code}`} onClick={onOpen}>Gestionar</button>
      </div>
    </div>
  );
}
