import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { AlarmClock, CalendarDays, Check, ChevronLeft, ChevronRight, MapPin, Search } from 'lucide-react';
import OwnerShell from '../../components/Owner/ui/OwnerShell';
import PanelBar from '../../components/Owner/ui/PanelBar';
import { Drawer, ConfirmModal } from '../../components/Owner/ui/Layer';
import { Presence, Shown } from '../../components/Owner/ui/Presence';
import { Empty, ErrorBox, PageHead, SkeletonRows } from '../../components/Owner/ui/Page';
import { apiError } from '../../components/Owner/ui/Field';
import { useToast } from '../../components/Owner/ui/Toasts';
import { useAuthStore } from '../../stores/authStore';
import {
  cancelReservation, changeReservationSpace, checkInReservation, checkOutReservation, confirmReservation, extendReservation, getReservationsByParking,
  setReservationServices,
} from '../../services/reservation.service';
import { payInvoice } from '../../services/invoice.service';
import { getSpaceAvailability } from '../../services/parkingSpace.service';
import { getParkingServices } from '../../services/servicePrice.service';
import { DOW, addD, billLines, dayStr, cap, fmtD, initials, isoD, money, normRes, plural, shD, today, type Res, type Svc } from '../Owner/owner.lib';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });
const list = (x: any) => (Array.isArray(x) ? x : x?.data ?? []);

// El empleado distingue pendiente de confirmada (el dueño las ve juntas como "Reservada").
type Status = 'PENDIENTE' | 'CONFIRMADA' | 'EN CURSO' | 'FINALIZADA' | 'CANCELADA';
const ST: Record<Status, { l: string; c: string }> = {
  PENDIENTE: { l: 'Pendiente', c: 'warn' }, CONFIRMADA: { l: 'Confirmada', c: 'ok' }, 'EN CURSO': { l: 'En curso', c: 'ac' },
  FINALIZADA: { l: 'Finalizada', c: 'mute' }, CANCELADA: { l: 'Cancelada', c: 'mute' },
};
const SEGS: ['all' | Status, string][] = [['all', 'Todas'], ['PENDIENTE', 'Pendientes'], ['CONFIRMADA', 'Confirmadas'], ['EN CURSO', 'En curso'], ['FINALIZADA', 'Finalizadas'], ['CANCELADA', 'Canceladas']];
const ACTIVE: Status[] = ['PENDIENTE', 'CONFIRMADA', 'EN CURSO'];
// Sigue adentro después del fin reservado: la salida cobra las horas extra (R-14) y la plaza no se libera (R-21).
const overdue = (r: ERes) => r.status === 'EN CURSO' && r.endAt.getTime() < Date.now();
// Tienen que coincidir con PaymentMethodSchema del backend (Invoice.Schema.ts).
const METHODS: [string, string][] = [['EFECTIVO', 'Efectivo'], ['TARJETA_DEBITO', 'Débito'], ['TARJETA_CREDITO', 'Crédito'], ['MERCADO_PAGO', 'Mercado Pago'], ['TRANSFERENCIA', 'Transferencia']];

interface ERes extends Res {
  status: Status; spaceId: string; startAt: Date; endAt: Date; staff: string;
  invoice: { id: string; status: string } | null;
}
const normERes = (r: any): ERes => ({
  ...normRes(r),
  status: r.status, spaceId: r.parkingSpace?.id ?? '', startAt: new Date(r.startTime), endAt: new Date(r.endTime),
  staff: [r.attendedBy?.name, r.attendedBy?.last_name].filter(Boolean).join(' '),
  invoice: r.invoice ?? null,
});

// Terminal del empleado: reservas de su sucursal, cambio de plaza, confirmación, ingreso, salida y cobro.
export default function EmployeeDashboard() {
  const user = useAuthStore(s => s.user);
  const userId: string = user?.id || user?._id || '';
  const [parking, setParking] = useState<{ id: string; name: string } | null | undefined>(undefined); // undefined = cargando
  const [shifts, setShifts] = useState<string[]>([]);
  const [reservations, setReservations] = useState<ERes[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  // La sucursal se lee del backend y no del usuario guardado al loguearse: el dueño puede asignarla después.
  const refresh = useCallback(async () => {
    if (!userId) return;
    try {
      const [u, s] = await Promise.all([api.get(`/api/users/${userId}`), api.get(`/api/shifts/employee/${userId}`)]);
      // Agrupa los días con el mismo horario, como el panel del dueño: "Todos los días 08:00–16:00".
      const byTime = new Map<string, number[]>();
      list(s.data).forEach((x: any) => {
        const k = `${x.startTime.slice(0, 5)}–${x.endTime.slice(0, 5)}`;
        byTime.set(k, [...(byTime.get(k) ?? []), DOW.indexOf(x.dayOfWeek)]);
      });
      setShifts([...byTime].sort(([, a], [, b]) => Math.min(...a) - Math.min(...b)).map(([k, days]) => `${dayStr(days)} ${k}`));
      const pid: string | null = u.data?.data?.parkingId ?? null;
      if (!pid) { setParking(null); setStatus('ready'); return; }
      const [p, r] = await Promise.all([api.get(`/api/parkings/${pid}`), getReservationsByParking(pid)]);
      setParking({ id: pid, name: p.data?.data?.name ?? 'Tu sucursal' });
      setReservations(list(r).map(normERes));
      setStatus('ready');
    } catch (err) {
      console.error('Error al cargar la terminal del empleado:', err);
      setStatus('error');
    }
  }, [userId]);
  useEffect(() => { refresh(); }, [refresh]);

  return (
    <OwnerShell>
      <PanelBar home="/employee" role="Empleado" onRefresh={refresh} />
      <main className="page">
        <PageHead eyebrow={parking?.name} title="Reservas"
          sub={shifts.length ? `Tus turnos: ${shifts.join(' · ')}` : 'Todavía no tenés turnos cargados.'} />
        {status === 'error' ? <ErrorBox what="las reservas" onRetry={refresh} />
          : status === 'loading' || parking === undefined ? <SkeletonRows n={5} />
            : parking === null ? <Empty icon={<MapPin className="i" />} title="Sin sucursal asignada">Pedile al dueño que te asigne una sucursal desde Personal para ver y operar sus reservas.</Empty>
              : <DayList reservations={reservations} pid={parking.id} userId={userId} onChange={refresh} />}
      </main>
    </OwnerShell>
  );
}

function DayList({ reservations, pid, userId, onChange }: { reservations: ERes[]; pid: string; userId: string; onChange: () => Promise<void> }) {
  const now = today();
  const [rd, setRd] = useState(now);
  const [rs, setRs] = useState<'all' | Status>('all');
  const [rq, setRq] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const open = reservations.find(r => r.id === openId);

  // Hoy también lista los vehículos que siguen adentro desde un día anterior (R-21): si no, su salida no se ve.
  const D = reservations.filter(r => r.date === rd || (rd === now && r.date < rd && r.status === 'EN CURSO'));
  const q = rq.trim().toLowerCase().replace(/[\s-]/g, '');
  const shown = D.filter(r => (rs === 'all' || r.status === rs) && (!q || (r.plate + r.code).toLowerCase().replace(/-/g, '').includes(q)))
    .sort((a, b) => a.start.localeCompare(b.start));

  let t;
  if (!D.length) t = <Empty icon={<CalendarDays className="i" />} title={`Sin reservas el ${fmtD(rd)}`}>Probá con otra fecha. Las reservas de tu sucursal aparecen acá con su código y su plaza.</Empty>;
  else if (!shown.length) t = <Empty icon={<Search className="i" />} title="Sin resultados" action={<button type="button" className="btn" onClick={() => { setRs('all'); setRq(''); }}>Limpiar filtros</button>}>Ninguna reserva coincide con los filtros actuales.</Empty>;
  else t = (
    <div className="panel tw"><table className="tbl rs">
      <colgroup><col style={{ width: '22%' }} /><col /><col style={{ width: 140 }} /><col style={{ width: 120 }} /><col style={{ width: 120 }} /></colgroup>
      <thead><tr><th>Código</th><th>Plaza y horario</th><th>Estado</th><th className="r">Importe</th><th><span className="sr">Acciones</span></th></tr></thead>
      <tbody>{shown.map(r => (
        <tr key={r.id}>
          <td><span className="plate">{r.code}</span><div className="ad">{r.plate}</div></td>
          <td data-label="Plaza y horario"><span className="nm">Plaza {r.space}</span><div className="ad">{r.date !== rd ? `${shD(r.date)} ` : ''}{r.start} – {r.end}{r.endDate !== r.date ? ` (${shD(r.endDate)})` : ''}</div></td>
          <td data-label="Estado">{overdue(r)
            ? <span className="st warn"><AlarmClock className="i sm" aria-hidden="true" />Se pasó de hora</span>
            : <span className={`st ${ST[r.status].c}`}>{ST[r.status].l}</span>}</td>
          <td className="r" data-label="Importe">{r.amount != null
            ? <>{money(r.amount)}{r.invoice?.status === 'PENDIENTE' && <div className="ad">Por cobrar</div>}</>
            : <span className="na">—</span>}</td>
          <td className="r"><div className="acts"><button type="button" className="btn sm" aria-label={`Gestionar la reserva ${r.code}`} onClick={() => setOpenId(r.id)}>Gestionar</button></div></td>
        </tr>
      ))}</tbody>
    </table></div>
  );

  return (
    <>
      <p className="ctx" style={{ marginBottom: -4 }}>{cap(fmtD(rd))}{rd === now ? ' · hoy' : ''}</p>
      <div className="toolbar">
        <div className="dt" role="group" aria-label="Fecha">
          <button type="button" className="icon-btn" aria-label="Día anterior" onClick={() => setRd(addD(rd, -1))}><ChevronLeft className="i" /></button>
          <input className="inp" type="date" value={rd} aria-label="Fecha de las reservas" onChange={e => e.target.value && setRd(e.target.value)} />
          <button type="button" className="icon-btn" aria-label="Día siguiente" onClick={() => setRd(addD(rd, 1))}><ChevronRight className="i" /></button>
          <button type="button" className="btn" disabled={rd === now} onClick={() => setRd(now)}>Hoy</button>
        </div>
        <div className="search"><Search className="i" /><input className="inp" type="search" placeholder="Buscar por código o patente" aria-label="Buscar por código o patente" value={rq} onChange={e => setRq(e.target.value)} /></div>
      </div>
      <div className="seg" role="group" aria-label="Filtrar por estado" style={{ justifySelf: 'start' }}>
        {SEGS.map(([k, l]) => (
          <button type="button" key={k} aria-pressed={rs === k} onClick={() => setRs(k)}>{l}<b>{D.filter(r => k === 'all' || r.status === k).length}</b></button>
        ))}
      </div>
      {t}
      <Shown when={open}>{open => <ResDrawer r={open} pid={pid} userId={userId} onChange={onChange} onClose={() => setOpenId(null)} />}</Shown>
    </>
  );
}

function ResDrawer({ r, pid, userId, onChange, onClose }: { r: ERes; pid: string; userId: string; onChange: () => Promise<void>; onClose: () => void }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [spaces, setSpaces] = useState<{ id: string; spaceCode: string }[] | null>(null);
  const [method, setMethod] = useState('EFECTIVO');
  const active = ACTIVE.includes(r.status);
  const toPay = r.invoice?.status === 'PENDIENTE';
  const early = r.startAt.getTime() > Date.now(); // R-16: el ingreso se registra desde el inicio reservado

  // Plazas del mismo tipo libres en el horario de la reserva (con el margen de la sucursal); la actual va primero.
  // Si se pasó de hora, sigue ocupando la plaza hasta que salga: se busca hasta ahora como mínimo.
  useEffect(() => {
    if (!active || !r.vtype) return;
    setSpaces(null);
    getSpaceAvailability(pid, r.vtype, r.startAt, new Date(Math.max(r.endAt.getTime(), Date.now())))
      .then(x => setSpaces(list(x).filter((s: any) => s.available && s.isActive !== false && s.id !== r.spaceId)))
      .catch(() => setSpaces([]));
  }, [active, pid, r.vtype, r.startAt, r.endAt, r.spaceId]);

  // Corre una acción, recarga la lista y avisa; el cajón queda abierto con la reserva actualizada.
  const run = async <T,>(fn: () => Promise<T>, ok: string | ((res: T) => string), type: 'ok' | 'info' = 'ok') => {
    setBusy(true);
    try {
      const res = await fn();
      await onChange();
      toast(typeof ok === 'function' ? ok(res) : ok, type);
    } catch (x) { toast(apiError(x, 'No se pudo completar la acción. Intentá de nuevo.'), 'err'); }
    setBusy(false);
  };

  const moveTo = (id: string) => run(() => changeReservationSpace(r.id, id, userId), `Reserva ${r.code} movida a la plaza ${spaces?.find(s => s.id === id)?.spaceCode}.`);
  // R-21: si su plaza seguía ocupada por alguien que se pasó de hora, el backend la pasó a otra libre.
  const checkedIn = (res: any) => {
    const code = res?.data?.parkingSpace?.spaceCode ?? r.space;
    return `Ingreso de ${r.plate} registrado en la plaza ${code}${code !== r.space ? `: la ${r.space} seguía ocupada` : ''}.`;
  };
  const cancel = async () => { setConfirm(false); await run(() => cancelReservation(r.id, userId), `Reserva ${r.code} cancelada.`, 'info'); onClose(); };

  // R-23: extender de a horas enteras: una hora más desde el fin o, si ya se pasó, la próxima hora entera. El backend valida máximo y cierre.
  const first = new Date(Math.max(r.endAt.getTime() + 3_600_000, Date.now()));
  if (first.getMinutes() || first.getSeconds() || first.getMilliseconds()) first.setHours(first.getHours() + 1, 0, 0, 0);
  const ends = [0, 1, 2].map(n => new Date(first.getTime() + n * 3_600_000));
  const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:00`;
  const extend = (end: Date) => run(() => extendReservation(r.id, end, userId), (res: any) => {
    const moved: { code: string; to: string }[] = res?.data?.moved ?? [];
    return `Reserva ${r.code} extendida hasta las ${hhmm(end)}.${moved.length ? ` ${plural(moved.length, 'reserva pasó', 'reservas pasaron')} a otra plaza: ${moved.map(m => `${m.code} → ${m.to}`).join(', ')}.` : ''}`;
  });

  // R-24: servicios de la cochera para agregar o quitar mientras la reserva no terminó (se cobran en la salida).
  const [offer, setOffer] = useState<Svc[]>([]);
  useEffect(() => {
    if (!active) return;
    getParkingServices(pid).then(x => setOffer(list(x).filter((s: any) => s.expirationDate == null)
      .map((s: any) => ({ id: s.id, name: s.serviceCatalog?.name ?? 'Servicio', price: Number(s.price) })))).catch(() => setOffer([]));
  }, [active, pid]);
  const options = [...r.services, ...offer.filter(s => !r.services.some(x => x.id === s.id))]; // los pedidos conservan su precio
  const toggleService = (s: Svc) => {
    const on = r.services.some(x => x.id === s.id);
    const ids = on ? r.services.filter(x => x.id !== s.id).map(x => x.id) : [...r.services.map(x => x.id), s.id];
    run(() => setReservationServices(r.id, ids, userId), on ? `${s.name} quitado de ${r.code}.` : `${s.name} agregado a ${r.code}: se cobra en la salida.`);
  };

  const primary =
    r.status === 'PENDIENTE' ? <button type="button" className="btn pri" disabled={busy} onClick={() => run(() => confirmReservation(r.id, userId),`Reserva ${r.code} confirmada.`)}>Confirmar reserva</button>
      : r.status === 'CONFIRMADA' ? <button type="button" className="btn pri" disabled={busy || early} onClick={() => run(() => checkInReservation(r.id, userId), checkedIn)}>Registrar ingreso</button>
        : r.status === 'EN CURSO' ? <button type="button" className="btn pri" disabled={busy} onClick={() => run(() => checkOutReservation(r.id, userId), `Salida de ${r.plate} registrada. Falta cobrar la estadía.`)}>Registrar salida</button>
          : toPay ? <button type="button" className="btn pri" disabled={busy} onClick={() => run(() => payInvoice(r.invoice!.id, method), `Estadía de ${r.code} cobrada: ${money(r.amount ?? 0)}.`)}>Registrar pago</button>
            : null;

  return (
    <>
      <Drawer title={r.code} sub={`Plaza ${r.space} · ${shD(r.date)} ${r.start} – ${r.end}`} onClose={onClose} focusSel=".dfoot .btn:last-child"
        footer={<div className="dfoot">
          {(r.status === 'PENDIENTE' || r.status === 'CONFIRMADA') && <button type="button" className="btn danger" disabled={busy} onClick={() => setConfirm(true)}>Cancelar reserva</button>}
          <button type="button" className="btn" onClick={onClose}>Cerrar</button>
          {primary}
        </div>}>
        <div className="dbody">
          <div className="fs"><div className="fh"><h3>Cliente</h3></div>
            <div className="li" style={{ padding: 0 }}><span className="l"><span className="av lg">{initials(...(r.client.n.split(' ') as [string, string]))}</span>
              <span><div className="nm">{r.client.n}</div><div className="ad">{[r.client.ph, r.client.em].filter(Boolean).join(' · ')}</div></span></span></div>
          </div>
          <div className="fs"><div className="fh"><h3>Reserva</h3><span className={`st ${ST[r.status].c}`}>{ST[r.status].l}</span></div>
            <dl className="dl" style={{ margin: 0 }}>
              <dt>Desde</dt><dd>{shD(r.date)} · {r.start}</dd>
              <dt>Hasta</dt><dd>{shD(r.endDate)} · {r.end}
                {active && <select className="sel" aria-label={`Extender la reserva ${r.code}`} value="" disabled={busy} style={{ marginTop: 6 }}
                  onChange={ev => ev.target.value && extend(ends[Number(ev.target.value)]!)}>
                  <option value="">Extender…</option>
                  {ends.map((d, i) => <option key={i} value={i}>Hasta las {hhmm(d)}{d.toDateString() !== r.endAt.toDateString() ? ` del ${shD(isoD(d))}` : ''}</option>)}
                </select>}</dd>
              <dt>Vehículo</dt><dd>{r.vtype ? `${r.vtype} · ` : ''}{r.plate}</dd>
              <dt>Plaza</dt><dd>{active
                ? <select className="sel" aria-label={`Plaza de la reserva ${r.code}`} value={r.spaceId} disabled={busy || spaces === null}
                  onChange={ev => ev.target.value !== r.spaceId && moveTo(ev.target.value)}>
                  <option value={r.spaceId}>{r.space} (actual)</option>
                  {(spaces ?? []).map(s => <option key={s.id} value={s.id}>{s.spaceCode}</option>)}
                </select>
                : r.space}</dd>
              <dt>Registrada por</dt><dd>{r.staff || '—'}</dd>
              {!active && r.services.length > 0 && <><dt>Servicios</dt><dd>{r.services.map(s => `${s.name} (${money(s.price)})`).join(', ')}</dd></>}
            </dl>
            {active && options.length > 0 && <>
              <p className="ctx" style={{ margin: '12px 0 6px' }}>Servicios</p>
              <div className="optlist" role="group" aria-label={`Servicios de la reserva ${r.code}`}>
                {options.map(s => {
                  const checked = r.services.some(x => x.id === s.id);
                  return (
                    <button key={s.id} type="button" role="checkbox" aria-checked={checked} className="opt" disabled={busy} onClick={() => toggleService(s)}>
                      <span className="grow">{s.name}</span><span className="tag">+{money(s.price)}</span>
                      {checked && <Check className="i" aria-hidden="true" />}
                    </button>
                  );
                })}
              </div>
            </>}
            {overdue(r) && <p className="ctx" style={{ margin: '8px 0 0' }}>Se pasó de hora: reservó hasta las {r.end} del {shD(r.endDate)}. Al registrar la salida se cobran las horas extra.</p>}
            {active && spaces?.length === 0 && <p className="ctx" style={{ margin: '8px 0 0' }}>No hay otra plaza libre para este vehículo en ese horario.</p>}
            {r.status === 'CONFIRMADA' && early && <p className="ctx" style={{ margin: '8px 0 0' }}>El ingreso se registra desde las {r.start} del {shD(r.date)}.</p>}
          </div>
          <div className="fs"><div className="fh"><h3>Importe</h3>{r.invoice && <span className={`st ${toPay ? 'warn' : 'ok'}`}>{toPay ? 'Por cobrar' : 'Cobrada'}</span>}</div>
            {r.amount != null
              ? <dl className="dl" style={{ margin: 0 }}>
                {r.bill && billLines(r.bill, r.services).map(([l, v]) => <div key={l} style={{ display: 'contents' }}><dt>{l}</dt><dd>{money(v)}</dd></div>)}
                <dt><b>Total</b></dt><dd><b>{money(r.amount)}</b></dd>
              </dl>
              : <p className="ctx" style={{ margin: 0 }}>Se calcula al registrar la salida: horas reservadas, más las extra si se quedó más tiempo, más los servicios.</p>}
            {toPay && <>
              <p className="ctx" style={{ margin: '12px 0 6px' }}>Medio de pago</p>
              <div className="seg" role="group" aria-label="Medio de pago">
                {METHODS.map(([k, l]) => <button type="button" key={k} aria-pressed={method === k} onClick={() => setMethod(k)}>{l}</button>)}
              </div>
            </>}
          </div>
        </div>
      </Drawer>
      <Presence open={confirm}><ConfirmModal title={`¿Cancelar la reserva ${r.code}?`} body={`${r.client.n} pierde la plaza ${r.space} reservada.`} ok="Cancelar reserva" back="Volver" danger onConfirm={cancel} onClose={() => setConfirm(false)} /></Presence>
    </>
  );
}
