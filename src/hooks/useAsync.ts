import { useCallback, useEffect, useRef, useState } from 'react';
import type { LoadStatus } from './usePagedList';

// Carga de un dato de apoyo (vehículos de un cliente, empleados de un dueño…): estado, dato y reintento. Descarta respuestas viejas.
export function useAsync<T>(load: () => Promise<T>, deps: unknown[]) {
  const [state, setState] = useState<{ status: LoadStatus; data: T | null }>({ status: 'loading', data: null });
  const seq = useRef(0);
  const run = useCallback(() => {
    const mine = ++seq.current;
    setState(s => ({ status: 'loading', data: s.data }));
    load().then(data => { if (mine === seq.current) setState({ status: 'ready', data }); })
      .catch(() => { if (mine === seq.current) setState({ status: 'error', data: null }); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => { run(); }, [run]);
  return { ...state, reload: run };
}

// Texto que se usa para pedir al servidor recién cuando se deja de tipear.
export function useDebounced<T>(value: T, ms = 300): T {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
}
