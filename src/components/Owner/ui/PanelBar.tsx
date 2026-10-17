import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, ChevronLeft, ChevronRight, LogOut, Moon, RefreshCw, Sun, User } from 'lucide-react';
import { Menu } from './Menu';
import { useToast } from './Toasts';
import { useTheme } from '../../../context/ThemeContext';
import { useAuthStore } from '../../../stores/authStore';
import { useOpenProfile } from '../../../context/ProfileContext';
import { useNotifications } from '../../../context/NotificationsContext';

// Barra superior de los paneles (dueño, empleado, administrador): marca, secciones, actualizar, tema y cuenta.
export default function PanelBar({ home, role, views = [], onRefresh, keep }: {
  home: string;
  role: string; // se muestra en el menú de la cuenta: "Ana · Empleado"
  views?: [string, string][]; // [ruta, etiqueta]
  onRefresh?: () => Promise<boolean | void>; // false: no se pudo actualizar
  keep?: string; // parámetro de la URL que acompaña al cambiar de sección (la sucursal activa del dueño), salvo hacia el inicio
}) {
  const onProfile = useOpenProfile();
  const { unread, open: openNotifications } = useNotifications();
  const { theme, toggleTheme } = useTheme();
  const user = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const kept = keep && new URLSearchParams(search).get(keep);
  const href = (to: string) => (kept && to !== home ? `${to}?${new URLSearchParams({ [keep!]: kept })}` : to);
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const name = user?.name || role;
  // Si la navegación no entra y se desliza, la sección actual queda a la vista (centrada) al cambiar de ruta.
  const navRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const n = navRef.current, el = n?.querySelector<HTMLElement>('[aria-current=page]');
    if (!n || !el || n.scrollWidth <= n.clientWidth) return;
    const r = el.getBoundingClientRect(), nr = n.getBoundingClientRect();
    n.scrollBy({ left: r.left - nr.left - (nr.width - r.width) / 2, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }, [pathname]);
  // Con mouse no hay gesto para deslizarla: flechas en el borde que tiene más secciones, y la rueda vertical la desliza.
  const [edge, setEdge] = useState({ prev: false, next: false });
  useEffect(() => {
    const n = navRef.current;
    if (!n) return;
    const update = () => setEdge({ prev: n.scrollLeft > 1, next: n.scrollLeft + n.clientWidth < n.scrollWidth - 1 });
    const wheel = (e: WheelEvent) => {
      if (n.scrollWidth <= n.clientWidth || Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      e.preventDefault();
      n.scrollLeft += e.deltaY;
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(n);
    n.addEventListener('scroll', update, { passive: true });
    n.addEventListener('wheel', wheel, { passive: false });
    return () => { ro.disconnect(); n.removeEventListener('scroll', update); n.removeEventListener('wheel', wheel); };
  }, [views.length]);
  const slide = (dir: 1 | -1) => {
    const n = navRef.current;
    n?.scrollBy({ left: dir * n.clientWidth * 0.7, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };

  return (
    <header className="appbar">
      <div className="bar">
        <NavLink className="brand" to={home} aria-label="ServicioCocheras, inicio"><span className="logo">SC</span><span>ServicioCocheras</span></NavLink>
        {views.length > 0 && <>
          <span className="sep" />
          <div className="navw">
            {/* Solo para el mouse: con teclado se llega a cada sección con Tab, y el foco la trae a la vista. */}
            {edge.prev && <button type="button" className="icon-btn navbtn prev" tabIndex={-1} aria-label="Ver secciones anteriores" onClick={() => slide(-1)}><ChevronLeft className="i" /></button>}
            <nav className="nav" ref={navRef} aria-label={`Secciones del panel de ${role.toLowerCase()}`}>
              {views.map(([to, l]) => <NavLink key={to} to={href(to)} end={to === home}>{l}</NavLink>)}
            </nav>
            {edge.next && <button type="button" className="icon-btn navbtn next" tabIndex={-1} aria-label="Ver más secciones" onClick={() => slide(1)}><ChevronRight className="i" /></button>}
          </div>
        </>}
        <span className="grow" />
        {onRefresh && (
          <button type="button" className="icon-btn" aria-label="Actualizar datos" disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                const ok = await onRefresh();
                if (ok === false) toast('No se pudieron actualizar los datos. Revisá tu conexión.', 'err'); else toast('Datos actualizados.');
              } catch { toast('No se pudieron actualizar los datos. Revisá tu conexión.', 'err'); } finally { setBusy(false); }
            }}>
            <RefreshCw className={`i${busy ? ' spin' : ''}`} />
          </button>
        )}
        <button type="button" className="icon-btn has-badge" data-tip="Notificaciones" onClick={openNotifications}
          aria-label={`Notificaciones${unread > 0 ? `, ${unread} sin leer` : ''}`}>
          <Bell className="i" />{unread > 0 && <span className="nbadge" aria-hidden="true">{unread}</span>}
        </button>
        <button type="button" className="icon-btn" aria-label="Cambiar tema" onClick={toggleTheme}>
          {theme === 'dark' ? <Sun className="i" /> : <Moon className="i" />}
        </button>
        <Menu label={`Cuenta de ${name}`} className="me" header={`${name} · ${role}`}
          button={<><span className="av">{name[0]}</span><span className="nm2">{name}</span><ChevronDown className="i sm" /></>}
          items={[
            { label: 'Mi perfil', icon: <User className="i" />, onClick: onProfile },
            { label: 'Cerrar sesión', icon: <LogOut className="i" />, sep: true, onClick: () => { logout(); navigate('/'); } },
          ]} />
      </div>
    </header>
  );
}
