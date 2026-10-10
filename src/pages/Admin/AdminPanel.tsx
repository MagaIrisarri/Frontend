import { Outlet } from 'react-router-dom';
import OwnerShell from '../../components/Owner/ui/OwnerShell';
import PanelBar from '../../components/Owner/ui/PanelBar';

const VIEWS: [string, string][] = [
  ['/admin', 'Panel'], ['/admin/users', 'Usuarios'], ['/admin/vehicles', 'Vehículos'], ['/admin/vehicle-types', 'Tipos de vehículo'],
  ['/admin/brands', 'Marcas'], ['/admin/insurances', 'Seguros'], ['/admin/services', 'Servicios'],
];

// Raíz del panel del administrador, con la misma barra y estilos que el del dueño.
export default function AdminPanel() {
  return (
    <OwnerShell>
      <PanelBar home="/admin" role="Administrador" views={VIEWS} />
      <main className="page"><Outlet /></main>
    </OwnerShell>
  );
}
