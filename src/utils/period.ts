// Períodos para filtrar listas por fecha (reservas y facturas).
export const PERIODS = [
  { k: 'all', l: 'Todo el período' },
  { k: '30', l: 'Últimos 30 días' },
  { k: '90', l: 'Últimos 90 días' },
  { k: 'year', l: 'Este año' },
] as const;

export type Period = (typeof PERIODS)[number]['k'];

export function inPeriod(iso: string | Date | null | undefined, period: Period, now = new Date()): boolean {
  if (period === 'all') return true;
  if (!iso) return false;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return false;
  if (period === 'year') return d.getFullYear() === now.getFullYear();
  return d.getTime() >= now.getTime() - Number(period) * 86_400_000; // las fechas futuras (reservas) entran
}
