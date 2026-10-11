// Formatos argentinos (L = letra, D = dígito): auto vigente AB123CD, auto anterior ABC123, moto vigente A123BCD, moto anterior 123ABC.
// Mismos formatos que valida el backend (Vehicle.Schema.ts).
const MASKS = ['LLDDDLL', 'LLLDDD', 'LDDDLLL', 'DDDLLL'];
const fits = (v: string, m: string) => [...v].every((c, i) => (m[i] === 'L' ? /[A-Z]/ : m[i] === 'D' ? /\d/ : /(?!)/).test(c));

export const cleanPlate = (v: string) => v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);

// 'bad' en cuanto lo escrito ya no puede completarse en ningún formato; 'partial' si todavía puede.
export const plateState = (v: string): 'empty' | 'partial' | 'ok' | 'bad' => {
  if (!v) return 'empty';
  const compatible = MASKS.filter((m) => fits(v, m));
  if (!compatible.length) return 'bad';
  return compatible.some((m) => m.length === v.length) ? 'ok' : 'partial';
};

export const MIN_VEHICLE_YEAR = 1960; // shortcut: L-28, sin dato de años por modelo en vehiculos.json, piso fijo; cuando el catálogo traiga años, validar contra el modelo
// Del año próximo (modelos del año que ya se venden) hacia atrás.
export const vehicleYears = () => Array.from({ length: new Date().getFullYear() + 1 - MIN_VEHICLE_YEAR + 1 }, (_, i) => new Date().getFullYear() + 1 - i);
