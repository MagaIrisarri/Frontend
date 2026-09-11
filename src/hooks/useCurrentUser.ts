import { useAuthStore, type CurrentUser } from '../stores/authStore';

export type { CurrentUser };

/**
 * Devuelve el usuario logueado en tiempo real desde el store reactivo de Zustand.
 */
export function useCurrentUser(): CurrentUser | null {
  return useAuthStore((state) => state.user);
}
