import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { AlertCircle, Check, Info } from 'lucide-react';

type ToastType = 'ok' | 'err' | 'info';
interface Toast { id: number; msg: string; type: ToastType; undo?: () => void }
type Show = (msg: string, type?: ToastType, undo?: () => void) => void;

const ToastCtx = createContext<Show>(() => {});
export const useToast = () => useContext(ToastCtx);

let seq = 0;
const ICON = { ok: Check, err: AlertCircle, info: Info };

// Avisos con "Deshacer" opcional. Errores en región assertive, el resto polite.
// shortcut: L-15, deshacer vive en el navegador y se pierde al recargar, pasar a acciones compensatorias en el servidor
export function ToastProvider({ children }: { children: ReactNode }) {
  const [list, setList] = useState<Toast[]>([]);
  const drop = useCallback((id: number) => setList(l => l.filter(t => t.id !== id)), []);
  const show = useCallback<Show>((msg, type = 'ok', undo) => {
    const id = ++seq;
    setList(l => [...l, { id, msg, type, undo }]);
    setTimeout(() => drop(id), undo ? 7000 : type === 'info' ? 4800 : 3600);
  }, [drop]);

  const render = (assertive: boolean) => list.filter(t => (t.type === 'err') === assertive).map(t => {
    const Icon = ICON[t.type];
    return (
      <div key={t.id} className={`toast ${t.type}`}>
        <Icon className="i" /><span>{t.msg}</span>
        {t.undo && <button type="button" className="tb" onClick={() => { drop(t.id); t.undo!(); }}>Deshacer</button>}
      </div>
    );
  });

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
