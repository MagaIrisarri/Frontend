import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { Home } from './pages/Home/Home';
import { Login } from './pages/Auth/Login';
import { Register } from './pages/Auth/Register';
import ProfilePage from './pages/Profile/ProfilePage';
import VehicleManagement from './pages/Vehicle/VehicleManagement';
import VehicleRegister from './pages/Vehicle/VehicleRegister';
import OwnerDashboard from './pages/Owner/OwnerDashboard';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { PublicRoute } from './components/auth/PublicRoute';

export function App() {
  useEffect(() => {
    // Escuchar cambios en otras pestañas para cerrar sesión automáticamente
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user' && !e.newValue) {
        window.location.href = '/login';
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas Públicas (Si estás logueado te sacan de acá) */}
        <Route path="/" element={<PublicRoute><Home /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

        {/* Rutas Protegidas Generales (Clientes, etc) */}
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/vehicles" element={<ProtectedRoute><VehicleManagement /></ProtectedRoute>} />
        <Route path="/vehicles/new" element={<ProtectedRoute><VehicleRegister /></ProtectedRoute>} />
        
        {/* Rutas Protegidas - Solo DUEÑO */}
        <Route 
          path="/owner" 
          element={
            <ProtectedRoute allowedRoles={['DUEÑO']}>
              <OwnerDashboard />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;