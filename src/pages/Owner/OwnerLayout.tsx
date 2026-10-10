import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut, Map, Moon, RefreshCw, Sun, User } from 'lucide-react';
import OwnerShell from '../../components/Owner/ui/OwnerShell';
import { Menu } from '../../components/Owner/ui/Menu';
import { useToast } from '../../components/Owner/ui/Toasts';
import { useTheme } from '../../context/ThemeContext';
import { useAuthStore } from '../../stores/authStore';
import { OwnerProvider, useOwner } from './OwnerContext';
import { useOpenProfile } from '../../context/ProfileContext';

const VIEWS: [string, string][] = [
  ['/owner', 'Panel'], ['/owner/reservations', 'Reservas'], ['/owner/tariffs', 'Tarifas'],
  ['/owner/services', 'Servicios'], ['/owner/employees', 'Personal'], ['/owner/shifts', 'Turnos'],
];

function AppBar() {
  const onProfile = useOpenProfile();
  const { theme, toggleTheme } = useTheme();
  const { me, refresh } = useOwner();
  const logout = useAuthStore(s => s.logout);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const name = me.name || 'Dueño';

  return (
    <header className="appbar">
      <div className="bar">
        <NavLink className="brand" to="/owner" aria-label="ServicioCocheras, inicio"><span className="logo">SC</span><span>ServicioCocheras</span></NavLink>
        <span className="sep" />
        <nav className="nav" aria-label="Secciones del panel de dueño">
          {VIEWS.map(([to, l]) => (
            <button key={to} type="button" onClick={() => navigate(to)}
              aria-current={(to === '/owner' ? pathname === to : pathname.startsWith(to)) ? 'page' : undefined}>{l}</button>
          ))}
        </nav>
        <span className="grow" />
        <button type="button" className="icon-btn" data-tip="Ver en mapa" aria-label="Ver en mapa" onClick={() => navigate('/')}><Map className="i" /></button>
        <button type="button" className="icon-btn" aria-label="Actualizar datos" disabled={busy}
          onClick={async () => { setBusy(true); await refresh(); setBusy(false); toast('Datos actualizados.'); }}>
          <RefreshCw className={`i${busy ? ' spin' : ''}`} />
        </button>
        <button type="button" className="icon-btn" aria-label="Cambiar tema" onClick={toggleTheme}>
          {theme === 'dark' ? <Sun className="i" /> : <Moon className="i" />}
        </button>
        <Menu label={`Cuenta de ${name}`} className="me" header={`${name} · Dueño`}
          button={<><span className="av">{name[0]}</span><span className="nm2">{name}</span><ChevronDown className="i sm" /></>}
          items={[
            { label: 'Mi perfil', icon: <User className="i" />, onClick: onProfile },
            { label: 'Cerrar sesión', icon: <LogOut className="i" />, sep: true, onClick: () => { logout(); navigate('/login'); } },
          ]} />
      </div>
    </header>
  );
}

// Raíz de todas las vistas del dueño (owner-design/owner.html).
export default function OwnerLayout() {
  return (
    <OwnerShell>
      <OwnerProvider>
        <AppBar />
        <main className="page"><Outlet /></main>
      </OwnerProvider>
    </OwnerShell>
  );
}
