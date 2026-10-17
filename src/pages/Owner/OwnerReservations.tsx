import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarDays, ChevronLeft, ChevronRight, Download, Search } from 'lucide-react';
import { Drawer, ConfirmModal } from '../../components/Owner/ui/Layer';
import { Presence, Shown } from '../../components/Owner/ui/Presence';
import { Empty, ErrorBox, PageHead, SkeletonRows } from '../../components/Owner/ui/Page';
import { Input, apiError } from '../../components/Owner/ui/Field';
import { useToast } from '../../components/Owner/ui/Toasts';
import { cancelReservation, getReservation } from '../../services/reservation.service';
import { getRange } from '../../services/shift.service';
import { Stars } from '../../components/Owner/ui/Stars';
import { useSortable } from '../../components/Owner/ui/Sortable';
import { useOwner, type Emp } from './OwnerContext';
import {
  RS, addD, billLines, cap, downloadCsv, fmtD, fmtH, initials, mm, money, normRes, plural, shD, today, type Res, type ResState,
} from './owner.lib';

type StFilter = 'all' | ResState;
const ST_SEGS: [StFilter, string][] = [['all', 'Todas'], ['curso', 'En curso'], ['reservada', 'Reservadas'], ['finalizada', 'Finalizadas'], ['cancelada', 'Canceladas']];
const empName = (e?: Emp) => (e ? `${e.name} ${e.last_name}` : '');

export default function OwnerReservations() {
  const { reservations, employees, status, refresh } = useOwner();
  const [params] = useSearchParams();
  const [mode, setMode] = useState<'day' | 'month'>('day');
  const [openId, setOpenId] = useState<string | null>(null);
  const open = reservations.find(r => r.id === openId);

  return (
    <>
      <PageHead title="Reservas" />
      <div className="seg" role="group" aria-label="Vista de reservas">
        {([['day', 'Listado por fecha'], ['month', 'Resumen mensual']] as const).map(([k, l]) =>
          <button type="button" key={k} aria-pressed={mode === k} onClick={() => setMode(k)}>{l}</button>)}
      </div>
      {status === 'error' ? <ErrorBox what="las reservas" onRetry={refresh} />
        : status === 'loading' ? <SkeletonRows n={5} />
          : mode === 'day' ? <DayList reservations={reservations} employees={employees} initial={(params.get('s') as StFilter) || 'all'} onOpen={setOpenId} />
            : <MonthSummary reservations={reservations} employees={employees} onOpen={setOpenId} />}
      <Shown when={open}>{r => <ResDetail r={r} onClose={() => setOpenId(null)} />}</Shown>
    </>
  );
}

type SortKey = 'code' | 'desde' | 'hasta' | 'horas' | 'emp' | 'monto';

// Orden por columna, compartido por el listado por fecha y el resumen mensual (useSortable, como Personal).
function useSort(employees: Emp[], init: { k: SortKey; d: 1 | -1 }) {
  const emp = (id: string | null) => employees.find(e => e.id === id);
  const { sorted, th } = useSortable<Res, SortKey>({
    code: r => r.code, desde: r => r.date + r.start, hasta: r => r.endDate + r.end, horas: r => r.hours,
    emp: r => empName(emp(r.eid)), monto: r => r.amount ?? -1,
  }, init, (a, b) => (a.date + a.start).localeCompare(b.date + b.start));
  return { emp, sorted, th };
}

function DayList({ reservations, employees, initial, onOpen }: { reservations: Res[]; employees: Emp[]; initial: StFilter; onOpen: (id: string) => void }) {
  const { parkings } = useOwner();
  const { emp, sorted, th } = useSort(employees, { k: 'desde', d: -1 });
  const now = today();
  const [rd, setRd] = useState(now);
  const [rs, setRs] = useState<StFilter>(initial);
  const [rq, setRq] = useState('');
  const [rp, setRp] = useState('');
  // Un día pasado no puede tener reservas en curso ni pendientes.
  const only: StFilter[] | null = rd < now ? ['all', 'finalizada', 'cancelada'] : null;
  const st = only && !only.includes(rs) ? 'all' : rs;
  const D = reservations.filter(r => r.date === rd);
  const q = rq.trim().toLowerCase().replace(/[\s-]/g, '');
  const list = sorted(D.filter(r => (st === 'all' || r.st === st) && (!rp || r.pid === rp) && (!q || (r.plate + r.code).toLowerCase().replace(/-/g, '').includes(q))));
  const sum = list.reduce((a, r) => a + (r.amount ?? 0), 0), hs = list.reduce((a, r) => a + r.hours, 0);
  const csv = () => downloadCsv(`reservas-${rd}.csv`, [
    ['Código', 'Patente', 'Sucursal', 'Plaza', 'Desde', 'Hasta', 'Horas', 'Empleado', 'Estado', 'Importe'],
    ...list.map(r => [r.code, r.plate, r.pname, r.space, `${r.date} ${r.start}`, `${r.endDate} ${r.end}`, fmtH(r.hours), empName(emp(r.eid)), RS[r.st].l, r.amount]),
  ]);

  let t;
  if (!D.length) t = <Empty icon={<CalendarDays className="i" />} title={`Sin reservas el ${fmtD(rd)}`}>Probá con otra fecha. Las reservas de tus sucursales aparecen acá con su código y su importe.</Empty>;
  else if (!list.length) t = <Empty icon={<Search className="i" />} title="Sin resultados" action={<button type="button" className="btn" onClick={() => { setRs('all'); setRq(''); setRp(''); }}>Limpiar filtros</button>}>Ninguna reserva coincide con los filtros actuales.</Empty>;
  else t = (
    <div className="panel tw"><table className="tbl rs">
      <colgroup><col style={{ width: '15%' }} /><col /><col style={{ width: 80 }} /><col style={{ width: '17%' }} /><col style={{ width: 120 }} /><col style={{ width: 110 }} /><col style={{ width: 120 }} /></colgroup>
      <thead><tr>{th('code', 'Código')}{th('desde', 'Sucursal')}{th('horas', 'Horas')}{th('emp', 'Empleado')}<th>Estado</th>{th('monto', 'Importe', 'r')}<th><span className="sr">Acciones</span></th></tr></thead>
      <tbody>{list.map(r => {
        const e = emp(r.eid);
        return (
          <tr key={r.id}>
            <td><span className="plate">{r.code}</span><div className="ad">{r.plate}</div></td>
            <td data-label="Sucursal"><span className="nm">{r.pname}</span><div className="ad">Plaza {r.space} · {r.start} – {r.end}{r.endDate !== r.date ? ` (${shD(r.endDate)})` : ''}</div></td>
            <td data-label="Horas">{fmtH(r.hours)}</td>
            <td data-label="Empleado">{e ? empName(e) : <span className="na">Sin asignar</span>}</td>
            <td data-label="Estado"><span className={`st ${RS[r.st].c}`}>{RS[r.st].l}</span></td>
            <td className="r" data-label="Importe">{r.amount != null ? money(r.amount) : <span className="na">—</span>}</td>
            <td className="r"><div className="acts"><button type="button" className="btn sm" aria-label={`Ver detalle de la reserva ${r.code}`} onClick={() => onOpen(r.id)}>Ver detalle</button></div></td>
          </tr>
        );
      })}</tbody>
      <tfoot><tr className="tot"><td colSpan={2}>{plural(list.length, 'reserva', 'reservas')}</td><td>{fmtH(hs)}</td><td colSpan={2} /><td className="r">{money(sum)}</td><td /></tr></tfoot>
    </table></div>
  );

  return (
    <>
      <p className="ctx" style={{ marginBottom: -4 }}>{cap(fmtD(rd))}{rd === now ? ' · hoy' : ''}</p>
      <div className="toolbar">
        <div className="dt" role="group" aria-label="Fecha">
          <button type="button" className="icon-btn" aria-label="Día anterior" onClick={() => setRd(addD(rd, -1))}><ChevronLeft className="i" /></button>
          {/* shortcut: L-24, solo hasta hoy como en el prototipo; las reservas futuras se ven el día que corresponden */}
          <input className="inp" type="date" value={rd} max={now} aria-label="Fecha de las reservas" onChange={e => e.target.value && e.target.value <= now && setRd(e.target.value)} />
          <button type="button" className="icon-btn" aria-label="Día siguiente" disabled={rd >= now} onClick={() => setRd(addD(rd, 1))}><ChevronRight className="i" /></button>
          <button type="button" className="btn" disabled={rd === now} onClick={() => setRd(now)}>Hoy</button>
        </div>
        <div className="search"><Search className="i" /><input className="inp" type="search" placeholder="Buscar por código o patente" aria-label="Buscar por código o patente" value={rq} onChange={e => setRq(e.target.value)} /></div>
        <select className="sel" aria-label="Filtrar por sucursal" style={{ width: 240 }} value={rp} onChange={e => setRp(e.target.value)}>
          <option value="">Todas las sucursales</option>{parkings.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <button type="button" className="btn" disabled={!list.length} onClick={csv}><Download className="i sm" />Descargar CSV</button>
      </div>
      <div className="seg" role="group" aria-label="Filtrar por estado" style={{ justifySelf: 'start' }}>
        {ST_SEGS.filter(([k]) => !only || only.includes(k)).map(([k, l]) => (
          <button type="button" key={k} aria-pressed={st === k} onClick={() => setRs(k)}>{l}<b>{D.filter(r => k === 'all' || r.st === k).length}</b></button>
        ))}
      </div>
      {t}
    </>
  );
}

function MonthSummary({ reservations, employees, onOpen }: { reservations: Res[]; employees: Emp[]; onOpen: (id: string) => void }) {
  const { parkings } = useOwner();
  const toast = useToast();
  const now = today();
  const [rm, setRm] = useState(now.slice(0, 7));
  const { emp, sorted, th } = useSort(employees, { k: 'desde', d: 1 });
  const [ms, setMs] = useState<StFilter>('finalizada');
  const [hours, setHours] = useState<Record<string, { h: number; f: number }> | null>(null);
  const [y, m] = rm.split('-').map(Number) as [number, number];
  const label = new Date(y, m - 1, 1).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
  const shiftMonth = (n: number) => { const d = new Date(y, m - 1 + n, 1); setRm(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`); };

  // D-07: horas programadas (semana tipo + fechas especiales) hasta hoy, no asistencia real.
  // shortcut: L-02, son horas programadas, agregar fichaje o ajuste manual auditado antes de liquidar
  // L-01: cada fecha se resuelve en el servidor con la semana tipo que regía ese día.
  useEffect(() => {
    const from = `${rm}-01`, last = `${rm}-${String(new Date(y, m, 0).getDate()).padStart(2, '0')}`, to = last < now ? last : now;
    setHours(null);
    if (from > now) { setHours({}); return; }
    Promise.all(parkings.map(p => getRange(p.id, from, to))).then(all => {
      const acc: Record<string, { h: number; f: number }> = {};
      all.flat().forEach(d => d.shifts.forEach(s => {
        const h = (mm(s.to) - mm(s.from)) / 60;
        const x = (acc[s.employeeId] ??= { h: 0, f: 0 });
        x.h += h;
        if (d.holiday) x.f += h;
      }));
      setHours(acc);
    }).catch(() => { setHours({}); toast('No se pudieron calcular las horas por empleado.', 'err'); });
  }, [rm, parkings, y, m, now, toast]);

  const M = reservations.filter(r => r.date.slice(0, 7) === rm);
  const list = sorted(M.filter(r => ms === 'all' || r.st === ms));
  const sum = list.reduce((a, r) => a + (r.amount ?? 0), 0), hs = list.reduce((a, r) => a + r.hours, 0);
  // R-27: valoración promedio del mes por sucursal, con las reservas que la tienen.
  const rated = new Map<string, number[]>();
  M.forEach(r => { if (r.rating != null) rated.set(r.pname, [...(rated.get(r.pname) ?? []), r.rating]); });
  const ratings = [...rated].map(([p, v]) => `${p}: ${(v.reduce((a, b) => a + b, 0) / v.length).toLocaleString('es-AR', { maximumFractionDigits: 1 })} de 5 (${plural(v.length, 'valoración', 'valoraciones')})`);

  const csv = () => downloadCsv(`reservas-${rm}.csv`, [
    ['Código', 'Desde', 'Hasta', 'Horas', 'Empleado', 'Importe'],
    ...list.map(r => [r.code, `${r.date} ${r.start}`, `${r.endDate} ${r.end}`, fmtH(r.hours), empName(emp(r.eid)), r.amount]),
  ]);
  const staff = employees.filter(e => e.parkingId);

  return (
    <>
      <div className="toolbar">
        <div className="dt" role="group" aria-label="Mes">
          <button type="button" className="icon-btn" aria-label="Mes anterior" onClick={() => shiftMonth(-1)}><ChevronLeft className="i" /></button>
          <span style={{ minWidth: 132, textAlign: 'center', fontWeight: 500 }} aria-live="polite">{cap(label)}</span>
          <button type="button" className="icon-btn" aria-label="Mes siguiente" disabled={rm >= now.slice(0, 7)} onClick={() => shiftMonth(1)}><ChevronRight className="i" /></button>
        </div>
        <span className="grow" />
        <button type="button" className="btn" disabled={!list.length} onClick={csv}><Download className="i sm" />Descargar CSV</button>
      </div>
      <div className="seg" role="group" aria-label="Filtrar por estado" style={{ justifySelf: 'start' }}>
        {ST_SEGS.map(([k, l]) => (
          <button type="button" key={k} aria-pressed={ms === k} onClick={() => setMs(k)}>{l}<b>{M.filter(r => k === 'all' || r.st === k).length}</b></button>
        ))}
      </div>
      {!M.length ? <Empty icon={<CalendarDays className="i" />} title="Sin reservas">No hay reservas en {label}.</Empty>
        : !list.length ? <Empty icon={<Search className="i" />} title="Sin resultados" action={<button type="button" className="btn" onClick={() => setMs('all')}>Limpiar filtros</button>}>Ninguna reserva de {label} está en ese estado.</Empty> : (
        <>
          <div className="panel tw"><table className="tbl rm">
            <colgroup><col style={{ width: '14%' }} /><col style={{ width: '15%' }} /><col style={{ width: '15%' }} /><col style={{ width: '10%' }} /><col /><col style={{ width: 120 }} /></colgroup>
            <thead><tr>{th('code', 'Código')}{th('desde', 'Desde')}{th('hasta', 'Hasta')}{th('horas', 'Horas')}{th('emp', 'Empleado')}{th('monto', 'Importe', 'r')}</tr></thead>
            <tbody>{list.map(r => {
              const e = emp(r.eid);
              return (
                <tr key={r.id}>
                  <td data-label="Código"><button type="button" className="nm" aria-label={`Ver detalle de la reserva ${r.code}`} onClick={() => onOpen(r.id)}>{r.code}</button></td>
                  <td data-label="Desde">{shD(r.date)} {r.start}</td><td data-label="Hasta">{shD(r.endDate)} {r.end}</td>
                  <td data-label="Horas">{fmtH(r.hours)}</td>
                  <td data-label="Empleado">{e ? empName(e) : <span className="na">Sin asignar</span>}</td>
                  <td className="r" data-label="Importe">{r.amount != null ? money(r.amount) : <span className="na">—</span>}</td>
                </tr>
              );
            })}</tbody>
            <tfoot><tr className="tot"><td colSpan={3}>{plural(list.length, 'reserva', 'reservas')}</td><td>{fmtH(hs)}</td><td /><td className="r">{money(sum)}</td></tr></tfoot>
          </table></div>
          <p className="ctx">{ms === 'all' ? 'Todas las reservas del mes' : `Solo reservas en estado ${RS[ms].l.toLowerCase()}`}. Importe: total de la factura; las reservas sin factura no suman. Tocá un encabezado para ordenar.</p>
        </>
      )}
      {ratings.length > 0 && <p className="ctx">Valoración promedio del mes · {ratings.join(' · ')}</p>}
      <div className="fs" style={{ marginTop: 20 }}>
        <div className="fh"><h3>Horas trabajadas por empleado</h3></div>
        <p className="ctx" style={{ margin: '0 0 10px' }}>Horas programadas según la semana tipo y las fechas especiales, hasta hoy.</p>
        {hours === null ? <SkeletonRows n={2} cols={4} /> : (
          <div className="panel tw"><table className="tbl">
            <thead><tr><th>Empleado</th><th>Sucursal</th><th className="r">Horas del mes</th><th className="r">En feriados</th></tr></thead>
            <tbody>{staff.map(e => {
              const x = hours[e.id] ?? { h: 0, f: 0 };
              return (
                <tr key={e.id}><td data-label="Empleado">{empName(e)}</td><td data-label="Sucursal">{parkings.find(p => p.id === e.parkingId)?.name ?? '—'}</td>
                  <td className="r" data-label="Horas del mes">{fmtH(x.h)}</td><td className="r" data-label="En feriados">{x.f ? fmtH(x.f) : <span className="na">—</span>}</td></tr>
              );
            })}</tbody>
          </table></div>
        )}
      </div>
    </>
  );
}

function ResDetail({ r: fromList, onClose }: { r: Res; onClose: () => void }) {
  const { employees, refresh } = useOwner();
  const toast = useToast();
  // El detalle se pide al backend (GET /api/reservations/:id); mientras llega, se ve lo que trajo el listado.
  const [detail, setDetail] = useState<Res | null>(null);
  useEffect(() => {
    let alive = true;
    setDetail(null);
    getReservation(fromList.id)
      .then(res => { if (alive) setDetail(normRes(res.data)); })
      .catch(x => { if (alive) toast(apiError(x), 'err'); });
    return () => { alive = false; };
  }, [fromList.id, toast]);
  const r = detail ?? fromList;
  const [confirm, setConfirm] = useState(false);
  const [reason, setReason] = useState('');
  const [reasonErr, setReasonErr] = useState('');
  const e = employees.find(x => x.id === r.eid);
  const cin = employees.find(x => x.id === r.cin);
  // El motivo le llega al cliente. No hay reembolso: se cobra en la salida, así que cancelar una pendiente no mueve dinero.
  const cancel = async () => {
    if (!reason.trim()) { setReasonErr('Escribí el motivo: se lo avisamos al cliente.'); return; }
    try {
      await cancelReservation(r.id, reason.trim());
      setConfirm(false);
      onClose();
      await refresh();
      toast(`Reserva ${r.code} cancelada.`, 'info');
    } catch (x) { setConfirm(false); toast(apiError(x), 'err'); }
  };

  return (
    <>
      <Drawer title={r.code} sub={`${r.pname} · Plaza ${r.space}`} onClose={onClose} focusSel=".dfoot .btn:last-child"
        footer={<div className="dfoot">{r.st === 'reservada' && <button type="button" className="btn danger" onClick={() => setConfirm(true)}>Cancelar reserva</button>}<button type="button" className="btn" onClick={onClose}>Cerrar</button></div>}>
        <div className="dbody">
          <div className="fs"><div className="fh"><h3>Cliente</h3></div>
            <div className="li" style={{ padding: 0 }}><span className="l"><span className="av lg">{initials(...(r.client.n.split(' ') as [string, string]))}</span>
              <span><div className="nm">{r.client.n}</div><div className="ad">{[r.client.ph, r.client.em].filter(Boolean).join(' · ')}</div></span></span></div>
          </div>
          <div className="fs"><div className="fh"><h3>Reserva</h3><span className={`st ${RS[r.st].c}`}>{RS[r.st].l}</span></div>
            <dl className="dl" style={{ margin: 0 }}>
              <dt>Desde</dt><dd>{shD(r.date)} · {r.start}</dd><dt>Hasta</dt><dd>{shD(r.endDate)} · {r.end}</dd>
              <dt>Vehículo</dt><dd>{r.vtype ? `${r.vtype} · ` : ''}{r.plate}</dd>
              {/* R-07: la asignación sale de los turnos y se actualiza sola cuando cambian (R-06); no se edita a mano. */}
              <dt>Asignada a</dt><dd>{e ? empName(e) : <span className="na">Sin asignar</span>}</dd>
              {r.cin && <><dt>Ingresada por</dt><dd>{cin ? empName(cin) : '—'}</dd></>}
            </dl>
          </div>
          <div className="fs"><div className="fh"><h3>Importe</h3></div>
            <dl className="dl" style={{ margin: 0 }}>
              {r.bill && billLines(r.bill, r.services).map(([l, v]) => <div key={l} style={{ display: 'contents' }}><dt>{l}</dt><dd>{money(v)}</dd></div>)}
              <dt>Importe</dt><dd>{r.amount != null ? money(r.amount) : '—'}</dd>
              {r.st === 'finalizada' && <><dt>Valoración</dt><dd>{r.rating != null ? <><Stars value={r.rating} /> {r.rating} de 5</> : <span className="na">Sin valorar</span>}</dd></>}
            </dl>
          </div>
        </div>
      </Drawer>
      <Presence open={confirm}><ConfirmModal title={`¿Cancelar la reserva ${r.code}?`} body="El cliente pierde el lugar reservado y recibe un aviso con el motivo." ok="Cancelar reserva" back="Volver" danger onConfirm={cancel} onClose={() => setConfirm(false)}>
        <Input label="Motivo" data-first maxLength={300} value={reason} error={reasonErr} onChange={e => { setReason(e.target.value); setReasonErr(''); }} />
      </ConfirmModal></Presence>
    </>
  );
}
