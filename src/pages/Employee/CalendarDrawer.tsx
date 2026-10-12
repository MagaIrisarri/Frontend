import { useState } from 'react';
import { Info } from 'lucide-react';
import { Drawer } from '../../components/Owner/ui/Layer';
import { Presence } from '../../components/Owner/ui/Presence';
import { addD, today } from '../Owner/owner.lib';

// Días navegables: el empleado mira hacia atrás para cobrar o revisar y hacia adelante para ver lo que viene.
export const BACK_DAYS = 60;
export const AHEAD_DAYS = 14;

const WEEK = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

// Calendario del mes con un punto en los días que el empleado trabaja. `worked` son días de la semana de JS (0 = domingo).
export default function CalendarDrawer({ open, ...p }: CalProps & { open: boolean }) { return <Presence open={open}><Calendar {...p} /></Presence>; }
type CalProps = { value: string; worked: number[]; turno: string; onPick: (iso: string) => void; onClose: () => void };
function Calendar({ value, worked, turno, onPick, onClose }: CalProps) {
  const now = today();
  const [month, setMonth] = useState(value.slice(0, 7)); // 'YYYY-MM'
  const [y, m] = month.split('-').map(Number) as [number, number];
  const min = addD(now, -BACK_DAYS), max = addD(now, AHEAD_DAYS);
  const lead = (new Date(y, m - 1, 1).getDay() + 6) % 7; // lunes primero
  const days = new Date(y, m, 0).getDate();
  const step = (n: number) => { const d = new Date(y, m - 1 + n, 1); setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`); };
  const title = new Date(y, m - 1, 1).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });

  return (
    <Drawer title="Elegir fecha" onClose={onClose}
      footer={<div className="dfoot"><button type="button" className="btn" onClick={() => onPick(now)}>Ir a hoy</button></div>}>
      <div className="dbody">
        <div className="e-cm">
          <button type="button" className="btn sm" aria-label="Mes anterior" onClick={() => step(-1)}>‹</button>
          <b>{title}</b>
          <button type="button" className="btn sm" aria-label="Mes siguiente" onClick={() => step(1)}>›</button>
        </div>
        <div className="e-cal">
          {WEEK.map((w, i) => <span className="wd" key={i}>{w}</span>)}
          {Array.from({ length: lead }, (_, i) => <span key={`b${i}`} />)}
          {Array.from({ length: days }, (_, i) => {
            const iso = `${month}-${String(i + 1).padStart(2, '0')}`;
            return (
              <button type="button" key={iso} className={worked.includes(new Date(y, m - 1, i + 1).getDay()) ? 'w' : ''}
                aria-pressed={iso === value} aria-current={iso === now ? 'date' : undefined} disabled={iso < min || iso > max}
                onClick={() => onPick(iso)}>{i + 1}</button>
            );
          })}
        </div>
        <div className="e-note"><Info className="i" aria-hidden="true" /><span>El punto verde marca los días que trabajás{turno ? ` (${turno})` : ''}. Ves las reservas de toda la sucursal. Podés ir hasta {BACK_DAYS} días atrás y {AHEAD_DAYS} adelante.</span></div>
      </div>
    </Drawer>
  );
}
