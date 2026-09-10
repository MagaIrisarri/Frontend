import { Navigate } from 'react-router-dom';
import { JSX } from "react";

export const PublicRoute = ({ children }: { children: JSX.Element }) => {
  const rawUser = localStorage.getItem('user');
  
  if (rawUser) {
    try {
      const parsed = JSON.parse(rawUser);
      const user = parsed?.data ?? parsed?.user ?? parsed;
      
      // Si ya está logueado, redirigir a su panel y no dejarlo ver el login/register/home
      return <Navigate to={user.type === 'DUEÑO' ? '/owner' : '/profile'} replace />;
    } catch (e) {
      localStorage.removeItem('user');
    }
  }
  
  return children;
};

