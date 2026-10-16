import { Navigate } from 'react-router-dom';
import type { JSX } from "react";
import { useAuthStore, normalizeRole, homeForRole } from '../../stores/authStore';

interface ProtectedRouteProps {
  children: JSX.Element;
  allowedRoles?: string[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = normalizeRole(user.type || user.role);
    const normalizedAllowed = allowedRoles.map((r) => normalizeRole(r));

    // Sin permiso: cada rol vuelve a su propio panel.
    if (!normalizedAllowed.includes(userRole)) {
      return <Navigate to={homeForRole(userRole)} replace />;
    }
  }

  return children;
};

/**
 * Pantallas del cliente que también ve un visitante sin sesión (el mapa).
 * Dueño, empleado y administrador van a su panel; como el login es un modal sobre el mapa,
 * esto también los redirige apenas inician sesión.
 */
export const ClientOrGuestRoute = ({ children }: { children: JSX.Element }) => {
  const user = useAuthStore((state) => state.user);
  const home = homeForRole(normalizeRole(user?.type || user?.role));

  return user && home !== '/' ? <Navigate to={home} replace /> : children;
};
