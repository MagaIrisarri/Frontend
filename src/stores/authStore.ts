import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface CurrentUser {
  id?: string;
  _id?: string;
  type?: string;
  role?: string;
  name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  dni?: string;
  mustChangePassword?: boolean; // contraseña temporal: el DNI (cuenta del mostrador, R-29) o la que puso el administrador (DA-02)
  date_of_birth?: string;
  // Dueño: datos fiscales; cualquiera: avisos que apagó (MUTABLE_NOTIFICATIONS del backend).
  businessName?: string | null;
  cuit?: string | null;
  vatCondition?: string | null;
  fiscalAddress?: string | null;
  mutedNotifications?: string[] | null;
  [key: string]: any;
}

export type NormalizedRole = 'DUEÑO' | 'ADMINISTRADOR' | 'EMPLEADO' | 'CLIENTE' | '';

export function normalizeRole(roleOrType?: string): NormalizedRole {
  if (!roleOrType) return '';
  const r = roleOrType.toUpperCase().trim();
  if (r.includes('DUE') || r.includes('OWNER')) return 'DUEÑO';
  if (r.includes('ADMIN')) return 'ADMINISTRADOR';
  if (r.includes('EMP')) return 'EMPLEADO';
  if (r.includes('CLI') || r.includes('USER') || r.includes('CLIENT')) return 'CLIENTE';
  return '';
}

// Pantalla de inicio de cada rol: el cliente usa el mapa; el resto, solo su panel.
export function homeForRole(role: NormalizedRole): string {
  if (role === 'DUEÑO') return '/owner';
  if (role === 'EMPLEADO') return '/employee';
  if (role === 'ADMINISTRADOR') return '/admin';
  return '/';
}

export interface AuthState {
  user: CurrentUser | null;
  isAuthenticated: boolean;
  isOwner: boolean;
  isClient: boolean;
  setUser: (user: CurrentUser | null, token?: string) => void; // el token llega solo con el login
  logout: () => void;
}

function getInitialUser(): CurrentUser | null {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.data ?? parsed?.user ?? parsed ?? null;
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: getInitialUser(),
      isAuthenticated: !!getInitialUser(),
      isOwner: normalizeRole(getInitialUser()?.type || getInitialUser()?.role) === 'DUEÑO',
      isClient:
        !!getInitialUser() &&
        normalizeRole(getInitialUser()?.type || getInitialUser()?.role) !== 'DUEÑO' &&
        normalizeRole(getInitialUser()?.type || getInitialUser()?.role) !== 'ADMINISTRADOR' &&
        normalizeRole(getInitialUser()?.type || getInitialUser()?.role) !== 'EMPLEADO',

      setUser: (user: CurrentUser | null, token?: string) => {
        if (!user) {
          localStorage.removeItem('user');
          localStorage.removeItem('user_id');
          localStorage.removeItem('token');
          set({
            user: null,
            isAuthenticated: false,
            isOwner: false,
            isClient: false,
          });
          return;
        }

        const rawType = user.type || user.role || 'CLIENTE';
        const normalized = normalizeRole(rawType);
        const enrichedUser: CurrentUser = {
          ...user,
          type: normalized || rawType,
        };

        localStorage.setItem('user', JSON.stringify(enrichedUser));
        if (token) localStorage.setItem('token', token); // lo lee services/api.ts
        const userId = enrichedUser.id || enrichedUser._id;
        if (userId) localStorage.setItem('user_id', userId);

        set({
          user: enrichedUser,
          isAuthenticated: true,
          isOwner: normalized === 'DUEÑO',
          isClient: normalized === 'CLIENTE' || !normalized,
        });
      },

      logout: () => {
        localStorage.removeItem('user');
        localStorage.removeItem('user_id');
        localStorage.removeItem('token');
        set({
          user: null,
          isAuthenticated: false,
          isOwner: false,
          isClient: false,
        });
      },
    }),
    {
      name: 'auth_session',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state && state.user) {
          const normalized = normalizeRole(state.user.type || state.user.role);
          state.isAuthenticated = true;
          state.isOwner = normalized === 'DUEÑO';
          state.isClient = normalized === 'CLIENTE' || !normalized;
        }
      },
    }
  )
);

