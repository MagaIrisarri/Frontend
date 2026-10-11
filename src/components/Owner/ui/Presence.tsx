import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

// Duración de la salida de paneles y modales; igual a la de la entrada (.16 s en owner.scss).
export const EXIT_MS = 160;

const ClosingCtx = createContext(false);

// true mientras el panel se está yendo: Drawer y ConfirmModal agregan la clase `out` y animan la salida.
export const useClosing = () => useContext(ClosingCtx);

// Mantiene montado el contenido EXIT_MS después de que `open` pasa a false para que la salida se vea igual que la entrada.
// `children` puede ser una función que recibe `closing` para componentes que no están por debajo del Presence (p. ej. el panel de cocheras).
export function Presence({ open, children }: { open: boolean; children: ReactNode | ((closing: boolean) => ReactNode) }) {
  const [mounted, setMounted] = useState(open);

  useEffect(() => {
    if (open) { setMounted(true); return; }
    const t = setTimeout(() => setMounted(false), EXIT_MS);
    return () => clearTimeout(t);
  }, [open]);

  if (!open && !mounted) return null;
  return <ClosingCtx.Provider value={!open}>{typeof children === 'function' ? children(!open) : children}</ClosingCtx.Provider>;
}

// Para paneles que se montaban con `x && <Panel x={x} />` (el valor desaparece justo al cerrar): conserva el último valor
// mientras dura la salida, así el cierre se anima igual que la apertura. Todo Drawer o ConfirmModal va dentro de un Presence o de un Shown.
export function Shown<T>({ when, children }: { when: T | null | undefined | false; children: (value: T) => ReactNode }) {
  const last = useRef<T | null>(null);
  if (when) last.current = when;
  return <Presence open={!!when}>{last.current ? children(last.current) : null}</Presence>;
}
