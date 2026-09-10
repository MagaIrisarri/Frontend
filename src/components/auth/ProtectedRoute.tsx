import { Navigate } from 'react-router-dom';
import { JSX } from "react";


interface ProtectedRouteProps {
  children: JSX.Element;
  allowedRoles?: string[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const rawUser = localStorage.getItem('user');
  if (!rawUser) {
    return <Navigate to="/login" replace />;
  }

  try {
    const parsed = JSON.parse(rawUser);
    const user = parsed?.data ?? parsed?.user ?? parsed;
    
    // Si la ruta requiere un rol específico y el usuario no lo tiene
    if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.type)) {
      // Lo mandamos a su panel correspondiente
      return <Navigate to={user.type === 'DUEÑO' ? '/owner' : '/profile'} replace />;
    }
  } catch (e) {
    localStorage.removeItem('user');
    return <Navigate to="/login" replace />;
  }

  return children;
};

