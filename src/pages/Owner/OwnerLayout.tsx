import { Outlet } from 'react-router-dom';
import OwnerShell from '../../components/Owner/ui/OwnerShell';
import PanelBar from '../../components/Owner/ui/PanelBar';
import { OwnerProvider, useOwner } from './OwnerContext';

const VIEWS: [string, string][] = [
  ['/owner', 'Panel'], ['/owner/reservations', 'Reservas'], ['/owner/spaces', 'Plazas'], ['/owner/tariffs', 'Tarifas'],
  ['/owner/services', 'Servicios'], ['/owner/employees', 'Personal'], ['/owner/shifts', 'Turnos'],
];

function AppBar() {
  const { refresh } = useOwner();
  return <PanelBar home="/owner" role="Dueño" views={VIEWS} onRefresh={refresh} />;
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
