// Lógica pura del rol dueño del prototipo original: formatos, normalización de datos y edición del calendario de turnos.
// Sin React ni red: se prueba con `node tests/owner.lib.test.ts`.
import type { ParkingPriceRow, SpaceType } from '../../types/parking.types';
import { arDate, arTime } from '../../utils/date.js';

// ---------- formatos ----------
export const money = (n: number) => '$' + Number(n).toLocaleString('es-AR');
const pad = (n: number) => String(n).padStart(2, '0');
export const isoD = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
// isoD: cuentas de calendario con fechas 'AAAA-MM-DD' (addD, wdOf). Para el día de un instante, arDate (L-04).
// L-04: "hoy" y la hora de ahora en la zona de las sucursales, no en la del navegador. El reloj es el de la PC.
export const today = () => arDate(new Date());
// L-03: minutos del día de ahora, en la misma zona que today().
export const nowMin = () => mm(arTime(new Date()));
export const addD = (iso: string, n: number) => { const d = new Date(iso + 'T12:00'); d.setDate(d.getDate() + n); return isoD(d); };
export const cap = (t: string) => t ? t[0]!.toUpperCase() + t.slice(1) : t;
export const fmtD = (iso: string) => new Date(iso + 'T12:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
export const shD = (iso: string) => iso.slice(8) + '/' + iso.slice(5, 7);
export const fmtH = (h: number) => String(Math.round(h * 10) / 10).replace('.', ',') + ' h';

// Precio en pesos enteros, como se cobra: acepta puntos de miles ("1.500"). Una coma o centavos son un error a la vista,
// no se descartan en silencio (antes "1500,50" quedaba en 150050). Devuelve el número o el mensaje para el campo.
export const PESOS_FORMAT = 'Ingresá el precio en pesos, sin centavos.';
export function parsePesos(s: string): number | string {
  const t = s.replace(/\s/g, '');
  if (!/^(\d+|\d{1,3}(\.\d{3})+)?$/.test(t)) return PESOS_FORMAT;
  const n = Number(t.replace(/\./g, ''));
  return n > 0 ? n : 'Ingresá un valor mayor a 0.';
}
// Mientras se escribe solo se marca lo que ya no puede ser un precio entero (una coma, letras); "1.5" puede seguir hacia "1.500".
export const pesosTyping = (s: string) => (/[^\d.\s]/.test(s) ? PESOS_FORMAT : '');

export const initials = (name = '', last = '') => ((name[0] ?? '') + (last[0] ?? '')).toUpperCase();
export const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

// ---------- vehículos ----------
// Ícono de un tipo (auto, moto o camioneta): solo visual. Plazas y tarifas van por el id del tipo (R-30).
export type VehicleKey = 'AUTO' | 'MOTO' | 'CAMIONETA';
// Nombre para mostrar: los tipos base como siempre (Auto, Motos…); los demás, tal cual los cargó el administrador.
const BASE_LABEL: Record<string, [string, string]> = { AUTO: ['Auto', 'Autos'], MOTO: ['Moto', 'Motos'], CAMIONETA: ['Camioneta', 'Camionetas'] };
export const typeLabel = (name = '') => BASE_LABEL[name]?.[0] ?? name;
export const typePlural = (name = '') => BASE_LABEL[name]?.[1] ?? name;
// Prefijo del código de plaza, igual que spacePrefix del backend: A, M y C en los base; las tres primeras letras en los demás (UTI-01).
export const spacePrefix = (name = '') => BASE_LABEL[name] ? name[0]
  : name.normalize('NFD').replace(/\p{M}/gu, '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3) || 'P';
export const lvl = (pct: number) => (pct >= 100 ? 'err' : pct >= 90 ? 'warn' : '');

// ---------- tiempo ----------
export const SLOT = 30;
// shortcut: L-09, '23:59' hace de 24:00 y no hay turnos que crucen medianoche, guardar minutos o fecha de fin
export const mm = (t: string) => (t.startsWith('23:59') || t.startsWith('24:00') ? 1440 : +t.slice(0, 2) * 60 + +t.slice(3, 5));
export const hhmm = (m: number) => `${pad(Math.floor(m / 60) % 24)}:${pad(m % 60)}`;
export const tstr = (m: number) => (m >= 1440 ? '23:59' : hhmm(m)); // para el backend
export const tm = (m: number) => (m >= 1440 ? '24:00' : hhmm(m)); // para mostrar
export const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
export const DAYS_LONG = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
export const DOW = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'] as const;
export const wdOf = (iso: string) => (new Date(iso + 'T12:00').getDay() + 6) % 7;
export const monday = (iso: string) => addD(iso, -wdOf(iso));
export const dayStr = (days: number[]) => {
  const d = [...days].sort((a, b) => a - b);
  if (d.length === 7) return 'Todos los días';
  const rng = d.length >= 3 && d.every((v, i) => i === 0 || v === d[i - 1]! + 1);
  return rng ? `${DAYS[d[0]!]}–${DAYS[d[d.length - 1]!]}` : d.map(i => DAYS[i]).join(', ');
};

// ---------- calendario de turnos ----------
// Un día es una lista de bloques sin solapes: un empleado o "Cerrado" (se coloca igual que un empleado, R-05).
export const CLOSED = '__closed';
export interface Block { who: string; a: number; b: number }
export type Day = Block[];
export interface ServerDay { shifts: { employeeId: string; from: string; to: string }[]; closures: { from: string; to: string }[] }

const sortDay = (d: Day) => [...d].sort((x, y) => x.a - y.a || x.b - y.b);

export const fromServer = (s: ServerDay): Day => sortDay([
  ...s.shifts.map(x => ({ who: x.employeeId, a: mm(x.from), b: mm(x.to) })),
  ...s.closures.map(x => ({ who: CLOSED, a: mm(x.from), b: mm(x.to) })),
]);

export const toServer = (d: Day): ServerDay => ({
  shifts: d.filter(x => x.who !== CLOSED).map(x => ({ employeeId: x.who, from: hhmm(x.a), to: tstr(x.b) })),
  closures: d.filter(x => x.who === CLOSED).map(x => ({ from: hhmm(x.a), to: tstr(x.b) })),
});

// R-04: contiguos del mismo empleado (o cierres contiguos) se fusionan.
export function merge(d: Day): Day {
  const out: Block[] = [];
  for (const x of sortDay(d)) {
    const last = out[out.length - 1];
    if (last && last.who === x.who && last.b === x.a) last.b = x.b;
    else out.push({ ...x });
  }
  return out;
}

// L-03: dos versiones del día coinciden antes de `now` (lo que ya pasó hoy no se cambia; el backend valida lo mismo).
export function samePast(x: Day, y: Day, now: number): boolean {
  const cut = (d: Day) => JSON.stringify(merge(d.filter(b => b.a < now).map(b => ({ ...b, b: Math.min(b.b, now) }))));
  return cut(x) === cut(y);
}

// R-02: el bloque colocado se queda con el horario; lo que queda debajo se recorta, se divide o desaparece.
export function place(d: Day, blk: Block): Day {
  const out: Block[] = [];
  for (const x of d) {
    if (x.b <= blk.a || x.a >= blk.b) { out.push(x); continue; }
    if (x.a < blk.a) out.push({ ...x, b: blk.a });
    if (x.b > blk.b) out.push({ ...x, a: blk.b });
  }
  out.push(blk);
  return merge(out);
}

// Huecos dentro del horario de la sucursal (ni empleado ni cierre): no admiten reservas (R-01).
export function gaps(d: Day, s: number, e: number): [number, number][] {
  const out: [number, number][] = [];
  let cur = s;
  for (const x of sortDay(d)) {
    if (x.b <= cur) continue;
    if (x.a > cur) out.push([cur, Math.min(x.a, e)]);
    cur = Math.max(cur, x.b);
    if (cur >= e) break;
  }
  if (cur < e) out.push([cur, e]);
  return out.filter(([a, b]) => b > a);
}

export type DropResult = { day: Day; msg: string } | { error: string };

// R-03: soltar en el tercio del medio de un turno lo reemplaza entero; arriba o abajo lo divide 50/50 (el nuevo toma esa mitad).
// Sobre un hueco, lo cubre entero.
export function dropOn(d: Day, who: string, m: number, s: number, e: number, name = 'El empleado'): DropResult {
  const x = d.find(z => z.a <= m && m < z.b);
  if (x) {
    if (x.who === who) return { error: `${name} ya tiene ese horario. Soltalo sobre otro lugar.` };
    const third = (x.b - x.a) / 3;
    if (x.b - x.a < 2 * SLOT || (m >= x.a + third && m < x.b - third)) return { day: place(d, { who, a: x.a, b: x.b }), msg: `${hhmm(x.a)} a ${tm(x.b)}` };
    const mid = x.a + Math.floor((x.b - x.a) / 2 / SLOT) * SLOT;
    const [a, b] = m < mid ? [x.a, mid] : [mid, x.b];
    return { day: place(d, { who, a, b }), msg: `${hhmm(a)} a ${tm(b)}` };
  }
  const g = gaps(d, s, e).find(([a, b]) => a <= m && m < b);
  if (!g) return { error: 'Ese horario está fuera del horario de la sucursal.' };
  return { day: place(d, { who, a: g[0], b: g[1] }), msg: `${hhmm(g[0])} a ${tm(g[1])}` };
}

export const hoursOf = (d: Day, who: string) => d.filter(x => x.who === who).reduce((h, x) => h + (x.b - x.a) / 60, 0);

// Cobertura de la semana sobre el horario de apertura, sin contar cierres ni días cerrados (null).
export function coverage(week: (Day | null)[], s: number, e: number) {
  let req = 0, ok = 0;
  const holes: { d: number; a: number; b: number }[] = [];
  week.forEach((day, d) => {
    if (!day) return;
    const closed = day.filter(x => x.who === CLOSED).reduce((t, x) => t + Math.max(0, Math.min(x.b, e) - Math.max(x.a, s)), 0);
    const g = gaps(day, s, e);
    const miss = g.reduce((t, [a, b]) => t + (b - a), 0);
    req += e - s - closed;
    ok += e - s - closed - miss;
    g.forEach(([a, b]) => holes.push({ d, a, b }));
  });
  return { pct: req ? Math.round((ok / req) * 100) : 100, gaps: holes };
}

export function gapGroups(holes: { d: number; a: number; b: number }[]) {
  const m = new Map<string, { a: number; b: number; days: number[] }>();
  holes.forEach(g => { const k = g.a + '-' + g.b; if (!m.has(k)) m.set(k, { a: g.a, b: g.b, days: [] }); m.get(k)!.days.push(g.d); });
  return [...m.values()].sort((x, y) => x.days[0]! - y.days[0]! || x.a - y.a).map(g => `${dayStr(g.days)} ${hhmm(g.a)}–${tm(g.b)}`);
}

// R-08: aviso de jornada, ámbar por encima de 8 h y rojo por encima de 12 h. No bloquea.
// shortcut: L-14, topes fijos sin tope semanal ni descanso entre jornadas, parametrizar según el convenio real
export const MAX_DAY = 8, MAX_HARD = 12;
export function workWarnings(week: (Day | null)[], emps: { id: string; name: string }[]) {
  const out: { c: 'warn' | 'err'; t: string }[] = [];
  for (const e of emps) {
    const dh = week.map(d => (d ? hoursOf(d, e.id) : 0));
    const hard = dh.flatMap((h, d) => (h > MAX_HARD ? [d] : []));
    const soft = dh.flatMap((h, d) => (h > MAX_DAY && h <= MAX_HARD ? [d] : []));
    if (hard.length) out.push({ c: 'err', t: `${e.name}: más de 12 h el ${dayStr(hard).toLowerCase()} (hasta ${fmtH(Math.max(...dh))})` });
    if (soft.length) out.push({ c: 'warn', t: `${e.name}: más de 8 h el ${dayStr(soft).toLowerCase()}` });
  }
  return out;
}


// ---------- sucursales ----------
export interface ParkingLike {
  id: string; isActive: boolean; walkInOnly?: boolean; openingTime: string; closingTime: string;
  spaceTypes?: SpaceType[];
  prices?: ParkingPriceRow[];
  createdAt?: string | null; updatedAt?: string | null; // alta y última modificación (sin dato en las anteriores a esas columnas)
}
// R-30: plazas y tarifas van por tipo de vehículo (id); el backend manda capacidad, libres y mantenimiento de cada uno.
export interface TypeRef { id: string; name: string }
const st = (p: ParkingLike, id: string) => p.spaceTypes?.find(t => t.vehicleTypeId === id);
// Tipos de una sucursal: los que tienen plazas (en el orden del backend) y después los que solo tienen tarifa.
export const typesOf = (p: ParkingLike): TypeRef[] => {
  const out = (p.spaceTypes ?? []).map(t => ({ id: t.vehicleTypeId, name: t.name }));
  for (const pr of p.prices ?? []) if (!out.some(t => t.id === pr.vehicleTypeId)) out.push({ id: pr.vehicleTypeId, name: pr.vehicleType });
  return out;
};
// Los tipos de varias sucursales juntas, sin repetir (resumen y tarifas del dueño): los base primero y después por nombre.
const baseRank = (n: string) => { const i = Object.keys(BASE_LABEL).indexOf(n); return i < 0 ? 99 : i; };
export const typesAcross = (ps: ParkingLike[]): TypeRef[] => {
  const out: TypeRef[] = [];
  for (const p of ps) for (const t of typesOf(p)) if (!out.some(o => o.id === t.id)) out.push(t);
  return out.sort((a, b) => baseRank(a.name) - baseRank(b.name) || a.name.localeCompare(b.name, 'es'));
};
export const capOf = (p: ParkingLike, id: string) => st(p, id)?.capacity ?? 0;
export const maintOf = (p: ParkingLike, id: string) => st(p, id)?.maintenance ?? 0;
// En servicio: capacidad menos las plazas en mantenimiento (ni libres ni ocupadas). La ocupación se mide sobre estas.
export const svcOf = (p: ParkingLike, id: string) => Math.max(0, capOf(p, id) - maintOf(p, id));
export const occOf = (p: ParkingLike, id: string) => {
  const t = st(p, id);
  return t ? Math.max(0, svcOf(p, id) - t.available) : 0;
};
export const tot = (p: ParkingLike) => (p.spaceTypes ?? []).reduce((a, t) => a + svcOf(p, t.vehicleTypeId), 0);
export const oc = (p: ParkingLike) => (p.spaceTypes ?? []).reduce((a, t) => a + occOf(p, t.vehicleTypeId), 0);
export const pct = (p: ParkingLike) => (tot(p) ? Math.round((oc(p) / tot(p)) * 100) : 0);
export const priceOf = (p: ParkingLike, id: string) => p.prices?.find(x => x.vehicleTypeId === id);
// Tipos con plazas y sin tarifa: sus vehículos no pueden reservar en la sucursal.
export const missing = (p: ParkingLike): TypeRef[] => typesOf(p).filter(t => capOf(p, t.id) > 0 && !priceOf(p, t.id));
export const span = (p: ParkingLike): [number, number] => [mm(p.openingTime), mm(p.closingTime)];
export const hrs = (p: ParkingLike) => (mm(p.openingTime) === 0 && mm(p.closingTime) === 1440 ? 'Abierto 24 h' : `${p.openingTime.slice(0, 5)} – ${p.closingTime.slice(0, 5)} h`);

// Avisos de una sucursal activa: falta tarifa, casi llena, turnos incompletos (R-01).
export function issues(p: ParkingLike, week: Day[] | undefined) {
  if (!p.isActive) return [];
  const o: { l: string; d: string }[] = [];
  const m = missing(p), n = pct(p), free = tot(p) - oc(p);
  if (m.length) o.push({ l: 'Falta tarifa', d: 'Sin precio para ' + m.map(t => typePlural(t.name).toLowerCase()).join(' y ') });
  if (n >= 90) o.push({ l: n >= 100 ? 'Completa' : 'Casi llena', d: `${n} % ocupada · ${plural(free, 'plaza libre', 'plazas libres')}` });
  if (week?.some(d => d.length)) {
    const c = coverage(week, ...span(p));
    if (c.pct < 100) o.push({ l: 'Turnos incompletos', d: `Cobertura semanal ${c.pct} %. Sin empleado no se pueden registrar reservas` });
  }
  return o;
}

// Texto de los turnos de un empleado en la semana tipo, agrupando días con el mismo horario.
export function shiftsText(week: Day[] | undefined, who: string) {
  const m = new Map<string, number[]>();
  (week ?? []).forEach((d, i) => d.filter(x => x.who === who).forEach(x => {
    const k = `${hhmm(x.a)}–${tm(x.b)}`;
    m.set(k, [...(m.get(k) ?? []), i]);
  }));
  return [...m.entries()].map(([k, days]) => `${dayStr(days)} ${k}`);
}

// ---------- reservas ----------
export type ResState = 'curso' | 'reservada' | 'finalizada' | 'cancelada';
export const resState = (status: string): ResState =>
  status === 'EN CURSO' ? 'curso' : status === 'FINALIZADA' ? 'finalizada' : status === 'CANCELADA' ? 'cancelada' : 'reservada';
export const RS: Record<ResState, { l: string; c: string }> = {
  curso: { l: 'En curso', c: 'ac' }, reservada: { l: 'Reservada', c: 'mute' }, finalizada: { l: 'Finalizada', c: 'mute' }, cancelada: { l: 'Cancelada', c: 'mute' },
};

export interface Res {
  id: string; code: string; st: ResState; pid: string; pname: string; space: string;
  date: string; endDate: string; start: string; end: string; hours: number;
  plate: string; vtype: string; vtypeId: string; client: { n: string; ph: string; em: string };
  eid: string | null; // R-07: empleado asignado, lo deciden los turnos
  cin: string | null; // quien registró el ingreso
  amount: number | null;
  rate: number | null; // L-43: precio por hora vigente al reservar, el que cobra la salida; null en las reservas anteriores
  bill: Bill | null; // detalle del cobro; null si no hay factura o es anterior al detalle
  services: Svc[]; // servicios pedidos con la reserva
  rating: number | null; // R-27: valoración del cliente (1 a 5), opcional
}

// Detalle del cobro guardado en la factura al hacer el check-out (R-14).
export interface Bill { reservedHours: number; extraHours: number; hourlyRate: number; servicesAmount: number }
export const toBill = (inv: any): Bill | null => inv?.reservedHours == null ? null : {
  reservedHours: Number(inv.reservedHours), extraHours: Number(inv.extraHours ?? 0),
  hourlyRate: Number(inv.hourlyRate ?? 0), servicesAmount: Number(inv.servicesAmount ?? 0),
};
// Servicio pedido con la reserva: nombre del catálogo y precio de la tarifa con que se reservó, que es el que se cobra.
export interface Svc { id: string; name: string; price: number } // id: la tarifa del servicio en la cochera (ServicePrice.id)
export const servicesOf = (r: any): Svc[] =>
  (r?.services ?? []).map((s: any) => ({ id: s.id, name: s.serviceCatalog?.name ?? 'Servicio', price: Number(s.price ?? 0) }));

// Líneas [concepto, importe] que suman el total: horas reservadas, horas extra (si hubo) y servicios (si hubo).
// Con los servicios de la reserva, la línea "Servicios" se abre en uno por servicio.
export const billLines = (b: Bill, services: Svc[] = []): [string, number][] => [
  [`${plural(b.reservedHours, 'hora reservada', 'horas reservadas')} × ${money(b.hourlyRate)}`, b.reservedHours * b.hourlyRate],
  ...(b.extraHours ? [[`${plural(b.extraHours, 'hora extra', 'horas extra')} × ${money(b.hourlyRate)}`, b.extraHours * b.hourlyRate] as [string, number]] : []),
  ...(services.length ? services.map((s): [string, number] => [s.name, s.price])
    : b.servicesAmount ? [['Servicios', b.servicesAmount] as [string, number]] : []),
];


export function normRes(r: any): Res {
  const s = new Date(r.startTime), e = new Date(r.endTime), c = r.vehicle?.client ?? {};
  return {
    id: r.id,
    code: r.code ?? 'R-' + String(r.id).slice(0, 6).toUpperCase(), // R-26: lo guarda el backend
    st: resState(r.status),
    pid: r.parkingSpace?.parking?.id ?? '',
    pname: r.parkingSpace?.parking?.name ?? '—',
    space: r.parkingSpace?.spaceCode ?? '—',
    date: arDate(s), endDate: arDate(e), start: arTime(s), end: arTime(e),
    hours: (e.getTime() - s.getTime()) / 3_600_000,
    plate: r.vehicle?.plate ?? '—',
    vtype: r.vehicle?.vehicleType?.name ?? '',
    vtypeId: typeof r.vehicle?.vehicleType === 'string' ? r.vehicle.vehicleType : r.vehicle?.vehicleType?.id ?? '', // R-30: plazas y tarifa van por este id
    client: { n: [c.name, c.last_name].filter(Boolean).join(' ') || '—', ph: c.phone ?? '', em: c.email ?? '' },
    eid: r.attendedBy?.id ?? null,
    cin: r.checkedInBy?.id ?? null,
    amount: r.amount == null ? null : Number(r.amount),
    rate: r.hourlyRate == null ? null : Number(r.hourlyRate),
    bill: toBill(r.invoice),
    services: servicesOf(r),
    rating: r.rating ?? null,
  };
}

// L-18: CSV en el navegador, separador punto y coma y BOM para Excel en español.
// shortcut: L-18, se arma en el navegador, generarlo en el servidor si el volumen crece
export function downloadCsv(name: string, rows: (string | number | null)[][]) {
  const q = (v: unknown) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
  const blob = new Blob(['﻿' + rows.map(r => r.map(q).join(';')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 500);
}
