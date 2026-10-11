import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import OwnerShell from '../components/Owner/ui/OwnerShell';
import ProfileDrawer from '../components/Profile/ProfileDrawer';
import { Presence } from '../components/Owner/ui/Presence';

const Ctx = createContext<() => void>(() => {});
// Abre "Mi perfil" (panel lateral) desde cualquier pantalla: Home, panel del dueño, etc.
export const useOpenProfile = () => useContext(Ctx);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const show = useCallback(() => setOpen(true), []);
  return (
    <Ctx.Provider value={show}>
      {children}
      <Presence open={open}><OwnerShell bare><ProfileDrawer onClose={() => setOpen(false)} /></OwnerShell></Presence>
    </Ctx.Provider>
  );
}
