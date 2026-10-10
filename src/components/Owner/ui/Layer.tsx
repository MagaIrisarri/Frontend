import { useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

// Foco al primer campo, Escape cierra, bloquea el scroll y devuelve el foco al abridor (como openLayer/closeLayer del prototipo).
function useLayer(onClose: () => void, focusSel = '[data-first],input:not([type=hidden]),select,textarea,.dfoot .btn') {
  const ref = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const t = setTimeout(() => {
      const el = ref.current;
      ((el?.querySelector(focusSel) ?? el?.querySelector('.icon-btn')) as HTMLElement | null)?.focus();
    }, 30);
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      const layers = document.querySelectorAll('.owner .layer.on, .owner .modal-root.on');
      if (layers[layers.length - 1] === ref.current) close.current(); // solo cierra la capa de arriba
    };
    document.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(t);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      if (opener && document.contains(opener)) opener.focus();
    };
  }, [focusSel]);
  return ref;
}

interface DrawerProps {
  title: ReactNode;
  sub?: ReactNode;
  onClose: () => void;
  children: ReactNode; // normalmente un <div className="dbody">
  footer?: ReactNode; // normalmente un <div className="dfoot">
  wide?: boolean;
  focusSel?: string;
}

// Panel lateral. Se renderiza dentro de .owner (sin portal) para heredar los tokens.
export function Drawer({ title, sub, onClose, children, footer, wide, focusSel }: DrawerProps) {
  const ref = useLayer(onClose, focusSel);
  const id = useId();
  return (
    <div className="layer on" ref={ref}>
      <div className="scrim" onClick={onClose} />
      <aside className={`drawer${wide ? ' wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby={id}>
        <div className="dhead">
          <div><h2 id={id}>{title}</h2>{sub && <p>{sub}</p>}</div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Cerrar panel"><X className="i" /></button>
        </div>
        {children}
        {footer}
      </aside>
    </div>
  );
}

interface ConfirmProps {
  title: ReactNode;
  body: ReactNode;
  ok: string;
  back?: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmModal({ title, body, ok, back = 'Cancelar', danger, onConfirm, onClose }: ConfirmProps) {
  const ref = useLayer(onClose, '[data-first]');
  const id = useId();
  return (
    <div className="modal-root on" ref={ref}>
      <div className="scrim" onClick={onClose} />
      <div className="modal" role="alertdialog" aria-modal="true" aria-labelledby={`${id}t`} aria-describedby={`${id}b`}>
        <h2 id={`${id}t`}>{title}</h2>
        <p id={`${id}b`}>{body}</p>
        <div className="row">
          <button type="button" className="btn" onClick={onClose}>{back}</button>
          <button type="button" className={`btn ${danger ? 'danger' : 'pri'}`} data-first onClick={onConfirm}>{ok}</button>
        </div>
      </div>
    </div>
  );
}
