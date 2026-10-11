import { useCallback, useRef } from 'react';

// Deslizar para cerrar en pantallas táctiles: 'right'/'left' para un panel lateral, 'down' para la hoja inferior (solo desde su cabecera).
// Devuelve un ref para el elemento del panel. El panel sigue al dedo y se cierra al pasar un umbral; si no, vuelve a su lugar.
// No arranca sobre lo que ya usa el gesto: scroll horizontal, campos de texto o mapas.
const IGNORED = 'input,textarea,select,canvas,[data-noswipe]';
const HEAD = 64; // alto (px) de la cabecera de la hoja inferior desde donde se puede arrastrar
const SHEET = '(max-width:720px)'; // por encima de este ancho el listado es un panel flotante, no una hoja

export function useSwipeClose(onClose: () => void, dir: 'right' | 'left' | 'down') {
  const close = useRef(onClose);
  close.current = onClose;

  return useCallback((el: HTMLElement | null) => {
    if (!el) return;
    const vertical = dir === 'down';
    const sign = dir === 'left' ? -1 : 1;
    let from: { x: number; y: number } | null = null;
    let dragging = false;
    let moved = 0;

    const scrollsX = (target: EventTarget | null) => {
      for (let n = target as HTMLElement | null; n && n !== el; n = n.parentElement) {
        if (n.scrollWidth > n.clientWidth + 1 && /(auto|scroll)/.test(getComputedStyle(n).overflowX)) return true;
      }
      return false;
    };

    const start = (e: TouchEvent) => {
      from = null;
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      const target = e.target as Element;
      if (target.closest(IGNORED)) return;
      if (vertical ? !window.matchMedia(SHEET).matches || t.clientY - el.getBoundingClientRect().top > HEAD : scrollsX(target)) return;
      from = { x: t.clientX, y: t.clientY };
      dragging = false;
      moved = 0;
    };

    const move = (e: TouchEvent) => {
      if (!from) return;
      const dx = e.touches[0].clientX - from.x;
      const dy = e.touches[0].clientY - from.y;
      const along = (vertical ? dy : dx * sign);
      const across = vertical ? dx : dy;
      if (!dragging) {
        if (Math.abs(along) < 8 && Math.abs(across) < 8) return;
        if (along <= 0 || Math.abs(across) > along * 0.6) { from = null; return; } // scroll vertical, o hacia el otro lado: no es un cierre
        dragging = true;
        el.style.transition = 'none';
      }
      if (e.cancelable) e.preventDefault();
      moved = Math.max(0, along);
      el.style.transform = vertical ? `translateY(${moved}px)` : `translateX(${moved * sign}px)`;
    };

    const end = () => {
      if (dragging) {
        const size = vertical ? el.offsetHeight : el.offsetWidth;
        if (moved > Math.min(100, size * 0.3)) {
          close.current();
        } else {
          el.style.transition = 'transform .15s ease-out';
          el.style.transform = '';
          setTimeout(() => { el.style.transition = ''; }, 160);
        }
      }
      from = null;
      dragging = false;
    };

    el.addEventListener('touchstart', start, { passive: true });
    el.addEventListener('touchmove', move, { passive: false });
    el.addEventListener('touchend', end);
    el.addEventListener('touchcancel', end);
    return () => {
      el.removeEventListener('touchstart', start);
      el.removeEventListener('touchmove', move);
      el.removeEventListener('touchend', end);
      el.removeEventListener('touchcancel', end);
    };
  }, [dir]);
}
