import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import HomePage from './pages/Home/HomePage';
import { ProfileProvider } from './context/ProfileContext';
import { NotificationsProvider } from './context/NotificationsContext';
import { AppLayout } from './components/Layout/AppLayout';
import { ParkingSpaceMap } from './pages/ParkingSpace/ParkingSpaceMap';
import OwnerDashboard from './pages/Owner/OwnerDashboard';
import OwnerReservations from './pages/Owner/OwnerReservations';
import OwnerEmployees from './pages/Owner/OwnerEmployees';
import OwnerTariffs from './pages/Owner/OwnerTariffs';
import OwnerServices from './pages/Owner/OwnerServices';
import OwnerLayout from './pages/Owner/OwnerLayout';
import OwnerShifts from './pages/Owner/OwnerShifts';
import { ProtectedRoute, ClientOrGuestRoute } from './components/Auth/ProtectedRoute';
import OwnerSpaces from './pages/Owner/OwnerSpaces';
import MetricsView from './pages/Owner/MetricsView';
import EmployeeDashboard from './pages/Employee/EmployeeDashboard';
import AdminPanel from './pages/Admin/AdminPanel';
import AdminService from './pages/Admin/AdminService';
import AdminUsers from './pages/Admin/AdminUsers';
import AdminParkings from './pages/Admin/AdminParkings';
import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminVehicles from './pages/Admin/AdminVehicles';
import AdminBrands from './pages/Admin/AdminBrands';
import AdminInsurances from './pages/Admin/AdminInsurances';
import AdminVehicleTypes from './pages/Admin/AdminVehicleTypes';
import AdminHolidays from './pages/Admin/AdminHolidays';
import { ScrollLockGuard } from './components/Owner/ui/ScrollLockGuard';

/**
 * Componentes de redirección para preservar compatibilidad con enlaces y marcadores previos
 */
// Las plazas se gestionan en el panel del dueño; las rutas viejas llevan ahí con la sucursal elegida.
function RedirectToParkingSpaces() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/owner/spaces?p=${id}`} replace />;
}

export function App() {
  return (
    <BrowserRouter>
      <ScrollLockGuard />
      <ProfileProvider><NotificationsProvider>
      <Routes>
        {/* Ruta Principal: Mapa (clientes y visitantes; los demás roles van a su panel) */}
        <Route path="/" element={<ClientOrGuestRoute><HomePage /></ClientOrGuestRoute>} />

        {/* Redirecciones de rutas de auth y obsoletas directamente a Home */}
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/register" element={<Navigate to="/" replace />} />
        <Route path="/dashboard" element={<Navigate to="/" replace />} />
        <Route path="/parking" element={<Navigate to="/" replace />} />

        {/* Flujo de Reserva con Layout (solo clientes) */}
        <Route element={<ProtectedRoute allowedRoles={['CLIENTE']}><AppLayout /></ProtectedRoute>}>
          <Route path="/parkings/:id/reservar" element={<ParkingSpaceMap />} />
        </Route>

        {/* Vehículos, facturas y reservas propias (solo clientes): abren Home con su panel */}
        <Route path="/vehicles" element={<ProtectedRoute allowedRoles={['CLIENTE']}><HomePage /></ProtectedRoute>} />
        <Route path="/vehicles/new" element={<ProtectedRoute allowedRoles={['CLIENTE']}><HomePage /></ProtectedRoute>} />
        <Route path="/vehicles/:id/edit" element={<ProtectedRoute allowedRoles={['CLIENTE']}><HomePage /></ProtectedRoute>} />
        <Route path="/invoices" element={<ProtectedRoute allowedRoles={['CLIENTE']}><HomePage /></ProtectedRoute>} />
        <Route path="/reservations" element={<ProtectedRoute allowedRoles={['CLIENTE']}><HomePage /></ProtectedRoute>} />

        {/* Empleado: confirmar, check-in y check-out (genera y cobra la factura) */}
        <Route
          path="/employee"
          element={
            <ProtectedRoute allowedRoles={['EMPLEADO']}>
              <EmployeeDashboard />
            </ProtectedRoute>
          }
        />

        {/* Administrador: usuarios, cocheras, catálogo de marcas y modelos (con el CSV del DNRPA), tipos de vehículo, seguros, servicios y feriados nacionales */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['ADMINISTRADOR']}>
              <AdminPanel />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="parkings" element={<AdminParkings />} />
          <Route path="vehicles" element={<AdminVehicles />} />
          <Route path="brands" element={<AdminBrands />} />
          <Route path="vehicle-types" element={<AdminVehicleTypes />} />
          <Route path="insurances" element={<AdminInsurances />} />
          <Route path="services" element={<AdminService />} />
          <Route path="holidays" element={<AdminHolidays />} />
        </Route>

        {/* =========================================================
            RUTAS DE DUEÑO (DUEÑO)
           ========================================================= */}
        {/* Panel del dueño (owner-design/owner.html): una sola raíz con navegación propia */}
        <Route
          path="/owner"
          element={
            <ProtectedRoute allowedRoles={['DUEÑO']}>
              <OwnerLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<OwnerDashboard />} />
          <Route path="reservations" element={<OwnerReservations />} />
          <Route path="tariffs" element={<OwnerTariffs />} />
          <Route path="services" element={<OwnerServices />} />
          <Route path="employees" element={<OwnerEmployees />} />
          {/* el alta y la edición de empleados ahora son un panel lateral dentro de Personal */}
          <Route path="employees/*" element={<Navigate to="/owner/employees" replace />} />
          <Route path="shifts" element={<OwnerShifts />} />
          <Route path="spaces" element={<OwnerSpaces />} />
        </Route>

        {/* El listado, el alta y la edición de sucursales viven en /owner; las rutas viejas caen en el fallback */}
        <Route path="/my-parkings/:id/spaces" element={<RedirectToParkingSpaces />} />

        {/* Métricas y reportes de facturación */}
        <Route
          path="/parkings/:id/metrics"
          element={
            <ProtectedRoute allowedRoles={['DUEÑO']}>
              <MetricsView />
            </ProtectedRoute>
          }
        />


        {/* Redirecciones de compatibilidad para plazas */}
        <Route path="/parking-space/:id" element={<RedirectToParkingSpaces />} />
        <Route path="/my-parkings/edit/:id/space" element={<RedirectToParkingSpaces />} />
        <Route path="/my-parkings/update/:id/space" element={<RedirectToParkingSpaces />} />

        {/* Fallback general */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </NotificationsProvider></ProfileProvider>
    </BrowserRouter>
  );
}

export default App;

