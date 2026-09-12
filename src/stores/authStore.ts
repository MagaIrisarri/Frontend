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
  date_of_birth?: string;
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

export interface AuthState {
  user: CurrentUser | null;
  isAuthenticated: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  isClient: boolean;
  setUser: (user: CurrentUser | null) => void;
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
      isAdmin: normalizeRole(getInitialUser()?.type || getInitialUser()?.role) === 'ADMINISTRADOR',
      isClient:
        !!getInitialUser() &&
        normalizeRole(getInitialUser()?.type || getInitialUser()?.role) !== 'DUEÑO' &&
        normalizeRole(getInitialUser()?.type || getInitialUser()?.role) !== 'ADMINISTRADOR',

      setUser: (user: CurrentUser | null) => {
        if (!user) {
          localStorage.removeItem('user');
          localStorage.removeItem('parkflow_user_id');
          localStorage.removeItem('user_id');
          localStorage.removeItem('token');
          localStorage.removeItem('parkflow_token');
          set({
            user: null,
            isAuthenticated: false,
            isOwner: false,
            isAdmin: false,
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
        const userId = enrichedUser.id || enrichedUser._id;
        if (userId) {
          localStorage.setItem('parkflow_user_id', userId);
          localStorage.setItem('user_id', userId);
        }

        set({
          user: enrichedUser,
          isAuthenticated: true,
          isOwner: normalized === 'DUEÑO',
          isAdmin: normalized === 'ADMINISTRADOR',
          isClient: normalized === 'CLIENTE' || !normalized,
        });
      },

      logout: () => {
        localStorage.removeItem('user');
        localStorage.removeItem('parkflow_user_id');
        localStorage.removeItem('user_id');
        localStorage.removeItem('token');
        localStorage.removeItem('parkflow_token');
        set({
          user: null,
          isAuthenticated: false,
          isOwner: false,
          isAdmin: false,
          isClient: false,
        });
      },
    }),
    {
      name: 'parkflow_auth_session',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state && state.user) {
          const normalized = normalizeRole(state.user.type || state.user.role);
          state.isAuthenticated = true;
          state.isOwner = normalized === 'DUEÑO';
          state.isAdmin = normalized === 'ADMINISTRADOR';
          state.isClient = normalized === 'CLIENTE' || !normalized;
        }
      },
    }
  )
);

