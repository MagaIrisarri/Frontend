import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import OwnerShell from '../components/Owner/ui/OwnerShell';
import ProfileDrawer from '../components/Profile/ProfileDrawer';

const Ctx = createContext<() => void>(() => {});
// Abre "Mi perfil" (panel lateral) desde cualquier pantalla: Home, panel del dueño, etc.
export const useOpenProfile = () => useContext(Ctx);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const show = useCallback(() => setOpen(true), []);
  return (
    <Ctx.Provider value={show}>
      {children}
      {open && <OwnerShell bare><ProfileDrawer onClose={() => setOpen(false)} /></OwnerShell>}
    </Ctx.Provider>
  );
}
