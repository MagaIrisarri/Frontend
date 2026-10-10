import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';

export interface MenuItem { label: string; icon?: ReactNode; onClick: () => void; danger?: boolean; sep?: boolean }

// Menú contextual del prototipo (.menu): se abre bajo el botón, Escape o clic afuera lo cierran y el foco vuelve al botón.
export function Menu({ label, button, items, header, className = 'icon-btn' }: {
  label: string; button: ReactNode; items: MenuItem[]; header?: string; className?: string;
}) {
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!open || !btn.current || !menu.current) return;
    const r = btn.current.getBoundingClientRect(), m = menu.current, w = m.offsetWidth, h = m.offsetHeight;
    m.style.left = `${Math.max(8, Math.min(innerWidth - w - 8, r.right - w))}px`;
    m.style.top = `${r.bottom + h + 12 > innerHeight ? r.top - h - 4 : r.bottom + 4}px`;
    m.querySelector('button')?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = (focus: boolean) => { setOpen(false); if (focus) btn.current?.focus(); };
    const onDown = (e: PointerEvent) => { if (!menu.current?.contains(e.target as Node) && !btn.current?.contains(e.target as Node)) close(false); };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); close(true); }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const list = [...(menu.current?.querySelectorAll('button') ?? [])];
        const i = list.indexOf(document.activeElement as HTMLButtonElement);
        list[(i + (e.key === 'ArrowDown' ? 1 : list.length - 1)) % list.length]?.focus();
      }
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey, true);
    window.addEventListener('scroll', () => close(false), { once: true, capture: true });
    return () => { document.removeEventListener('pointerdown', onDown); document.removeEventListener('keydown', onKey, true); };
  }, [open]);

  return (
    <>
      <button ref={btn} type="button" className={className} aria-haspopup="menu" aria-expanded={open || undefined} aria-label={label} onClick={() => setOpen(o => !o)}>
        {button}
      </button>
      {open && (
        <div className="menu on" role="menu" ref={menu}>
          {header && <div className="mh">{header}</div>}
          {items.map((it, i) => (
            <div key={i} style={{ display: 'contents' }}>
              {it.sep && <hr />}
              <button type="button" role="menuitem" className={it.danger ? 'd' : ''} onClick={() => { setOpen(false); it.onClick(); }}>
                {it.icon}{it.label}
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
