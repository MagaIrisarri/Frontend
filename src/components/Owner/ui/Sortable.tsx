import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

// Orden por columna: clic en el encabezado ordena y otro clic invierte (aria-sort). `keys` dice cómo se compara cada
// columna; `tie` desempata. Los textos se comparan en español (sin distinguir mayúsculas).
export function useSortable<T, K extends string>(keys: Record<K, (x: T) => string | number>, init: { k: K; d: 1 | -1 }, tie?: (a: T, b: T) => number) {
  const [sort, setSort] = useState(init);
  const cmp = (x: string | number, z: string | number) =>
    typeof x === 'string' && typeof z === 'string' ? x.localeCompare(z, 'es', { sensitivity: 'base' }) : x < z ? -1 : x > z ? 1 : 0;
  const sorted = (list: T[]) => [...list].sort((a, b) => cmp(keys[sort.k](a), keys[sort.k](b)) * sort.d || (tie ? tie(a, b) : 0));
  const th = (k: K, l: string, c = '') => {
    const on = sort.k === k;
    return (
      <th className={c} aria-sort={on ? (sort.d > 0 ? 'ascending' : 'descending') : 'none'}>
        <button type="button" className={`thb${on ? ' on' : ''}`} onClick={() => setSort({ k, d: on ? (-sort.d as 1 | -1) : 1 })}>
          {l}<ChevronDown className="i sm" style={{ transform: on && sort.d < 0 ? 'rotate(180deg)' : undefined, opacity: on ? 1 : 0 }} />
        </button>
      </th>
    );
  };
  return { sorted, th };
}
