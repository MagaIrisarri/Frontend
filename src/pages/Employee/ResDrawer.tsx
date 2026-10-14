import { useEffect, useState } from 'react';
import { AlarmClock, Clock } from 'lucide-react';
import { Drawer, ConfirmModal } from '../../components/Owner/ui/Layer';
import { Presence } from '../../components/Owner/ui/Presence';
import { Field, Input } from '../../components/Owner/ui/Field';
import { vehicleKey } from '../../components/Owner/ui/vehicles';
import { cancelReservation, changeReservationSpace, extendReservation, setReservationServices } from '../../services/reservation.service';
import { payInvoice } from '../../services/invoice.service';
import { getSpaceAvailability } from '../../services/parkingSpace.service';
import { getParkingServices } from '../../services/servicePrice.service';
import { billLines, initials, isoD, money, plural, priceOf, shD, type Svc } from '../Owner/owner.lib';
import { ACTIVE, GRACE_MIN, HOUR, METHODS, extraAt, hhmm, list, overdue, primaryOf, reservedEnd, stateOf, toPay, useRun, type EParking, type ERes } from './employee.lib';

const CARD_HINT = 'Se cobra en el posnet. El sistema guarda solo el medio y el comprobante, nunca los datos de la tarjeta.';

// Detalle de una reserva: cliente, reserva, servicios, importe y cobro, con la acción principal en el pie.
export default function ResDrawer({ r, parking, onChange, onClose }: { r: ERes; parking: EParking; onChange: () => Promise<void>; onClose: () => void }) {
  const pid = parking.id;
  const { run, busy } = useRun(onChange);
  const [confirm, setConfirm] = useState(false);
  const [spaces, setSpaces] = useState<{ id: string; spaceCode: string }[] | null>(null);
  const [method, setMethod] = useState('EFECTIVO');
  const [received, setReceived] = useState(''); // efectivo entregado; vacío = pagó justo
  const [receipt, setReceipt] = useState(''); // comprobante del posnet o la app, opcional
  const active = ACTIVE.includes(r.status);
  const due = toPay(r);
  const st = stateOf(r);
  const early = r.startAt.getTime() > Date.now(); // R-16: el ingreso se registra desde el inicio reservado
  const p = primaryOf(r);

  // Plazas del mismo tipo libres en el horario de la reserva (con el margen de la sucursal); la actual va primero.
  // Si se pasó de hora, sigue ocupando la plaza hasta que salga: se busca hasta ahora como mínimo.
  useEffect(() => {
    if (!active || !r.vtype) return;
    setSpaces(null);
    getSpaceAvailability(pid, r.vtype, r.startAt, new Date(Math.max(r.endAt.getTime(), Date.now())))
      .then(x => setSpaces(list(x).filter((s: any) => s.available && s.isActive !== false && s.id !== r.spaceId)))
      .catch(() => setSpaces([]));
  }, [active, pid, r.vtype, r.startAt, r.endAt, r.spaceId]);

  const moveTo = (id: string) => run(() => changeReservationSpace(r.id, id), `Reserva ${r.code} movida a la plaza ${spaces?.find(s => s.id === id)?.spaceCode}.`);
  const cancel = async () => { setConfirm(false); await run(() => cancelReservation(r.id), `Reserva ${r.code} cancelada.`, 'info'); onClose(); };

  // R-23: extender de a horas enteras: una hora más desde el fin o, si ya se pasó, la próxima hora entera. El backend valida máximo y cierre.
  const first = new Date(Math.max(r.endAt.getTime() + HOUR, Date.now()));
  if (first.getMinutes() || first.getSeconds() || first.getMilliseconds()) first.setHours(first.getHours() + 1, 0, 0, 0);
  const ends = [0, 1, 2].map(n => new Date(first.getTime() + n * HOUR));
  const hh = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:00`;
  const extend = (end: Date) => run(() => extendReservation(r.id, end), (res: any) => {
    const moved: { code: string; to: string }[] = res?.data?.moved ?? [];
    return `Reserva ${r.code} extendida hasta las ${hh(end)}.${moved.length ? ` ${plural(moved.length, 'reserva pasó', 'reservas pasaron')} a otra plaza: ${moved.map(m => `${m.code} → ${m.to}`).join(', ')}.` : ''}`;
  });

  // R-24: servicios de la cochera para agregar o quitar mientras la reserva no terminó (se cobran en la salida).
  const [offer, setOffer] = useState<Svc[]>([]);
  useEffect(() => {
    if (!active) return;
    getParkingServices(pid).then(x => setOffer(list(x).filter((s: any) => s.expirationDate == null)
      .map((s: any) => ({ id: s.id, name: s.serviceCatalog?.name ?? 'Servicio', price: Number(s.price) })))).catch(() => setOffer([]));
  }, [active, pid]);
  const options = active ? [...r.services, ...offer.filter(s => !r.services.some(x => x.id === s.id))] : r.services; // los pedidos conservan su precio
  const toggleService = (s: Svc) => {
    const on = r.services.some(x => x.id === s.id);
    const ids = on ? r.services.filter(x => x.id !== s.id).map(x => x.id) : [...r.services.map(x => x.id), s.id];
    run(() => setReservationServices(r.id, ids), on ? `${s.name} quitado de ${r.code}.` : `${s.name} agregado a ${r.code}: se cobra en la salida.`);
  };

  // Importe: con factura, su detalle (R-14); antes de la salida, una estimación con la tarifa vigente y las horas extra de ahora.
  const rate = priceOf(parking, vehicleKey(r.vtype))?.price ?? null;
  const reservedH = Math.max(1, Math.ceil((r.endAt.getTime() - r.startAt.getTime()) / HOUR));
  const extraNow = overdue(r) ? extraAt(r, new Date()) : 0;
  const lines: [string, number][] = r.bill ? billLines(r.bill, r.services)
    : rate != null ? [[`${plural(reservedH + extraNow, 'hora', 'horas')} × ${money(rate)}`, (reservedH + extraNow) * rate], ...r.services.map((s): [string, number] => [s.name, s.price])] : [];
  const total = r.amount ?? (rate != null ? lines.reduce((a, [, v]) => a + v, 0) : null);
  const closeAt = reservedEnd(r);

  // Cobro en efectivo: tiene que cubrir el total; el vuelto se calcula acá y el backend guarda lo recibido.
  const cash = method === 'EFECTIVO';
  const recv = received === '' ? null : Number(received);
  const lacking = cash && recv != null && recv < (total ?? 0) ? (total ?? 0) - recv : 0;
  const change = cash && recv != null && recv >= (total ?? 0) ? recv - (total ?? 0) : 0;
  const pay = () => run(() => payInvoice(r.invoice!.id, method, cash ? (recv != null ? { amountReceived: recv } : {}) : receipt.trim() ? { receiptNumber: receipt.trim() } : {}),
    `Estadía de ${r.code} cobrada: ${money(total ?? 0)}${change ? `. Vuelto ${money(change)}` : ''}.`);

  const primaryLabel = p?.key === 'confirm' ? 'Confirmar reserva' : p?.key === 'in' && early ? `Ingreso desde ${hhmm(r.startAt)}` : p?.key === 'pay' ? 'Registrar pago' : p?.label;
  const primary = p && (
    <button type="button" className="btn pri" disabled={busy || p.disabled || (p.key === 'pay' && lacking > 0)}
      onClick={() => p.key === 'pay' ? pay() : run(p.call!, p.ok!)}>{primaryLabel}</button>
  );

  return (
    <>
      <Drawer title={<><span className="e-code">{r.code}</span><span className="e-pl e-big">{r.plate}</span></>} sub={<span className={`st ${st.c}`}>{st.l}</span>} onClose={onClose} focusSel=".dfoot .btn:last-child"
        footer={<div className="dfoot">
          {(r.status === 'PENDIENTE' || r.status === 'CONFIRMADA') && <button type="button" className="btn danger" disabled={busy} onClick={() => setConfirm(true)}>Cancelar reserva</button>}
          <button type="button" className="btn" onClick={onClose}>Cerrar</button>
          {primary}
        </div>}>
        <div className="dbody">
          <section className="fs"><div className="fh"><h3>Cliente</h3></div>
            <div className="li" style={{ padding: 0 }}><span className="l"><span className="av lg">{initials(...(r.client.n.split(' ') as [string, string]))}</span>
              <span><div className="nm">{r.client.n}</div><div className="ad">{[r.client.ph, r.client.em].filter(Boolean).join(' · ')}</div></span></span></div>
            <div className="e-note"><Clock className="i" aria-hidden="true" /><span>Los avisos de esta reserva le llegan a las notificaciones de la app: confirmación, cambio de plaza, extensión, salida y cancelación.</span></div>
          </section>

          <section className="fs"><div className="fh"><h3>Reserva</h3></div>
            <dl className="dl" style={{ margin: 0 }}>
              <dt>Vehículo</dt><dd>{[r.bm, r.vtype].filter(Boolean).join(' · ') || '—'}</dd>
              <dt>Plaza</dt><dd>{r.space}</dd>
              {(r.status === 'EN CURSO' || r.status === 'FINALIZADA') && <>
                <dt>Ingreso</dt><dd>{r.inBy ? `Registrado por ${r.inBy}` : 'Sin registrar'}</dd>
                <dt>Egreso</dt><dd>{r.outBy ? `Registrado por ${r.outBy}` : 'Sin registrar'}</dd>
              </>}
              <dt>Horario</dt><dd>{shD(r.date)} · {r.start} – {hhmm(closeAt)} ({r.bill ? r.bill.reservedHours : reservedH} h){shD(isoD(closeAt)) !== shD(r.date) ? ` hasta el ${shD(isoD(closeAt))}` : ''}</dd>
              {r.status === 'FINALIZADA' && r.outAt && <><dt>Salida real</dt><dd>{hhmm(r.outAt)}{r.bill?.extraHours ? ` · ${plural(r.bill.extraHours, 'hora extra', 'horas extra')}` : ''}</dd></>}
              <dt>Registrada por</dt><dd>{r.staff || '—'}</dd>
            </dl>
            {active && <div className="grid2">
              <Field label="Extender">{(id, aria) => <select className="sel" id={id} {...aria} aria-label={`Extender la reserva ${r.code}`} value="" disabled={busy}
                onChange={ev => ev.target.value && extend(ends[Number(ev.target.value)]!)}>
                <option value="">Elegir…</option>
                {ends.map((d, i) => <option key={i} value={i}>Hasta las {hh(d)}{d.toDateString() !== r.endAt.toDateString() ? ` del ${shD(isoD(d))}` : ''}</option>)}
              </select>}</Field>
              <Field label="Cambiar plaza">{(id, aria) => <select className="sel" id={id} {...aria} aria-label={`Plaza de la reserva ${r.code}`} value={r.spaceId} disabled={busy || spaces === null}
                onChange={ev => ev.target.value !== r.spaceId && moveTo(ev.target.value)}>
                <option value={r.spaceId}>{r.space} (actual)</option>
                {(spaces ?? []).map(s => <option key={s.id} value={s.id}>{s.spaceCode}</option>)}
              </select>}</Field>
            </div>}
            {overdue(r) && <div className="e-note warn"><AlarmClock className="i" aria-hidden="true" /><span>Se pasó de hora: reservó hasta las {r.end} del {shD(r.endDate)}. {extraNow > 0
              ? `Si registrás la salida ahora (${hhmm(new Date())}) se cobran ${plural(extraNow, 'hora extra', 'horas extra')}.`
              : `Si registrás la salida ahora (${hhmm(new Date())}) no se cobran horas extra: hay ${GRACE_MIN} min de gracia.`}</span></div>}
            {active && spaces?.length === 0 && <p className="dim" style={{ margin: 0 }}>No hay otra plaza libre para este vehículo en ese horario.</p>}
            {r.status === 'CONFIRMADA' && early && <p className="dim" style={{ margin: 0 }}>El ingreso se registra desde las {r.start} del {shD(r.date)}.</p>}
          </section>

          {options.length > 0 && <section className="fs"><div className="fh"><h3>Servicios</h3></div>
            <div className="e-opts" role="group" aria-label={`Servicios de la reserva ${r.code}`}>
              {options.map(s => (
                <button key={s.id} type="button" role="checkbox" aria-checked={r.services.some(x => x.id === s.id)} className="e-opt" disabled={busy || !active} onClick={() => toggleService(s)}>
                  <span>{s.name}</span><span>+{money(s.price)}</span>
                </button>
              ))}
            </div>
            {active && <span className="dim">Se cobran en la salida.</span>}
          </section>}

          {r.status !== 'CANCELADA' && <section className="fs"><div className="fh"><h3>Importe · {due ? 'por cobrar' : r.invoice?.status === 'PAGADA' ? 'cobrado' : 'estimado'}</h3></div>
            {total != null
              ? <div className={`e-sum${due ? ' por' : ''}`}>
                {lines.map(([l, v]) => <div key={l}><span>{l}</span><span>{money(v)}</span></div>)}
                <div className="t"><span>Total</span><span>{money(total)}</span></div>
              </div>
              : <p className="dim" style={{ margin: 0 }}>Se calcula al registrar la salida: horas reservadas, más las extra si se quedó más tiempo, más los servicios.</p>}
          </section>}

          {due && <section className="fs"><div className="fh"><h3>Cobro</h3></div>
            <div className="grid2">
              <Field label="Medio de pago">{(id, aria) => <select className="sel" id={id} {...aria} value={method} onChange={e => { setMethod(e.target.value); setReceived(''); setReceipt(''); }}>
                {METHODS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>}</Field>
              {cash
                ? <Input label="Efectivo recibido" inputMode="numeric" placeholder={String(total ?? '')} value={received} onChange={e => setReceived(e.target.value.replace(/\D/g, ''))} />
                : <Input label="Nº de comprobante (opcional)" maxLength={60} autoComplete="off" placeholder="Posnet / operación" value={receipt} onChange={e => setReceipt(e.target.value)} />}
            </div>
            {cash
              ? <>
                <span className="dim">Dejalo vacío si paga justo {money(total ?? 0)}.</span>
                <div className={`e-vt${lacking > 0 ? ' err' : recv != null ? ' ok' : ''}`} role="status">
                  <span>{lacking > 0 ? 'Falta cobrar' : 'Vuelto a entregar'}</span><b>{money(lacking > 0 ? lacking : change)}</b>
                </div>
                {lacking > 0 && <span className="ferr" role="alert">Faltan {money(lacking)} para cubrir {money(total ?? 0)}.</span>}
              </>
              : <span className="dim">{method.startsWith('TARJETA') ? CARD_HINT : 'Se guarda el medio y el comprobante para conciliar.'}</span>}
          </section>}

          {r.invoice?.status === 'PAGADA' && r.invoice.method && <section className="fs"><div className="fh"><h3>Cobro</h3></div>
            <dl className="dl" style={{ margin: 0 }}>
              <dt>Medio de pago</dt><dd>{METHODS.find(([k]) => k === r.invoice!.method)?.[1] ?? r.invoice.method}</dd>
              {r.invoice.received != null && <><dt>Recibido</dt><dd>{money(r.invoice.received)}{total != null && r.invoice.received > total && ` · vuelto ${money(r.invoice.received - total)}`}</dd></>}
              {r.invoice.receipt && <><dt>Comprobante</dt><dd>{r.invoice.receipt}</dd></>}
            </dl>
          </section>}
        </div>
      </Drawer>
      <Presence open={confirm}><ConfirmModal title={`¿Cancelar la reserva ${r.code}?`} body={`${r.client.n} pierde la plaza ${r.space} reservada.`} ok="Cancelar reserva" back="Volver" danger onConfirm={cancel} onClose={() => setConfirm(false)} /></Presence>
    </>
  );
}
