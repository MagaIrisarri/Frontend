import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import HomePage from './pages/Home/HomePage';
import MyParkings from './pages/Parking/MyParkings';
import ParkingCreate from './pages/Parking/ParkingCreate';
import { ProfileProvider } from './context/ProfileContext';
import VehicleManagement from './pages/Vehicle/VehicleManagement';
import VehicleRegister from './pages/Vehicle/VehicleRegister';
import VehicleEdit from './pages/Vehicle/VehicleEdit';
import { AppLayout } from './components/Layout/AppLayout';
import VehicleSelect from './pages/Vehicle/VehicleSelect';
import { ParkingSpaceMap } from './pages/ParkingSpace/ParkingSpaceMap';
import EditParkingForm from './pages/Parking/EditParkingForm';
import OwnerDashboard from './pages/Owner/OwnerDashboard';
import OwnerReservations from './pages/Owner/OwnerReservations';
import OwnerEmployees from './pages/Owner/OwnerEmployees';
import OwnerTariffs from './pages/Owner/OwnerTariffs';
import OwnerServices from './pages/Owner/OwnerServices';
import OwnerLayout from './pages/Owner/OwnerLayout';
import OwnerShifts from './pages/Owner/OwnerShifts';
import { ProtectedRoute } from './components/Auth/ProtectedRoute';
import { ParkingSpaceEdit } from './pages/ParkingSpace/ParkingSpaceEdit';
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
      <ProfileProvider>
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
        <Route path="/vehicles" element={<ProtectedRoute><VehicleManagement /></ProtectedRoute>} />
        <Route path="/vehicles/new" element={<ProtectedRoute><VehicleRegister /></ProtectedRoute>} />
        <Route path="/vehicles/:id/edit" element={<ProtectedRoute><VehicleEdit /></ProtectedRoute>} />
        <Route path="/invoices" element={<ProtectedRoute><MyInvoices /></ProtectedRoute>} />
        <Route path="/reservations" element={<ProtectedRoute><MyReservations /></ProtectedRoute>} />

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
        </Route>

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
      </ProfileProvider>
    </BrowserRouter>
  );
}

export default App;

