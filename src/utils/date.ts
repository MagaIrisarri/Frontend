// L-04: fechas y horas en la zona de las sucursales (la misma TZ del backend), no en la del navegador.
export const AR_TZ = 'America/Argentina/Buenos_Aires';

const PARTS = new Intl.DateTimeFormat('en-CA', {
  timeZone: AR_TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
});
// formatToParts lanza con una fecha inválida (una reserva sin horario): se devuelve vacío para no cortar la pantalla.
const partsOf = (d: Date): Record<string, string> | null =>
  isNaN(d.getTime()) ? null : Object.fromEntries(PARTS.formatToParts(d).map((p) => [p.type, p.value]));

// Día ('AAAA-MM-DD') y hora ('HH:MM') de un instante en Argentina; '' si la fecha es inválida.
export const arDate = (d: Date) => { const p = partsOf(d); return p ? `${p.year}-${p.month}-${p.day}` : ''; };
export const arTime = (d: Date) => { const p = partsOf(d); return p ? `${p.hour}:${p.minute}` : ''; };

// El instante de una fecha y hora de Argentina (lo que elige el usuario en un formulario).
// shortcut: L-04, offset fijo -03:00 (Argentina no tiene horario de verano desde 2009); usar la zona de cada sucursal si hay sucursales fuera del país
export const atAR = (date: string, time: string) => new Date(`${date}T${time.slice(0, 5)}:00-03:00`);

// Hora de Argentina sin zona, como la interpreta el backend (TZ en orm.ts).
export const toLocalISOString = (date: Date) => {
  const p = partsOf(date);
  return p ? `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}` : '';
};

export const formatReservationDate = (dateString: string | Date): string => {
  try {
    const d = typeof dateString === 'string' ? new Date(dateString) : dateString;
    if (isNaN(d.getTime())) return String(dateString);
    return d.toLocaleDateString('es-AR', {
      timeZone: AR_TZ,
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(dateString);
  }
};
