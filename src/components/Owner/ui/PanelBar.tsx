import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, LogOut, Moon, RefreshCw, Sun, User } from 'lucide-react';
import { Menu } from './Menu';
import { useToast } from './Toasts';
import { useTheme } from '../../../context/ThemeContext';
import { useAuthStore } from '../../../stores/authStore';
import { useOpenProfile } from '../../../context/ProfileContext';
import { useNotifications } from '../../../context/NotificationsContext';

// Barra superior de los paneles (dueño, empleado, administrador): marca, secciones, actualizar, tema y cuenta.
export default function PanelBar({ home, role, views = [], onRefresh }: {
  home: string;
  role: string; // se muestra en el menú de la cuenta: "Ana · Empleado"
  views?: [string, string][]; // [ruta, etiqueta]
  onRefresh?: () => Promise<void>;
}) {
  const onProfile = useOpenProfile();
  const { unread, open: openNotifications } = useNotifications();
  const { theme, toggleTheme } = useTheme();
  const user = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const name = user?.name || role;

  return (
    <header className="appbar">
      <div className="bar">
        <NavLink className="brand" to={home} aria-label="ServicioCocheras, inicio"><span className="logo">SC</span><span>ServicioCocheras</span></NavLink>
        {views.length > 0 && <>
          <span className="sep" />
          <nav className="nav" aria-label={`Secciones del panel de ${role.toLowerCase()}`}>
            {views.map(([to, l]) => (
              <button key={to} type="button" onClick={() => navigate(to)}
                aria-current={(to === home ? pathname === to : pathname.startsWith(to)) ? 'page' : undefined}>{l}</button>
            ))}
          </nav>
        </>}
        <span className="grow" />
        {onRefresh && (
          <button type="button" className="icon-btn" aria-label="Actualizar datos" disabled={busy}
            onClick={async () => { setBusy(true); await onRefresh(); setBusy(false); toast('Datos actualizados.'); }}>
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
