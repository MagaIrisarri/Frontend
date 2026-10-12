import { useEffect, useRef, type ReactNode } from 'react';
import { ToastProvider } from './Toasts';
import '../../../styles/owner.scss';
import '../../../styles/ui.scss';

// Raíz del rol dueño: aplica los estilos con alcance .owner, avisos y el tooltip de [data-tip] del prototipo.
// bare: sin fondo ni alto mínimo, para capas que se montan sobre otras pantallas (p. ej. Mi perfil en Home).
export default function OwnerShell({ children, bare, theme }: { children: ReactNode; bare?: boolean; theme?: string }) { // theme: clase extra con otros tokens (p. ej. 'emp', la terminal del empleado)
  const tip = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = tip.current!;
    const hide = () => el.classList.remove('on');
    const show = (t: HTMLElement) => {
      el.textContent = t.dataset.tip ?? '';
      el.classList.add('on');
      const r = t.getBoundingClientRect(), w = el.offsetWidth, h = el.offsetHeight;
      el.style.left = `${Math.max(8, Math.min(innerWidth - w - 8, r.left + r.width / 2 - w / 2))}px`;
      el.style.top = `${r.top - h - 8 < 8 ? r.bottom + 8 : r.top - h - 8}px`;
    };
    const onTarget = (e: Event) => {
      const t = (e.target as HTMLElement).closest?.('[data-tip]') as HTMLElement | null;
      if (t) show(t); else hide();
    };
    document.addEventListener('mouseover', onTarget);
    document.addEventListener('focusin', onTarget);
    document.addEventListener('focusout', hide);
    document.addEventListener('click', hide, true);
    document.addEventListener('scroll', hide, true);
    return () => {
      document.removeEventListener('mouseover', onTarget);
      document.removeEventListener('focusin', onTarget);
      document.removeEventListener('focusout', hide);
      document.removeEventListener('click', hide, true);
      document.removeEventListener('scroll', hide, true);
    };
  }, []);

  return (
    <div className={['owner', bare && 'bare', theme].filter(Boolean).join(' ')}>
      <ToastProvider>{children}</ToastProvider>
      <div className="tip" ref={tip} aria-hidden="true" />
    </div>
  );
}
