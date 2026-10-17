import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AlertCircle, Check, Info, X } from 'lucide-react';

type ToastType = 'ok' | 'err' | 'info';
interface Action { label: string; fn: () => void }
interface Toast { id: number; msg: string; type: ToastType; action?: Action }
// El tercer argumento es "Deshacer" (una función) o una acción con nombre propio (p. ej. "Cargar tarifas").
type Show = (msg: string, type?: ToastType, action?: (() => void) | Action) => void;

const ToastCtx = createContext<Show>(() => {});
export const useToast = () => useContext(ToastCtx);

let seq = 0;
const ICON = { ok: Check, err: AlertCircle, info: Info };
const MAX = 2; // más de dos avisos apilados tapan lo que se está mirando (en el teléfono, el calendario o el pie de un panel)
// Los errores duran más y se cierran a mano; con una acción hay tiempo de tocarla.
const ms = (t: Toast) => (t.type === 'err' ? 8000 : t.action ? 7000 : t.type === 'info' ? 4800 : 3600);

// Avisos con "Deshacer" u otra acción opcional. Errores en región assertive, el resto polite.
// shortcut: L-15, deshacer vive en el navegador y se pierde al recargar, pasar a acciones compensatorias en el servidor
export function ToastProvider({ children }: { children: ReactNode }) {
  const [list, setList] = useState<Toast[]>([]);
  const drop = useCallback((id: number) => setList(l => l.filter(t => t.id !== id)), []);
  const show = useCallback<Show>((msg, type = 'ok', act) => {
    const action = typeof act === 'function' ? { label: 'Deshacer', fn: act } : act;
    setList(l => [...l, { id: ++seq, msg, type, action }].slice(-MAX));
  }, []);

  const render = (assertive: boolean) => list.filter(t => (t.type === 'err') === assertive).map(t => <ToastItem key={t.id} t={t} onDrop={drop} />);

  return (
    <ToastCtx.Provider value={show}>
      {children}
      <div className="toasts">
        <div aria-live="polite">{render(false)}</div>
        <div aria-live="assertive" role="alert">{render(true)}</div>
      </div>
    </ToastCtx.Provider>
  );
}

// Con el mouse encima o el foco adentro el tiempo se detiene y sigue desde donde quedó (WCAG 2.2.1).
function ToastItem({ t, onDrop }: { t: Toast; onDrop: (id: number) => void }) {
  const [paused, setPaused] = useState(false);
  const left = useRef(ms(t));
  useEffect(() => {
    if (paused) return;
    const start = Date.now();
    const id = setTimeout(() => onDrop(t.id), left.current);
    return () => { clearTimeout(id); left.current -= Date.now() - start; };
  }, [paused, t.id, onDrop]);
  const Icon = ICON[t.type];
  return (
    <div className={`toast ${t.type}`} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)} onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setPaused(false); }}>
      <Icon className="i" /><span>{t.msg}</span>
      {t.action && <button type="button" className="tb" onClick={() => { onDrop(t.id); t.action!.fn(); }}>{t.action.label}</button>}
      {t.type === 'err' && <button type="button" className="icon-btn sm tx" aria-label="Cerrar aviso" onClick={() => onDrop(t.id)}><X className="i sm" /></button>}
    </div>
  );
}
