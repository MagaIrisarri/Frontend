import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Building2, MoreVertical, Plus, RotateCcw, Search, Trash2, Users } from 'lucide-react';
import { Drawer, ConfirmModal } from '../../components/Owner/ui/Layer';
import { Presence, Shown } from '../../components/Owner/ui/Presence';
import { Empty, ErrorBox, PageHead, SkeletonRows } from '../../components/Owner/ui/Page';
import { Input, Password, apiError } from '../../components/Owner/ui/Field';
import { Menu } from '../../components/Owner/ui/Menu';
import { useToast } from '../../components/Owner/ui/Toasts';
import { createOwner, getUsers, reactivateUser, removeUser } from '../../services/user.service';
import { useAuthStore } from '../../stores/authStore';
import { getParkingMetrics, getParkingsByOwner } from '../../services/parking.service';
import { initials, money, plural } from '../Owner/owner.lib';

type Role = 'CLIENTE' | 'DUEÑO' | 'EMPLEADO' | 'ADMINISTRADOR';
interface U { id: string; dni: string; name: string; last_name: string; email: string; phone?: string; type: Role; status: 'ACTIVO' | 'BAJA' }

const ROLE: Record<Role, { l: string; pl: string }> = {
  CLIENTE: { l: 'Cliente', pl: 'Clientes' }, DUEÑO: { l: 'Dueño', pl: 'Dueños' },
  EMPLEADO: { l: 'Empleado', pl: 'Empleados' }, ADMINISTRADOR: { l: 'Administrador', pl: 'Administradores' },
};
const fullName = (u: U) => `${u.name} ${u.last_name}`;

// Usuarios del sistema: listado con filtros, baja y reactivación (R-20) y alta de dueños.
export default function AdminUsers() {
  const toast = useToast();
  const me = useAuthStore(s => s.user);
  const [users, setUsers] = useState<U[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [q, setQ] = useState('');
  const [fr, setFr] = useState<'all' | Role>('all');
  const [fs, setFs] = useState<'ACTIVO' | 'BAJA' | 'all'>('ACTIVO');
  const [del, setDel] = useState<U | null>(null);
  const [form, setForm] = useState(false);
  const [owner, setOwner] = useState<U | null>(null);

  const load = useCallback(async () => {
    try { setUsers(await getUsers()); setStatus('ready'); } catch { setStatus('error'); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const deactivate = async () => {
    const u = del!;
    setDel(null);
    try {
      await removeUser(u.id);
      await load();
      toast(`${fullName(u)} dado de baja. Ya no puede iniciar sesión.`, 'info');
    } catch (x) { toast(apiError(x, 'No se pudo dar de baja. Intentá de nuevo.'), 'err'); }
  };
  const reactivate = async (u: U) => {
    try {
      await reactivateUser(u.id);
      await load();
      toast(`${fullName(u)} reactivado.`);
    } catch (x) { toast(apiError(x, 'No se pudo reactivar. Intentá de nuevo.'), 'err'); }
  };

  const term = q.trim().toLowerCase();
  const byStatus = users.filter(u => fs === 'all' || u.status === fs);
  const shown = byStatus
    .filter(u => (fr === 'all' || u.type === fr) && (!term || `${fullName(u)} ${u.email} ${u.dni}`.toLowerCase().includes(term)))
    .sort((a, b) => fullName(a).localeCompare(fullName(b), 'es'));

  let body;
  if (status === 'error') body = <ErrorBox what="los usuarios" onRetry={load} />;
  else if (status === 'loading') body = <SkeletonRows n={6} cols={4} />;
  else if (!shown.length) body = (
    <Empty icon={<Search className="i" />} title="Sin resultados"
      action={<button type="button" className="btn" onClick={() => { setQ(''); setFr('all'); setFs('ACTIVO'); }}>Limpiar filtros</button>}>
      Ningún usuario coincide con los filtros actuales.
    </Empty>);
  else body = (
    <div className="panel tw"><table className="tbl">
      <colgroup><col /><col style={{ width: 120 }} /><col style={{ width: 150 }} /><col style={{ width: 120 }} /><col style={{ width: 64 }} /></colgroup>
      <thead><tr><th>Usuario</th><th>DNI</th><th>Rol</th><th>Estado</th><th><span className="sr">Acciones</span></th></tr></thead>
      <tbody>{shown.map(u => {
        const self = u.id === (me?.id || me?._id);
        return (
          <tr key={u.id}>
            <td><div className="li" style={{ padding: 0 }}><span className="l"><span className="av">{initials(u.name, u.last_name)}</span>
              <span><div className="nm">{u.type === 'DUEÑO'
                ? <button type="button" className="nm" aria-label={`Ver cocheras de ${fullName(u)}`} onClick={() => setOwner(u)}>{fullName(u)}</button>
                : fullName(u)}{self && <span className="ad"> (vos)</span>}</div><div className="ad">{u.email}</div></span></span></div></td>
            <td data-label="DNI">{u.dni}</td>
            <td data-label="Rol">{ROLE[u.type]?.l ?? u.type}</td>
            <td data-label="Estado"><span className={`st ${u.status === 'ACTIVO' ? 'ok' : 'mute'}`}>{u.status === 'ACTIVO' ? 'Activo' : 'De baja'}</span></td>
            <td className="r"><div className="acts">{self ? null : (
              <Menu label={`Más acciones de ${fullName(u)}`} button={<MoreVertical className="i" />} items={[
                ...(u.type === 'DUEÑO' ? [{ label: 'Ver cocheras', icon: <Building2 className="i" />, onClick: () => setOwner(u) }] : []),
                u.status === 'ACTIVO'
                  ? { label: 'Dar de baja', icon: <Trash2 className="i" />, danger: true, sep: u.type === 'DUEÑO', onClick: () => setDel(u) }
                  : { label: 'Reactivar', icon: <RotateCcw className="i" />, sep: u.type === 'DUEÑO', onClick: () => reactivate(u) },
              ]} />
            )}</div></td>
          </tr>
        );
      })}</tbody>
    </table></div>
  );

  return (
    <>
      <PageHead title="Usuarios" sub={status === 'ready' ? `${plural(users.filter(u => u.status === 'ACTIVO').length, 'usuario activo', 'usuarios activos')} en el sistema.` : 'Todos los usuarios del sistema.'}
        actions={<button type="button" className="btn pri" onClick={() => setForm(true)}><Plus className="i sm" />Nuevo dueño</button>} />
      {status === 'ready' && <>
        <div className="toolbar">
          <div className="search"><Search className="i" /><input className="inp" type="search" placeholder="Buscar por nombre, email o DNI" aria-label="Buscar por nombre, email o DNI" value={q} onChange={e => setQ(e.target.value)} /></div>
        </div>
        <div className="seg" role="group" aria-label="Filtrar por rol" style={{ justifySelf: 'start' }}>
          {([['all', 'Todos'], ...(Object.keys(ROLE) as Role[]).map(r => [r, ROLE[r].pl])] as ['all' | Role, string][]).map(([k, l]) => (
            <button type="button" key={k} aria-pressed={fr === k} onClick={() => setFr(k)}>{l}<b>{byStatus.filter(u => k === 'all' || u.type === k).length}</b></button>
          ))}
        </div>
        <div className="seg" role="group" aria-label="Filtrar por estado" style={{ justifySelf: 'start' }}>
          {([['ACTIVO', 'Activos'], ['BAJA', 'De baja'], ['all', 'Todos']] as const).map(([k, l]) => (
            <button type="button" key={k} aria-pressed={fs === k} onClick={() => setFs(k)}>{l}<b>{users.filter(u => k === 'all' || u.status === k).length}</b></button>
          ))}
        </div>
      </>}
      {status === 'ready' && !users.length ? <Empty icon={<Users className="i" />} title="Todavía no hay usuarios" /> : body}
      <Shown when={del}>{del => <ConfirmModal title={`¿Dar de baja a ${fullName(del)}?`}
        body={`No va a poder iniciar sesión hasta que lo reactives. ${del.type === 'CLIENTE' ? 'Si tiene reservas activas, no se puede.' : del.type === 'DUEÑO' ? 'Si tiene sucursales activas, primero tiene que pausarlas.' : ''}`}
        ok="Dar de baja" back="Volver" danger onConfirm={deactivate} onClose={() => setDel(null)} />}</Shown>
      <Shown when={owner}>{owner => <OwnerParkingsDrawer owner={owner} onClose={() => setOwner(null)} />}</Shown>
      <Presence open={!!form}><OwnerDrawer onClose={() => setForm(false)} onSaved={async name => { setForm(false); await load(); toast(`${name} dado de alta como dueño. Ya puede iniciar sesión y registrar sus sucursales.`); }} /></Presence>
    </>
  );
}

interface OwnerParking {
  id: string; name: string; address: string; locality: string; isActive: boolean; openingTime: string; closingTime: string;
  carCapacity?: number; motorcycleCapacity?: number; truckCapacity?: number;
  availableCarSpaces?: number; availableMotorcycleSpaces?: number; availableTruckSpaces?: number;
  maintenanceCarSpaces?: number; maintenanceMotorcycleSpaces?: number; maintenanceTruckSpaces?: number;
}
interface Metrics { reservations: Record<string, number>; totalRevenue: number }

// Cocheras de un dueño: datos de cada una, ocupación en vivo y reservas finalizadas (de las métricas de la sucursal).
function OwnerParkingsDrawer({ owner, onClose }: { owner: U; onClose: () => void }) {
  const [rows, setRows] = useState<{ p: OwnerParking; m: Metrics | null }[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    getParkingsByOwner(owner.id)
      .then(async x => {
        const parkings: OwnerParking[] = Array.isArray(x) ? x : x?.data ?? [];
        const metrics = await Promise.all(parkings.map(p => getParkingMetrics(p.id).catch(() => null)));
        setRows(parkings.map((p, i) => ({ p, m: metrics[i] })));
      })
      .catch(() => setFailed(true));
  }, [owner.id]);

  const finished = (rows ?? []).reduce((a, r) => a + (r.m?.reservations?.FINALIZADA ?? 0), 0);
  return (
    <Drawer title={fullName(owner)} sub={`Dueño · ${owner.email}`} onClose={onClose} wide
      footer={<div className="dfoot"><button type="button" className="btn" onClick={onClose}>Cerrar</button></div>}>
      <div className="dbody">
        {failed ? <p className="ctx">No pudimos cargar las cocheras. Cerrá el panel e intentá de nuevo.</p>
          : rows === null ? <span className="sk" style={{ height: 120 }} />
            : !rows.length ? <div className="empty" style={{ padding: '36px 0' }}><div className="ico"><Building2 className="i" /></div><h3>Sin cocheras</h3><p>Este dueño todavía no registró sucursales.</p></div>
              : <>
                <div className="fs"><div className="fh"><h3>Resumen</h3></div>
                  <dl className="dl" style={{ margin: 0 }}>
                    <dt>Cocheras</dt><dd>{rows.length} ({rows.filter(r => r.p.isActive).length} activas)</dd>
                    <dt>Reservas finalizadas</dt><dd><b>{finished}</b></dd>
                  </dl>
                </div>
                {rows.map(({ p, m }) => {
                  const cap = (p.carCapacity ?? 0) + (p.motorcycleCapacity ?? 0) + (p.truckCapacity ?? 0);
                  const maint = (p.maintenanceCarSpaces ?? 0) + (p.maintenanceMotorcycleSpaces ?? 0) + (p.maintenanceTruckSpaces ?? 0);
                  const free = (p.availableCarSpaces ?? 0) + (p.availableMotorcycleSpaces ?? 0) + (p.availableTruckSpaces ?? 0);
                  return (
                    <div className="fs" key={p.id}>
                      <div className="fh"><h3>{p.name}</h3><span className={`st ${p.isActive ? 'ok' : 'mute'}`}>{p.isActive ? 'Activa' : 'Pausada'}</span></div>
                      <dl className="dl" style={{ margin: 0 }}>
                        <dt>Dirección</dt><dd>{p.address}, {p.locality}</dd>
                        <dt>Horario</dt><dd>{p.openingTime?.slice(0, 5)} a {p.closingTime?.slice(0, 5)}</dd>
                        <dt>Plazas</dt><dd>{cap} ({p.carCapacity ?? 0} autos · {p.motorcycleCapacity ?? 0} motos · {p.truckCapacity ?? 0} camionetas){maint ? ` · ${maint} en mantenimiento` : ''}</dd>
                        <dt>Ahora</dt><dd>{Math.max(0, cap - maint - free)} ocupadas · {free} libres</dd>
                        <dt>Reservas finalizadas</dt><dd><b>{m ? m.reservations?.FINALIZADA ?? 0 : '—'}</b></dd>
                        <dt>En curso / pendientes</dt><dd>{m ? `${m.reservations?.['EN CURSO'] ?? 0} / ${(m.reservations?.PENDIENTE ?? 0) + (m.reservations?.CONFIRMADA ?? 0)}` : '—'}</dd>
                        <dt>Facturado</dt><dd>{m ? money(m.totalRevenue ?? 0) : '—'}</dd>
                      </dl>
                    </div>
                  );
                })}
              </>}
      </div>
    </Drawer>
  );
}

function OwnerDrawer({ onClose, onSaved }: { onClose: () => void; onSaved: (name: string) => void }) {
  const [v, setV] = useState({ dni: '', name: '', last_name: '', date_of_birth: '', phone: '', email: '', password: '' });
  const [err, setErr] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof v) => (e: { target: { value: string } }) => { setV({ ...v, [k]: e.target.value }); setErr({ ...err, [k]: '', general: '' }); };

  // Anticipa las reglas del backend (User.Schema.ts).
  const save = async (e: FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (!/^\d{7,8}$/.test(v.dni.trim())) er.dni = 'El DNI debe tener 7 u 8 dígitos.';
    if (v.name.trim().length < 2) er.name = 'Requerido.';
    if (v.last_name.trim().length < 2) er.last_name = 'Requerido.';
    if (!v.date_of_birth) er.date_of_birth = 'Requerido.';
    if (!/^\d{6,15}$/.test(v.phone.replace(/\s/g, ''))) er.phone = 'Solo dígitos, entre 6 y 15.';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.email.trim())) er.email = 'Ingresá un email válido.';
    if (v.password.trim().length < 6) er.password = 'Mínimo 6 caracteres.';
    setErr(er);
    if (Object.keys(er).length) return;
    setBusy(true);
    try {
      await createOwner({ dni: v.dni.trim(), name: v.name.trim(), last_name: v.last_name.trim(), date_of_birth: v.date_of_birth, phone: v.phone.replace(/\s/g, ''), email: v.email.trim(), password: v.password });
      onSaved(`${v.name.trim()} ${v.last_name.trim()}`);
    } catch (x) { setErr({ general: apiError(x) }); setBusy(false); }
  };

  return (
    <Drawer title="Nuevo dueño" sub="Alta de un dueño de cocheras." onClose={onClose}
      footer={<div className="dfoot"><button type="button" className="btn" onClick={onClose}>Cancelar</button><button className="btn pri" type="submit" form="oform" aria-busy={busy} disabled={busy}>Crear dueño</button></div>}>
      <form id="oform" noValidate className="dbody" onSubmit={save}>
        <section className="fs"><div className="fh"><h3>Datos personales</h3></div>
          <Input label="DNI" placeholder="Sin puntos" inputMode="numeric" maxLength={8} autoComplete="off" value={v.dni} onChange={set('dni')} error={err.dni} data-first />
          <div className="g2"><Input label="Nombre" value={v.name} onChange={set('name')} error={err.name} /><Input label="Apellido" value={v.last_name} onChange={set('last_name')} error={err.last_name} /></div>
          <div className="g2"><Input label="Fecha de nacimiento" type="date" value={v.date_of_birth} onChange={set('date_of_birth')} error={err.date_of_birth} hint="Tiene que ser mayor de 18 años." />
            <Input label="Teléfono" type="tel" placeholder="3415550000" value={v.phone} onChange={set('phone')} error={err.phone} /></div>
        </section>
        <section className="fs"><div className="fh"><h3>Acceso</h3></div>
          <Input label="Email" type="email" placeholder="nombre@empresa.com" autoComplete="off" value={v.email} onChange={set('email')} error={err.email} />
          <Password label="Contraseña temporal" autoComplete="new-password" value={v.password} onChange={set('password')} error={err.password} hint="Pasásela al dueño; la puede cambiar desde Mi perfil." />
          {err.general && <div className="ferr" role="alert">{err.general}</div>}
        </section>
      </form>
    </Drawer>
  );
}
