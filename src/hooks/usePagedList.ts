import { useEffect, useRef, useState } from 'react';

export type LoadStatus = 'loading' | 'ready' | 'error';
export const PAGE_SIZE = 25;

interface Page<T, M> { data: T[]; meta: M & { total: number } }

// Lista paginada en el servidor: pide la página al cambiar los filtros o la página (con los filtros, la página vuelve a la 1 sin pedir dos veces)
// y descarta respuestas viejas. Mientras pide otra página conserva la anterior (`busy`) para que la lista no parpadee.
export function usePagedList<T, M>(fetchPage: (query: Record<string, unknown>) => Promise<Page<T, M>>, filters: Record<string, string | undefined>, limit = PAGE_SIZE) {
  const key = JSON.stringify(filters);
  const [pageState, setPageState] = useState({ key, page: 1 });
  // Al cambiar los filtros la página vuelve a la 1 y no se conserva la de los filtros anteriores (si se vuelve a ellos, empieza de nuevo).
  if (pageState.key !== key) setPageState({ key, page: 1 });
  const page = pageState.key === key ? pageState.page : 1;
  const [items, setItems] = useState<T[]>([]);
  const [meta, setMeta] = useState<(M & { total: number }) | null>(null);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [busy, setBusy] = useState(false);
  const [tick, setTick] = useState(0);
  const seq = useRef(0);

  useEffect(() => {
    const mine = ++seq.current;
    setBusy(true);
    fetchPage({ ...filters, page, limit })
      .then(r => {
        if (mine !== seq.current) return;
        // Una baja puede dejar vacía la última página: se vuelve a la anterior.
        if (!r.data.length && page > 1 && r.meta.total > 0) { setPageState({ key, page: Math.ceil(r.meta.total / limit) }); return; }
        setItems(r.data); setMeta(r.meta); setStatus('ready'); setBusy(false);
      })
      .catch(() => { if (mine === seq.current) { setStatus('error'); setBusy(false); } });
    // fetchPage es una función de módulo (estable) y `key` resume los filtros.
  }, [key, page, limit, tick]);

  return {
    items, meta, status, busy, page, limit,
    setPage: (n: number) => setPageState({ key, page: n }),
    reload: () => { setStatus(s => (s === 'error' ? 'loading' : s)); setTick(t => t + 1); },
  };
}
