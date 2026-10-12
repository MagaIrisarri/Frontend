import { useCallback, useEffect, useRef } from 'react';
import { useClosing } from '../components/Owner/ui/Presence';

// Movimiento de paneles (Drawer y hoja inferior de Home). En móvil (≤720 px) los paneles son hojas que suben desde abajo y se cierran hacia abajo, como en iOS;
// en tablet y escritorio entran por el costado. El menú (`left`) siempre es de costado.
// Movimiento de paneles: entrada, salida y deslizar para cerrar con un mismo resorte.
// - Parte siempre del valor en pantalla y conserva la velocidad: reabrir a mitad de la salida o soltar un arrastre no deja saltos.
// - Al soltar, la velocidad del dedo se proyecta (§6 de Apple Design) y decide si se cierra; no solo la distancia.
// - Del lado opuesto al cierre el panel resiste (rubber-band) y el fondo (.scrim, vía --mp) se atenúa en proporción al desplazamiento.
// - Con `peek` (hoja inferior de Home) hay una posición intermedia: un arrastre moderado la deja asomada para ver el mapa; uno largo o veloz la cierra; desde ahí se vuelve a subir.
// - No arranca sobre lo que ya usa el gesto: scroll horizontal, campos de texto o mapas.
// - Con prefers-reduced-motion no hay desplazamiento: solo un fundido.
const IGNORED = 'input,textarea,select,canvas,[data-noswipe]';
const HEAD = 88; // alto (px) de la cabecera de la hoja inferior (agarre + título) desde donde se puede arrastrar
const SHEET = '(max-width:720px)'; // por encima de este ancho el listado es un panel flotante, no una hoja
const REDUCED = '(prefers-reduced-motion: reduce)';
const RESPONSE = 0.28; // s hasta llegar al destino (no es una duración)
const DECEL = 0.998; // desaceleración del scroll de iOS, para proyectar dónde terminaría el gesto
const RUBBER = 0.55;
const PEEK = 72; // px de la hoja que quedan a la vista en la posición intermedia: la cabecera

type Dir = 'right' | 'left' | 'down';

const rubber = (over: number, dim: number) => (over * dim * RUBBER) / (dim + RUBBER * Math.abs(over));

function createMotion(el: HTMLElement, dir: Dir, peek: boolean) {
  const layer = el.parentElement?.classList.contains('layer') ? el.parentElement : null;
  let x = 0; // desplazamiento hacia afuera, en px (0 = abierto)
  let v = 0; // px/s
  let target = 0;
  let damping = 1;
  let dist = 0;
  let raf = 0;
  let last = 0;
  let peeked = false;

  const axis = (): Dir => (dir === 'left' ? 'left' : window.matchMedia(SHEET).matches ? 'down' : 'right');
  const peekAt = () => el.offsetHeight - PEEK;
  const sheetPeek = () => peek && axis() === 'down';
  const measure = () => { dist = (axis() === 'down' ? el.offsetHeight : el.offsetWidth) + 32; };
  const apply = () => {
    const p = dist ? Math.min(1, Math.max(0, x / dist)) : 0;
    if (window.matchMedia(REDUCED).matches) {
      el.style.transform = '';
      el.style.opacity = String(1 - p);
    } else {
      const a = axis();
      el.style.transform = a === 'down' ? `translateY(${x}px)` : `translateX(${a === 'left' ? -x : x}px)`;
    }
    layer?.style.setProperty('--mp', String(p));
  };
  const step = (t: number) => {
    const w = (2 * Math.PI) / RESPONSE;
    const dt = Math.min(0.032, (t - last) / 1000) / 2;
    last = t;
    for (let i = 0; i < 2; i++) { // semi-implícito, dos subpasos por cuadro
      v += (-w * w * (x - target) - 2 * damping * w * v) * dt;
      x += v * dt;
    }
    if (Math.abs(x - target) < 0.3 && Math.abs(v) < 5) { x = target; v = 0; raf = 0; apply(); return; }
    apply();
    raf = requestAnimationFrame(step);
  };
  const go = (to: number, vel = v, damp = 1) => {
    target = to; v = vel; damping = damp; last = performance.now();
    if (!raf) raf = requestAnimationFrame(step);
  };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };

  measure();
  x = dist; // entra desde el borde por el mismo camino por el que se va
  apply();
  go(0);

  return {
    axis,
    get moving() { return raf !== 0; },
    get peeked() { return peeked; },
    snaps: () => (sheetPeek() ? [0, peekAt(), dist] : [0, dist]),
    get x() { return x; },
    get dist() { return dist; },
    setClosing(closing: boolean) { measure(); peeked = false; const to = closing ? dist : 0; if (to !== target) go(to); },
    expand() { measure(); peeked = false; if (target !== 0) go(0); },
    grab() { stop(); v = 0; measure(); },
    drag(pos: number) { x = pos >= 0 ? pos : -rubber(-pos, dist); apply(); },
    release(vel: number, to: number) { peeked = sheetPeek() && to === peekAt(); go(to, vel, to !== dist && Math.abs(vel) > 300 ? 0.8 : 1); },
    destroy: stop,
  };
}

// Devuelve un ref para el elemento del panel. Debe usarse dentro de un <Presence>/<Shown>: de ahí toma si el panel se está yendo.
// `peek` agrega la posición intermedia (solo en la hoja inferior); `resetKey` la abre del todo cuando cambia (p. ej. al elegir otra cochera).
export function useSwipeClose(onClose: () => void, dir: Dir, opts: { peek?: boolean; resetKey?: unknown } = {}) {
  const close = useRef(onClose);
  close.current = onClose;
  const motion = useRef<ReturnType<typeof createMotion> | null>(null);
  const closing = useClosing();

  useEffect(() => { motion.current?.setClosing(closing); }, [closing]);
  useEffect(() => { motion.current?.expand(); }, [opts.resetKey]);

  return useCallback((el: HTMLElement | null) => {
    if (!el) return;
    const m = createMotion(el, dir, !!opts.peek);
    motion.current = m;
    const sign = dir === 'left' ? -1 : 1;
    let from: { x: number; y: number } | null = null;
    let base = 0;
    let dragging = false;
    let trail: { t: number; p: number }[] = [];

    const scrollsX = (target: EventTarget | null) => {
      for (let n = target as HTMLElement | null; n && n !== el; n = n.parentElement) {
        if (n.scrollWidth > n.clientWidth + 1 && /(auto|scroll)/.test(getComputedStyle(n).overflowX)) return true;
      }
      return false;
    };
    const vert = () => m.axis() === 'down';
    // en una hoja, un arrastre hacia abajo también la mueve si su contenido ya está arriba del todo (como en iOS)
    const atTop = (target: EventTarget | null) => {
      for (let n = target as HTMLElement | null; n && n !== el; n = n.parentElement) {
        if (n.scrollHeight > n.clientHeight + 1 && /(auto|scroll)/.test(getComputedStyle(n).overflowY) && n.scrollTop > 0) return false;
      }
      return true;
    };
    const along = (e: TouchEvent) => (vert() ? e.touches[0].clientY - from!.y : (e.touches[0].clientX - from!.x) * sign);

    const start = (e: TouchEvent) => {
      from = null;
      if (e.touches.length !== 1 || window.matchMedia(REDUCED).matches) return;
      const t = e.touches[0];
      const target = e.target as Element;
      if (target.closest(IGNORED)) return;
      if (vert() ? t.clientY - el.getBoundingClientRect().top > HEAD && !atTop(target) : scrollsX(target)) return;
      from = { x: t.clientX, y: t.clientY };
      trail = [];
      dragging = m.moving; // un panel todavía en movimiento se agarra al instante, sin esperar el umbral
      base = m.x;
      if (dragging) m.grab();
    };

    const move = (e: TouchEvent) => {
      if (!from) return;
      const a = along(e);
      const across = vert() ? e.touches[0].clientX - from.x : e.touches[0].clientY - from.y;
      if (!dragging) {
        if (Math.abs(a) < 8 && Math.abs(across) < 8) return;
        if ((a <= 0 && !m.peeked) || Math.abs(across) > Math.abs(a) * 0.6) { from = null; return; } // scroll vertical, o hacia el otro lado: no es un cierre
        dragging = true;
        base = m.x;
        m.grab();
      }
      if (e.cancelable) e.preventDefault();
      m.drag(base + a);
      trail.push({ t: e.timeStamp, p: a });
      if (trail.length > 6) trail.shift();
    };

    const end = (e: TouchEvent) => {
      if (dragging) {
        const a = trail.length ? trail[trail.length - 1] : null;
        const b = trail.find(s => a && a.t - s.t <= 100);
        const still = !a || e.timeStamp - a.t > 100; // el dedo se detuvo antes de soltar: sin velocidad
        const vel = !still && a && b && a.t > b.t ? ((a.p - b.p) / (a.t - b.t)) * 1000 : 0; // px/s hacia afuera
        const projected = m.x + (vel / 1000) * (DECEL / (1 - DECEL));
        const to = e.type === 'touchend' ? m.snaps().reduce((best, p) => (Math.abs(p - projected) < Math.abs(best - projected) ? p : best)) : m.snaps()[m.peeked ? 1 : 0];
        m.release(vel, to);
        if (to === m.dist) close.current();
      }
      from = null;
      dragging = false;
    };

    const tap = (e: MouseEvent) => { if (m.peeked && !(e.target as Element).closest('button,a')) { e.stopPropagation(); m.expand(); } };
    el.addEventListener('click', tap, true);
    el.addEventListener('touchstart', start, { passive: true });
    el.addEventListener('touchmove', move, { passive: false });
    el.addEventListener('touchend', end);
    el.addEventListener('touchcancel', end);
    return () => {
      m.destroy();
      motion.current = null;
      el.removeEventListener('click', tap, true);
      el.removeEventListener('touchstart', start);
      el.removeEventListener('touchmove', move);
      el.removeEventListener('touchend', end);
      el.removeEventListener('touchcancel', end);
    };
  }, [dir, opts.peek]);
}
