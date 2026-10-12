import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Calendar, Car, FileText, Trash2 } from 'lucide-react';
import { ConfirmModal, Drawer } from '../Owner/ui/Layer';
import { Presence } from '../Owner/ui/Presence';
import { Field, Input, Password, apiError } from '../Owner/ui/Field';
import { useToast } from '../Owner/ui/Toasts';
import { changePassword, removeUser, updateUser } from '../../services/user.service';
import { getParkingsByOwner } from '../../services/parking.service';
import { useAuthStore } from '../../stores/authStore';

const IVA = ['Responsable Inscripto', 'Monotributo', 'Exento'];
// shortcut: proposal, datos fiscales y preferencias de aviso se guardan en el navegador (el backend no los tiene) y las preferencias no filtran los avisos de /api/notifications, pasarlos al usuario en el servidor
const store = <T,>(key: string, fallback: T): T => { try { return { ...fallback, ...JSON.parse(localStorage.getItem(key) || '{}') }; } catch { return fallback; } };

// "Mi perfil" en panel lateral (owner-design/owner.html › openMe). Reemplaza a la página /profile; lo abre cualquier rol.
export default function ProfileDrawer({ onClose }: { onClose: () => void }) {
  const me = useAuthStore(s => s.user) ?? {};
  const setUser = useAuthStore(s => s.setUser);
  const logout = useAuthStore(s => s.logout);
  const navigate = useNavigate();
  const toast = useToast();
  const id: string = me.id || me._id || '';
  const type = String(me.type || me.role || '').toUpperCase();
  const isOwner = type.includes('DUE') || type.includes('OWNER');
  const isClient = !isOwner && !type.includes('ADMIN') && !type.includes('EMP');

  const [v, setV] = useState({ name: me.name ?? '', last_name: me.last_name ?? '', email: me.email ?? '', phone: me.phone ?? '', pw0: '', pw1: '', pw2: '' });
  const [fiscal, setFiscal] = useState(() => store(`parkflow_fiscal_${id}`, { businessName: '', cuit: '', vatCondition: IVA[0]!, fiscalAddress: '' }));
  const [prefs, setPrefs] = useState(() => store(`parkflow_prefs_${id}`, { alertFullCapacity: true, alertNewBooking: true }));
  const [err, setErr] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [active, setActive] = useState<number | null>(isOwner ? null : 0);

  useEffect(() => {
    if (!isOwner || !id) return;
    getParkingsByOwner(id).then(r => setActive((Array.isArray(r) ? r : r?.data ?? []).filter((p: any) => p.isActive).length)).catch(() => setActive(0));
  }, [isOwner, id]);

  const set = (k: keyof typeof v) => (e: { target: { value: string } }) => { setV({ ...v, [k]: e.target.value }); setErr({ ...err, [k]: '' }); };
  const go = (to: string) => { onClose(); navigate(to); };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (!v.name.trim()) er.name = 'Ingresá tu nombre.';
    if (!v.last_name.trim()) er.last_name = 'Ingresá tu apellido.';
    if (!/^\S+@\S+\.\S+$/.test(v.email.trim())) er.email = 'Ingresá un email válido.';
    if (isOwner && fiscal.cuit.trim() && !/^\d{2}-?\d{8}-?\d$/.test(fiscal.cuit.trim())) er.cuit = 'Formato esperado: 30-12345678-9.';
    if (v.pw0 || v.pw1 || v.pw2) {
      if (!v.pw0) er.pw0 = 'Ingresá tu contraseña actual.';
      if (v.pw1.length < 6) er.pw1 = 'Mínimo 6 caracteres.';
      else if (v.pw1 !== v.pw2) er.pw2 = 'Las contraseñas no coinciden.';
    }
    setErr(er);
    if (Object.keys(er).length) return toast('Revisá los campos marcados.', 'err');
    setBusy(true);
    try {
      const data = { name: v.name.trim(), last_name: v.last_name.trim(), email: v.email.trim(), phone: v.phone.trim() };
      await updateUser(id, data as any);
      if (v.pw1) await changePassword(id, v.pw0, v.pw1);
      if (isOwner) {
        localStorage.setItem(`parkflow_fiscal_${id}`, JSON.stringify(fiscal));
        localStorage.setItem(`parkflow_prefs_${id}`, JSON.stringify(prefs));
      }
      setUser({ ...me, ...data });
      toast(v.pw1 ? 'Perfil guardado y contraseña actualizada.' : 'Perfil guardado.');
      onClose();
    } catch (x) {
      toast(apiError(x), 'err');
    } finally {
      setBusy(false);
    }
  };

  const del = async () => {
    try {
      await removeUser(id);
      logout();
      navigate('/');
    } catch (x) {
      setConfirmDel(false);
      toast(apiError(x, 'No se pudo eliminar la cuenta.'), 'err');
    }
  };

  const links: [string, string, typeof Car][] = [['/reservations', 'Mis reservas', Calendar], ['/invoices', 'Facturación y pagos', FileText], ['/vehicles', 'Mis vehículos', Car]];

  return (
    <>
      <Drawer title="Mi perfil" sub={isOwner ? 'Datos de tu cuenta de dueño' : 'Datos de tu cuenta'} onClose={onClose}
        footer={<div className="dfoot"><button type="button" className="btn" onClick={onClose}>Cancelar</button><button className="btn pri" type="submit" form="meform" aria-busy={busy}>Guardar cambios</button></div>}>
        <form className="dbody" id="meform" noValidate onSubmit={save}>
          {isClient && (
            <section className="fs"><div className="fh"><h3>Mi cuenta</h3></div>
              <div className="list">{links.map(([to, label, I]) => (
                <button type="button" key={to} className="li" style={{ border: 0, background: 'none', color: 'inherit', textAlign: 'left', width: '100%', cursor: 'pointer' }} onClick={() => go(to)}>
                  <span className="l"><I className="i" />{label}</span><ArrowRight className="i sm" />
                </button>
              ))}</div>
            </section>
          )}
          <section className="fs"><div className="fh"><h3>Datos personales</h3></div>
            <div className="g2">
              <Input label="Nombre" value={v.name} onChange={set('name')} error={err.name} autoComplete="given-name" data-first />
              <Input label="Apellido" value={v.last_name} onChange={set('last_name')} error={err.last_name} autoComplete="family-name" />
            </div>
            <Input label="Email" type="email" value={v.email} onChange={set('email')} error={err.email} autoComplete="email" />
            <Input label="Teléfono" type="tel" value={v.phone} onChange={set('phone')} error={err.phone} autoComplete="tel" />
          </section>
          {isOwner && (
            <section className="fs"><div className="fh"><h3>Datos fiscales</h3></div>
              <Input label="Razón social" value={fiscal.businessName} onChange={e => setFiscal({ ...fiscal, businessName: e.target.value })} />
              <div className="g2">
                <Input label="CUIT / CUIL" placeholder="30-XXXXXXXX-X" inputMode="numeric" value={fiscal.cuit} onChange={e => { setFiscal({ ...fiscal, cuit: e.target.value }); setErr({ ...err, cuit: '' }); }} error={err.cuit} />
                <Field label="Condición IVA">{(fid) => (
                  <select className="sel" id={fid} value={fiscal.vatCondition} onChange={e => setFiscal({ ...fiscal, vatCondition: e.target.value })}>{IVA.map(o => <option key={o}>{o}</option>)}</select>
                )}</Field>
              </div>
              <Input label="Dirección fiscal" value={fiscal.fiscalAddress} onChange={e => setFiscal({ ...fiscal, fiscalAddress: e.target.value })} />
            </section>
          )}
          <section className="fs"><div className="fh"><h3>Seguridad</h3></div>
            <p className="ctx" style={{ marginTop: -6 }}>Completá solo si querés cambiar la contraseña.</p>
            <Password label="Contraseña actual" value={v.pw0} onChange={set('pw0')} error={err.pw0} autoComplete="current-password" />
            <div className="g2">
              <Password label="Nueva contraseña" value={v.pw1} onChange={set('pw1')} error={err.pw1} autoComplete="new-password" />
              <Password label="Repetir nueva" value={v.pw2} onChange={set('pw2')} error={err.pw2} autoComplete="new-password" />
            </div>
          </section>
          {isOwner && (
            <section className="fs"><div className="fh"><h3>Notificaciones</h3></div>
              <label className="switch"><input type="checkbox" checked={prefs.alertFullCapacity} onChange={e => setPrefs({ ...prefs, alertFullCapacity: e.target.checked })} /><span className="t" />Avisarme cuando una sucursal llegue al 90 % de ocupación</label>
              <label className="switch"><input type="checkbox" checked={prefs.alertNewBooking} onChange={e => setPrefs({ ...prefs, alertNewBooking: e.target.checked })} /><span className="t" />Avisarme de cada nueva reserva</label>
            </section>
          )}
          <section className="fs"><div className="fh"><h3>Eliminar cuenta</h3></div>
            <p className="ctx">{active ? `Tenés ${active} ${active === 1 ? 'sucursal activa' : 'sucursales activas'}. Pausalas antes de eliminar la cuenta.` : 'Se borran tu cuenta y todos tus datos. No se puede deshacer.'}</p>
            <div><button type="button" className="btn danger" disabled={active === null || !!active} onClick={() => setConfirmDel(true)}><Trash2 className="i sm" />Eliminar mi cuenta</button></div>
          </section>
        </form>
      </Drawer>
      <Presence open={confirmDel}><ConfirmModal title="¿Eliminar tu cuenta?" body="Se borran tu cuenta y todos tus datos. No se puede deshacer." ok="Eliminar cuenta" danger onConfirm={del} onClose={() => setConfirmDel(false)} /></Presence>
    </>
  );
}
