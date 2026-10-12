import { useState } from 'react';
import { Copy } from 'lucide-react';
import { Drawer } from '../../components/Owner/ui/Layer';
import { Presence } from '../../components/Owner/ui/Presence';
import { useToast } from '../../components/Owner/ui/Toasts';
import { addD, isoD, money, monday, plural, shD, today } from '../Owner/owner.lib';
import type { ERes } from './employee.lib';

type Per = 'Hoy' | 'Semana' | 'Mes';
type Bucket = [label: string, from: string, to: string];
const dm = (iso: string) => new Date(iso + 'T12:00').toLocaleDateString('es-AR', { weekday: 'short' }).replace('.', '') + ' ' + shD(iso);
const COLS = ['Período', 'Ingresos', 'Horas', 'Servicios', 'Efectivo', 'Tarjetas', 'M. Pago', 'Transf.', 'Total'];

// Tramos del período: Hoy es uno, Semana un día cada uno (los últimos 7), Mes una semana cada uno dentro del mes.
function buckets(per: Per, now: string): Bucket[] {
  if (per === 'Hoy') return [[`Hoy · ${shD(now)}`, now, now]];
  if (per === 'Semana') return Array.from({ length: 7 }, (_, i) => addD(now, i - 6)).map((d): Bucket => [d === now ? `Hoy · ${shD(d)}` : dm(d), d, d]);
  const first = now.slice(0, 8) + '01', last = isoD(new Date(+now.slice(0, 4), +now.slice(5, 7), 0));
  const out: Bucket[] = [];
  for (let w = monday(first); w <= last; w = addD(w, 7)) { const a = w < first ? first : w, b = addD(w, 6) > last ? last : addD(w, 6); out.push([`${shD(a)} – ${shD(b)}`, a, b]); }
  return out;
}

// Reporte de solo lectura de la sucursal: cuenta las estadías finalizadas por fecha de salida y los ingresos por fecha de inicio.
export default function SummaryDrawer({ open, ...p }: SummaryProps & { open: boolean }) { return <Presence open={open}><Summary {...p} /></Presence>; }
type SummaryProps = { reservations: ERes[]; onClose: () => void };
function Summary({ reservations, onClose }: SummaryProps) {
  const toast = useToast();
  const [per, setPer] = useState<Per>('Hoy');
  const now = today();
  const rows = buckets(per, now);

  const sum = (rs: ERes[], f: (r: ERes) => number) => rs.reduce((a, r) => a + f(r), 0);
  const calc = (from: string, to: string) => {
    const inR = (d: string) => d >= from && d <= to;
    const done = reservations.filter(r => r.status === 'FINALIZADA' && inR(isoD(r.outAt ?? r.endAt)));
    const paid = done.filter(r => r.invoice?.status === 'PAGADA');
    const by = (...m: string[]) => sum(paid.filter(r => m.includes(r.invoice!.method)), r => r.amount ?? 0);
    const cols = { ef: by('EFECTIVO'), ta: by('TARJETA_DEBITO', 'TARJETA_CREDITO'), mp: by('MERCADO_PAGO'), tr: by('TRANSFERENCIA') };
    return {
      n: reservations.filter(r => (r.status === 'EN CURSO' || r.status === 'FINALIZADA') && inR(r.date)).length,
      h: sum(done, r => (r.bill ? r.bill.reservedHours + r.bill.extraHours : r.hours)),
      sv: sum(done, r => r.bill?.servicesAmount ?? 0), ...cols, total: cols.ef + cols.ta + cols.mp + cols.tr,
      dueN: done.length - paid.length, due: sum(done, r => r.amount ?? 0) - sum(paid, r => r.amount ?? 0),
    };
  };
  const data = rows.map(([l, a, b]) => [l, calc(a, b)] as const);
  const keys = ['n', 'h', 'sv', 'ef', 'ta', 'mp', 'tr', 'total'] as const;
  const tot = Object.fromEntries(keys.map(k => [k, data.reduce((a, [, v]) => a + v[k], 0)])) as Record<(typeof keys)[number], number>;
  const due = data.reduce((a, [, v]) => a + v.due, 0), dueN = data.reduce((a, [, v]) => a + v.dueN, 0);
  const cell = (k: (typeof keys)[number], x: number) => (k === 'n' || k === 'h' ? x : money(x));
  const range = per === 'Hoy' ? `Hoy · ${shD(now)}` : `${per} · del ${shD(rows[0]![1])} al ${shD(rows[rows.length - 1]![2])}`;

  const copy = async () => {
    const tsv = [COLS, ...data.map(([l, v]) => [l, ...keys.map(k => v[k])]), ['Total', ...keys.map(k => tot[k])]].map(r => r.join('\t')).join('\n');
    try { await navigator.clipboard.writeText(tsv); toast('Resumen copiado. Pegalo en tu hoja de cálculo.'); }
    catch { toast('No se pudo copiar el resumen.', 'err'); }
  };

  return (
    <Drawer title="Resumen por período" sub={range} onClose={onClose} wide
      footer={<div className="dfoot"><button type="button" className="btn" onClick={copy}><Copy className="i" aria-hidden="true" />Copiar para planilla</button><button type="button" className="btn" onClick={onClose}>Cerrar</button></div>}>
      <div className="dbody">
        <div className="seg" role="group" aria-label="Período">
          {(['Hoy', 'Semana', 'Mes'] as const).map(p => <button type="button" key={p} aria-pressed={p === per} onClick={() => setPer(p)}>{p}</button>)}
        </div>
        <div className="e-tw">
          <table>
            <thead><tr>{COLS.map(c => <th key={c} scope="col">{c}</th>)}</tr></thead>
            <tbody>{data.map(([l, v]) => <tr key={l}><td>{l}</td>{keys.map(k => <td key={k}>{k === 'total' ? <b>{cell(k, v[k])}</b> : cell(k, v[k])}</td>)}</tr>)}</tbody>
            <tfoot><tr><td>Total</td>{keys.map(k => <td key={k}>{cell(k, tot[k])}</td>)}</tr></tfoot>
          </table>
        </div>
        {dueN > 0 && <div className="e-note warn"><span>Hay {plural(dueN, 'salida', 'salidas')} sin cobrar en el período: {money(due)}. No se suman al total hasta que se cobren.</span></div>}
        <span className="dim">Cuenta las estadías finalizadas de la sucursal por fecha de salida, y los ingresos por fecha de inicio. «Total» es lo cobrado.</span>
      </div>
    </Drawer>
  );
}
