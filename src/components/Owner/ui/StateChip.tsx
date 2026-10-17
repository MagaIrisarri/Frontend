import { Check, Pause } from 'lucide-react';

// Operativa: toma reservas online. Pausada: cerrada (isActive false) o solo en el lugar (L-44, walkInOnly).
export const operating = (p: { isActive: boolean; walkInOnly?: boolean }) => p.isActive && !p.walkInOnly;

export function StateChip({ p }: { p: { isActive: boolean; walkInOnly?: boolean } }) {
  if (operating(p)) return <span className="st ok"><Check className="i sm" />Operativa</span>;
  return <span className={`st ${p.isActive ? 'warn' : 'mute'}`}><Pause className="i sm" />{p.isActive ? 'Solo en el lugar' : 'Pausada'}</span>;
}
