import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { syncScrollLock } from './Layer';

// En cada cambio de pantalla (también al iniciar o cerrar sesión) vuelve a calcular el bloqueo del scroll:
// sin paneles ni modales abiertos, la página siempre se puede desplazar. Va una sola vez, dentro del router.
export function ScrollLockGuard() {
  const { pathname } = useLocation();
  useEffect(() => { syncScrollLock(); }, [pathname]);
  return null;
}
