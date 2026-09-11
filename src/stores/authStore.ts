import { create } from 'zustand';

export interface CurrentUser {
  id?: string;
  _id?: string;
  type?: string;
  name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  [key: string]: any;
}

interface AuthState {
  user: CurrentUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  isClient: boolean;
  setUser: (user: CurrentUser | null, token?: string | null) => void;
  logout: () => void;
  refreshUser: () => void;
}

function readStoredUser(): CurrentUser | null {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.data ?? parsed?.user ?? parsed ?? null;
  } catch {
    return null;
  }
}

function readStoredToken(): string | null {
  return localStorage.getItem('token') || localStorage.getItem('parkflow_token');
}

export const useAuthStore = create<AuthState>((set, get) => {
  const initialUser = readStoredUser();
  const initialToken = readStoredToken();
  const userType = (initialUser?.type || '').toUpperCase();

  return {
    user: initialUser,
    token: initialToken,
    isAuthenticated: !!initialUser,
    isOwner: userType.includes('DUE') || userType.includes('OWNER'),
    isAdmin: userType.includes('ADMIN'),
    isClient: !!initialUser && !userType.includes('DUE') && !userType.includes('ADMIN'),

    setUser: (user, token) => {
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
        if (user.id || user._id) {
          localStorage.setItem('parkflow_user_id', (user.id || user._id)!);
        }
      } else {
        localStorage.removeItem('user');
        localStorage.removeItem('parkflow_user_id');
      }

      if (token !== undefined) {
        if (token) {
          localStorage.setItem('token', token);
        } else {
          localStorage.removeItem('token');
        }
      }

      const type = (user?.type || '').toUpperCase();
      set({
        user,
        token: token ?? get().token,
        isAuthenticated: !!user,
        isOwner: type.includes('DUE') || type.includes('OWNER'),
        isAdmin: type.includes('ADMIN'),
        isClient: !!user && !type.includes('DUE') && !type.includes('ADMIN'),
      });
    },

    logout: () => {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('parkflow_user_id');
      localStorage.removeItem('parkflow_token');
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isOwner: false,
        isAdmin: false,
        isClient: false,
      });
    },

    refreshUser: () => {
      const u = readStoredUser();
      const t = readStoredToken();
      const type = (u?.type || '').toUpperCase();
      set({
        user: u,
        token: t,
        isAuthenticated: !!u,
        isOwner: type.includes('DUE') || type.includes('OWNER'),
        isAdmin: type.includes('ADMIN'),
        isClient: !!u && !type.includes('DUE') && !type.includes('ADMIN'),
      });
    },
  };
});

