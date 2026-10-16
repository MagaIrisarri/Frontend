// En lista + detalle, en pantallas angostas el detalle queda debajo de la lista: al elegir un elemento se lo trae a la vista.
export function revealOnMobile(el: HTMLElement | null) {
  if (!el || !window.matchMedia('(max-width: 719px)').matches) return;
  requestAnimationFrame(() => el.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }));
}
