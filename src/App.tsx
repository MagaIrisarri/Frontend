import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import HomePage from './pages/Home/HomePage';
import MyParkings from './pages/Parking/MyParkings';
import ParkingCreate from './pages/Parking/ParkingCreate';
import ProfilePage from './pages/Profile/ProfilePage';
import VehicleManagement from './pages/Vehicle/VehicleManagement';
import VehicleRegister from './pages/Vehicle/VehicleRegister';
import VehicleEdit from './pages/Vehicle/VehicleEdit';
import { AppLayout } from './components/Layout/AppLayout';
import VehicleSelect from './pages/Vehicle/VehicleSelect';
import { ParkingSpaceMap } from './pages/ParkingSpace/ParkingSpaceMap';
import EditParkingForm from './pages/Parking/EditParkingForm';
import OwnerDashboard from './pages/Owner/OwnerDashboard';
import OwnerReservations from './pages/Owner/OwnerReservations';
import { ProtectedRoute } from './components/Auth/ProtectedRoute';
import AdminPanel from './pages/Admin/AdminPanel';
import AdminVehicleTypes from './pages/Admin/AdminVehicleTypes';
import AdminService from './pages/Admin/AdminService';
import { ParkingSpaceEdit } from './pages/ParkingSpace/ParkingSpaceEdit';
import EmployeeDashboard from './pages/Employee/EmployeeDashboard';
import MyInvoices from './pages/Invoice/MyInvoices';
import MetricsView from './pages/Owner/MetricsView';
import MyReservations from './pages/Reservation/MyReservations';

/**
 * Componentes de redirección para preservar compatibilidad con enlaces y marcadores previos
 */
function RedirectToParkingEdit() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/my-parkings/${id}/edit`} replace />;
}

function RedirectToParkingSpaces() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/my-parkings/${id}/spaces`} replace />;
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta Principal: Mapa y Dashboard Unificado */}
        <Route path="/" element={<HomePage />} />

        {/* Redirecciones de rutas de auth y obsoletas directamente a Home */}
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/register" element={<Navigate to="/" replace />} />
        <Route path="/dashboard" element={<Navigate to="/" replace />} />
        <Route path="/parking" element={<Navigate to="/" replace />} />

        {/* Flujo de Reserva con Layout (Protegido) */}
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="/select-vehicle" element={<VehicleSelect />} />
          <Route path="/parkings/:id/reservar" element={<ParkingSpaceMap />} />
        </Route>

        {/* Rutas Protegidas Generales (Perfil, Vehículos, Facturas y Reservas) */}
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/vehicles" element={<ProtectedRoute><VehicleManagement /></ProtectedRoute>} />
        <Route path="/vehicles/new" element={<ProtectedRoute><VehicleRegister /></ProtectedRoute>} />
        <Route path="/vehicles/:id/edit" element={<ProtectedRoute><VehicleEdit /></ProtectedRoute>} />
        <Route path="/invoices" element={<ProtectedRoute><MyInvoices /></ProtectedRoute>} />
        <Route path="/reservations" element={<ProtectedRoute><MyReservations /></ProtectedRoute>} />

        {/* Rutas Protegidas - Solo EMPLEADO */}
        <Route
          path="/employee"
          element={
            <ProtectedRoute allowedRoles={['EMPLEADO']}>
              <EmployeeDashboard />
            </ProtectedRoute>
          }
        />

        {/* Rutas Protegidas - Solo ADMINISTRADOR */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['ADMINISTRADOR']}>
              <AdminPanel />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/vehicles"
          element={
            <ProtectedRoute allowedRoles={['ADMINISTRADOR']}>
              <AdminVehicleTypes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/services"
          element={
            <ProtectedRoute allowedRoles={['ADMINISTRADOR']}>
              <AdminService />
            </ProtectedRoute>
          }
        />

        {/* =========================================================
            RUTAS DE DUEÑO (DUEÑO)
           ========================================================= */}
        {/* Panel principal de control */}
        <Route
          path="/owner"
          element={
            <ProtectedRoute allowedRoles={['DUEÑO']}>
              <OwnerDashboard />
            </ProtectedRoute>
          }
        />

        {/* Gestión de reservas de sus cocheras */}
        <Route
          path="/owner/reservations"
          element={
            <ProtectedRoute allowedRoles={['DUEÑO']}>
              <OwnerReservations />
            </ProtectedRoute>
          }
        />

        {/* Listado y gestión de estacionamientos */}
        <Route
          path="/my-parkings"
          element={
            <ProtectedRoute allowedRoles={['DUEÑO']}>
              <MyParkings />
            </ProtectedRoute>
          }
        />

        {/* Alta de nuevo estacionamiento */}
        <Route
          path="/my-parkings/create"
          element={
            <ProtectedRoute allowedRoles={['DUEÑO']}>
              <ParkingCreate />
            </ProtectedRoute>
          }
        />

        {/* Edición de estacionamiento (Ruta canónica RESTful) */}
        <Route
          path="/my-parkings/:id/edit"
          element={
            <ProtectedRoute allowedRoles={['DUEÑO']}>
              <EditParkingForm />
            </ProtectedRoute>
          }
        />

        {/* Distribución y edición de plazas (Ruta canónica RESTful) */}
        <Route
          path="/my-parkings/:id/spaces"
          element={
            <ProtectedRoute allowedRoles={['DUEÑO']}>
              <ParkingSpaceEdit />
            </ProtectedRoute>
          }
        />

        {/* Métricas y reportes de facturación */}
        <Route
          path="/parkings/:id/metrics"
          element={
            <ProtectedRoute allowedRoles={['DUEÑO']}>
              <MetricsView />
            </ProtectedRoute>
          }
        />

        {/* Redirecciones de compatibilidad para edición de cocheras */}
        <Route path="/my-parkings/edit/:id" element={<RedirectToParkingEdit />} />
        <Route path="/my-parkings/update/:id" element={<RedirectToParkingEdit />} />

        {/* Redirecciones de compatibilidad para plazas */}
        <Route path="/parking-space/:id" element={<RedirectToParkingSpaces />} />
        <Route path="/my-parkings/edit/:id/space" element={<RedirectToParkingSpaces />} />
        <Route path="/my-parkings/update/:id/space" element={<RedirectToParkingSpaces />} />

        {/* Fallback general */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

