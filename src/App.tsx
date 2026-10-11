import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import HomePage from './pages/Home/HomePage';
import { ProfileProvider } from './context/ProfileContext';
import { AppLayout } from './components/Layout/AppLayout';
import { ParkingSpaceMap } from './pages/ParkingSpace/ParkingSpaceMap';
import OwnerDashboard from './pages/Owner/OwnerDashboard';
import OwnerReservations from './pages/Owner/OwnerReservations';
import OwnerEmployees from './pages/Owner/OwnerEmployees';
import OwnerTariffs from './pages/Owner/OwnerTariffs';
import OwnerServices from './pages/Owner/OwnerServices';
import OwnerLayout from './pages/Owner/OwnerLayout';
import OwnerShifts from './pages/Owner/OwnerShifts';
import { ProtectedRoute } from './components/Auth/ProtectedRoute';
import { ParkingSpaceEdit } from './pages/ParkingSpace/ParkingSpaceEdit';
import MetricsView from './pages/Owner/MetricsView';

/**
 * Componentes de redirección para preservar compatibilidad con enlaces y marcadores previos
 */
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
          <Route path="/parkings/:id/reservar" element={<ParkingSpaceMap />} />
        </Route>

        {/* Rutas Protegidas Generales (Perfil, Vehículos, Facturas y Reservas) */}
        <Route path="/vehicles" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        <Route path="/vehicles/new" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        <Route path="/vehicles/:id/edit" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        <Route path="/invoices" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
        <Route path="/reservations" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />

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

