import { useState } from 'react';
import { apiError } from '../../components/Owner/ui/Field';
import { useToast } from '../../components/Owner/ui/Toasts';
import { checkInReservation, checkOutReservation, confirmReservation } from '../../services/reservation.service';
import { normRes, type ParkingLike, type Res } from '../Owner/owner.lib';

export const list = (x: any) => (Array.isArray(x) ? x : x?.data ?? []);

// El empleado distingue pendiente de confirmada (el dueño las ve juntas como "Reservada").
export type Status = 'PENDIENTE' | 'CONFIRMADA' | 'EN CURSO' | 'FINALIZADA' | 'CANCELADA';
export const ST: Record<Status, { l: string; c: string }> = {
  PENDIENTE: { l: 'Pendiente', c: 'warn' }, CONFIRMADA: { l: 'Confirmada', c: 'ok' }, 'EN CURSO': { l: 'En curso', c: 'ac' },
  FINALIZADA: { l: 'Finalizada', c: 'mute' }, CANCELADA: { l: 'Cancelada', c: 'mute' },
};
export const ACTIVE: Status[] = ['PENDIENTE', 'CONFIRMADA', 'EN CURSO'];
// Tienen que coincidir con PaymentMethodSchema del backend (Invoice.Schema.ts).
export const METHODS: [string, string][] = [['EFECTIVO', 'Efectivo'], ['TARJETA_DEBITO', 'Débito'], ['TARJETA_CREDITO', 'Crédito'], ['MERCADO_PAGO', 'Mercado Pago'], ['TRANSFERENCIA', 'Transferencia']];

// Tiene que coincidir con CHECKOUT_GRACE_MINUTES del backend (R-14): minutos después del fin reservado sin cobrar hora extra.
export const GRACE_MIN = 10;
export const HOUR = 3_600_000;
export const person = (u: any) => [u?.name, u?.last_name].filter(Boolean).join(' ');
export const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

export interface Inv { id: string; status: string; method: string; received: number | null; receipt: string | null }
export interface ERes extends Res {
  status: Status; spaceId: string; startAt: Date; endAt: Date; staff: string;
  bm: string; // marca y modelo
  inBy: string; outBy: string; outAt: Date | null; // responsables de ingreso y de egreso (pueden ser de turnos distintos) y hora real de salida
  invoice: Inv | null;
}
export const normERes = (r: any): ERes => ({
  ...normRes(r),
  status: r.status, spaceId: r.parkingSpace?.id ?? '', startAt: new Date(r.startTime), endAt: new Date(r.endTime),
  staff: person(r.attendedBy), bm: [r.vehicle?.brand?.name, r.vehicle?.model?.name].filter(Boolean).join(' '),
  inBy: person(r.checkedInBy), outBy: person(r.checkedOutBy), outAt: r.checkedOutAt ? new Date(r.checkedOutAt) : null,
  invoice: r.invoice ? { id: r.invoice.id, status: r.invoice.status, method: r.invoice.paymentMethod ?? '', received: r.invoice.amountReceived ?? null, receipt: r.invoice.receiptNumber ?? null } : null,
});

export interface EParking extends ParkingLike { name: string; minReservationHours: number; maxReservationHours: number }

// Sigue adentro después del fin reservado: la salida cobra las horas extra (R-14) y la plaza no se libera (R-21).
export const overdue = (r: ERes) => r.status === 'EN CURSO' && r.endAt.getTime() < Date.now();
export const toPay = (r: ERes) => r.invoice?.status === 'PENDIENTE';
// Al registrar la salida el backend pisa endTime con la hora real: el fin reservado sale de las horas de la factura.
export const reservedEnd = (r: ERes) => (r.outAt && r.bill ? new Date(r.startAt.getTime() + r.bill.reservedHours * HOUR) : r.endAt);
// Horas extra que se cobrarían si sale a las `at`: misma cuenta que checkOut del backend.
export const extraAt = (r: ERes, at: Date) => {
  const reserved = Math.max(1, Math.ceil((r.endAt.getTime() - r.startAt.getTime()) / HOUR));
  const stayed = Math.ceil((at.getTime() - GRACE_MIN * 60_000 - r.startAt.getTime()) / HOUR);
  return Math.max(0, stayed - reserved);
};
// Etiqueta y color del estado, igual en la fila y en el detalle.
export const stateOf = (r: ERes): { l: string; c: string } =>
  overdue(r) ? { l: 'Se pasó de hora', c: 'err' } : r.status === 'FINALIZADA' && toPay(r) ? { l: 'Por cobrar', c: 'warn' } : ST[r.status];

// Acción principal de una reserva según su estado; la usan la fila y el detalle. El cobro no tiene llamada: pide el medio en el detalle.
export interface Action { key: 'confirm' | 'in' | 'out' | 'pay'; label: string; disabled?: boolean; call?: () => Promise<any>; ok?: string | ((res: any) => string) }
export function primaryOf(r: ERes, userId: string): Action | null {
  if (r.status === 'PENDIENTE') return { key: 'confirm', label: 'Confirmar', call: () => confirmReservation(r.id, userId), ok: `Reserva ${r.code} confirmada.` };
  if (r.status === 'CONFIRMADA') {
    const early = r.startAt.getTime() > Date.now(); // R-16: el ingreso se registra desde el inicio reservado
    // R-21: si su plaza seguía ocupada por alguien que se pasó de hora, el backend la pasó a otra libre.
    const ok = (res: any) => {
      const code = res?.data?.parkingSpace?.spaceCode ?? r.space;
      return `Ingreso de ${r.plate} registrado en la plaza ${code}${code !== r.space ? `: la ${r.space} seguía ocupada` : ''}.`;
    };
    return { key: 'in', label: early ? `Desde ${hhmm(r.startAt)}` : 'Registrar ingreso', disabled: early, call: () => checkInReservation(r.id, userId), ok };
  }
  if (r.status === 'EN CURSO') return { key: 'out', label: 'Registrar salida', call: () => checkOutReservation(r.id, userId), ok: `Salida de ${r.plate} registrada. Falta cobrar la estadía.` };
  if (r.status === 'FINALIZADA' && toPay(r)) return { key: 'pay', label: 'Cobrar' };
  return null;
}

// Corre una acción, recarga la lista y avisa con el mensaje del servidor si falla.
export function useRun(onChange: () => Promise<void>) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const run = async <T>(fn: () => Promise<T>, ok: string | ((res: T) => string), type: 'ok' | 'info' = 'ok') => {
    setBusy(true);
    try {
      const res = await fn();
      await onChange();
      toast(typeof ok === 'function' ? ok(res) : ok, type);
    } catch (x) { toast(apiError(x, 'No se pudo completar la acción. Intentá de nuevo.'), 'err'); }
    setBusy(false);
  };
  return { run, busy };
}
