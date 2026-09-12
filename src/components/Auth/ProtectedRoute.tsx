import { Navigate } from 'react-router-dom';
import { JSX } from "react";
import { useAuthStore, normalizeRole } from '../../stores/authStore';

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

    if (!normalizedAllowed.includes(userRole)) {
      return (
        <Navigate
          to={
            userRole === 'DUEÑO'
              ? '/owner'
              : userRole === 'ADMINISTRADOR'
              ? '/admin'
              : userRole === 'EMPLEADO'
              ? '/employee'
              : '/'
          }
          replace
        />
      );
    }
  }

  return children;
};


