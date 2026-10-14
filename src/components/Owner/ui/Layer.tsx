import { useEffect, useId, useRef, type ReactNode } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import { useClosing } from './Presence';
import { useSwipeClose } from '../../../hooks/useSwipeClose';

// El scroll de la página se bloquea mientras haya algún panel o modal en pantalla. Se calcula mirando el DOM, no guardando
// el valor anterior ni contando: así no queda trabado si un panel se abre mientras otro se cierra (detalle de la sucursal →
// Editar sucursal), si se cierra la sesión o se cambia de pantalla con uno abierto, ni con la recarga en caliente de Vite.
// Antes, en esos casos, la página quedaba sin scroll en todos los paneles hasta recargar.
export const syncScrollLock = () => {
  document.body.style.overflow = document.querySelector('.layer, .modal-root') ? 'hidden' : '';
};
const lockScroll = () => { document.body.style.overflow = 'hidden'; };
const unlockScroll = () => queueMicrotask(syncScrollLock); // la capa ya salió del DOM cuando corre la limpieza del efecto

// Foco al primer campo, Escape cierra, bloquea el scroll y devuelve el foco al abridor (como openLayer/closeLayer del prototipo).
function useLayer(onClose: () => void, focusSel = '[data-first],input:not([type=hidden]),select,textarea,.dfoot .btn') {
  const ref = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    lockScroll();
    const t = setTimeout(() => {
      const el = ref.current;
      let first = (el?.querySelector(focusSel) ?? el?.querySelector('.icon-btn')) as HTMLElement | null;
      // en táctil, enfocar un campo de texto abre el teclado y tapa el panel recién abierto
      if (first?.matches('input:not([type=checkbox],[type=radio]),textarea') && window.matchMedia('(pointer:coarse)').matches) first = el?.querySelector('.icon-btn') as HTMLElement | null;
      first?.focus();
    }, 30);
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      const layers = document.querySelectorAll('.owner .layer.on, .owner .modal-root.on');
      if (layers[layers.length - 1] === ref.current) close.current(); // solo cierra la capa de arriba
    };
    document.addEventListener('keydown', onKey);
    // iOS no achica la ventana al abrir el teclado: --kb sube la hoja para que sus botones no queden tapados
    const vv = window.visualViewport;
    const kb = () => vv && ref.current?.style.setProperty('--kb', `${Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop))}px`);
    vv?.addEventListener('resize', kb);
    vv?.addEventListener('scroll', kb);
    return () => {
      vv?.removeEventListener('resize', kb);
      vv?.removeEventListener('scroll', kb);
      clearTimeout(t);
      document.removeEventListener('keydown', onKey);
      unlockScroll();
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
  left?: boolean; // se abre desde la izquierda (menú de Home)
  size?: 'mid'; // un poco más ancho que el estándar (formularios largos con mapa)
  onBack?: () => void; // vuelve a la vista anterior dentro del mismo panel (p. ej. del formulario a la lista)
  focusSel?: string;
}

// Panel lateral. Se renderiza dentro de .owner (sin portal) para heredar los tokens.
export function Drawer({ title, sub, onClose, children, footer, wide, left, size, onBack, focusSel }: DrawerProps) {
  const ref = useLayer(onClose, focusSel);
  const id = useId();
  const closing = useClosing();
  const swipe = useSwipeClose(onClose, left ? 'left' : 'right');
  return (
    <div className={`layer on${closing ? ' out' : ''}`} ref={ref}>
      <div className="scrim" onClick={onClose} />
      <aside ref={swipe} className={`drawer${wide ? ' wide' : ''}${left ? ' left' : ''}${size ? ` ${size}` : ''}`} role="dialog" aria-modal="true" aria-labelledby={id}>
        <div className="dhead">
          {(() => {
            const head = <div><h2 id={id}>{title}</h2>{sub && <p>{sub}</p>}</div>;
            return onBack
              ? <div className="tl"><button type="button" className="icon-btn" onClick={onBack} aria-label="Volver"><ArrowLeft className="i" /></button>{head}</div>
              : head;
          })()}
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
  busy?: boolean; // mientras la acción corre, evita el doble envío
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmModal({ title, body, ok, back = 'Cancelar', danger, busy, onConfirm, onClose }: ConfirmProps) {
  const ref = useLayer(onClose, '[data-first]');
  const id = useId();
  const closing = useClosing();
  return (
    <div className={`modal-root on${closing ? ' out' : ''}`} ref={ref}>
      <div className="scrim" onClick={onClose} />
      <div className="modal" role="alertdialog" aria-modal="true" aria-labelledby={`${id}t`} aria-describedby={`${id}b`}>
        <h2 id={`${id}t`}>{title}</h2>
        <p id={`${id}b`}>{body}</p>
        <div className="row">
          <button type="button" className="btn" onClick={onClose}>{back}</button>
          <button type="button" className={`btn ${danger ? 'danger' : 'pri'}`} data-first disabled={busy} aria-busy={busy || undefined} onClick={onConfirm}>{ok}</button>
        </div>
      </div>
    </div>
  );
}
