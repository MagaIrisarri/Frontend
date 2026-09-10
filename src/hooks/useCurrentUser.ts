import { useState } from 'react';

export interface CurrentUser {
  id?: string;
  _id?: string;
  type?: string;
  name?: string;
  last_name?: string;
  [key: string]: any;
}

function readCurrentUser(): CurrentUser | null {
  const raw = localStorage.getItem('user');
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    return parsed?.data ?? parsed?.user ?? parsed ?? null;
  } catch {
    return null;
  }
}

/**
 * Devuelve el usuario logueado (leído de localStorage una sola vez, al montar).
 * No redirige ni valida rol: eso ya lo resuelve ProtectedRoute a nivel de ruta.
 */
export function useCurrentUser(): CurrentUser | null {
  const [user] = useState<CurrentUser | null>(readCurrentUser);
  return user;
}
