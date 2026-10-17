import { createElement, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronRight, KeyRound, Pencil, Plus, RotateCcw, Trash2, Users } from 'lucide-react';
import { Drawer, ConfirmModal } from '../../components/Owner/ui/Layer';
import { Shown } from '../../components/Owner/ui/Presence';
import { Empty, ErrorBox, PageHead, SkeletonRows } from '../../components/Owner/ui/Page';
import { FilterBar } from '../../components/Owner/ui/FilterBar';
import { Pager } from '../../components/Owner/ui/Pager';
import { Field, Input, Password, apiError } from '../../components/Owner/ui/Field';
import { useToast } from '../../components/Owner/ui/Toasts';
import { createEmployee, createUser, getUser, getUsersPage, reactivateUser, removeUser, resetUserPassword, updateEmployee, updateUser, type UserData } from '../../services/user.service';
import { getEmployeesByOwner } from '../../services/employee.service';
import { getParkingsByOwner } from '../../services/parking.service';
import { getUserVehicle } from '../../services/vehicle.service';
import { getReservationsByClient } from '../../services/reservation.service';
import { useAuthStore } from '../../stores/authStore';
import { usePagedList } from '../../hooks/usePagedList';
import { useAsync, useDebounced } from '../../hooks/useAsync';
import { revealOnMobile } from '../../utils/layout';
import { iconOf } from '../../components/Owner/ui/vehicles';
import { RS, initials, normRes, pct, plural, typeLabel } from '../Owner/owner.lib';

type Role = 'CLIENTE' | 'DUEÑO' | 'EMPLEADO' | 'ADMINISTRADOR';
interface U { id: string; dni: string; name: string; last_name: string; email: string; phone?: string; date_of_birth?: string; type: Role; status: 'ACTIVO' | 'BAJA'; ownerId?: string; parkingId?: string; parkingName?: string | null }
interface Meta { page: number; limit: number; total: number; counts: { role: Record<Role, number>; status: Record<'ACTIVO' | 'BAJA', number> } }

const ROLE: Record<Role, { l: string; pl: string }> = {
  CLIENTE: { l: 'Cliente', pl: 'Clientes' }, DUEÑO: { l: 'Dueño', pl: 'Dueños' },
  EMPLEADO: { l: 'Empleado', pl: 'Empleados' }, ADMINISTRADOR: { l: 'Administrador', pl: 'Administradores' },
};
const fullName = (u: { name: string; last_name: string }) => `${u.name} ${u.last_name}`;
const asList = <T,>(x: any): T[] => (Array.isArray(x) ? x : x?.data ?? []);
const ageOf = (iso: string) => {
  const b = new Date(iso.slice(0, 10) + 'T12:00'), t = new Date();
  let a = t.getFullYear() - b.getFullYear();
  if (t.getMonth() < b.getMonth() || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) a--;
  return a;
};
const birth = (iso?: string) => iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)} · ${ageOf(iso)} años` : '—';

// Usuarios del sistema: lista paginada a la izquierda y el detalle del elegido a la derecha, con lo que importa de cada rol.
// Baja y reactivación (R-20), alta y edición de clientes, dueños y empleados. La búsqueda, los filtros y las páginas los resuelve el servidor.
export default function AdminUsers() {
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const me = useAuthStore(s => s.user);
  const myId = String(me?.id || me?._id || '');
  const [q, setQ] = useState('');
  const [fr, setFr] = useState<'all' | Role>('all');
  const [fs, setFs] = useState<'ACTIVO' | 'BAJA' | 'all'>('ACTIVO');
  const [sel, setSel] = useState<U | null>(null);
  const [del, setDel] = useState<U | null>(null);
  const [reset, setReset] = useState<U | null>(null);
  const [pw, setPw] = useState('');
  const [pwErr, setPwErr] = useState('');
  const [form, setForm] = useState<U | 'new' | null>(null);
  const detail = useRef<HTMLElement>(null);

  const list = usePagedList<U, Meta>(getUsersPage, { q: useDebounced(q.trim()) || undefined, role: fr === 'all' ? undefined : fr, status: fs === 'all' ? undefined : fs });

  // Enlace desde una cochera (?u=<id>): abre ese usuario aunque no esté en la página actual.
  const wanted = params.get('u');
  useEffect(() => { if (wanted) getUser(wanted).then(setSel).catch(() => {}); }, [wanted]);

  const pick = (u: U) => { setSel(u); revealOnMobile(detail.current); };
  const refresh = async (id: string) => { list.reload(); try { setSel(await getUser(id)); } catch { /* la lista ya se recarga */ } };

  const deactivate = async () => {
    const u = del!;
    setDel(null);
    try { await removeUser(u.id); await refresh(u.id); toast(`${fullName(u)} dado de baja. Ya no puede iniciar sesión.`, 'info'); }
    catch (x) { toast(apiError(x, 'No se pudo dar de baja. Intentá de nuevo.'), 'err'); }
  };
  // DA-02 / LA-03: contraseña temporal; al iniciar sesión el usuario tiene que cambiarla.
  const resetPassword = async () => {
    if (pw.trim().length < 6) { setPwErr('Mínimo 6 caracteres.'); return; }
    const u = reset!;
    try { await resetUserPassword(u.id, pw.trim()); setReset(null); toast(`Contraseña de ${fullName(u)} restablecida. Pasásela: la cambia al entrar.`); }
    catch (x) { setPwErr(apiError(x, 'No se pudo restablecer. Intentá de nuevo.')); }
  };
  const reactivate = async (u: U) => {
    try { await reactivateUser(u.id); await refresh(u.id); toast(`${fullName(u)} reactivado.`); }
    catch (x) { toast(apiError(x, 'No se pudo reactivar. Intentá de nuevo.'), 'err'); }
  };

  const filtered = !!(q || fr !== 'all' || fs !== 'ACTIVO');
  const counts = list.meta?.counts;
  const sum = (o?: Record<string, number>) => Object.values(o ?? {}).reduce((a, n) => a + n, 0);

  let side;
  if (list.status === 'error') side = <ErrorBox what="los usuarios" onRetry={list.reload} />;
  else if (list.status === 'loading') side = <SkeletonRows n={6} cols={1} />;
  else side = (
    <>
      <div className="bl" aria-busy={list.busy} style={{ opacity: list.busy ? 0.6 : 1 }}>
        {list.items.length ? list.items.map(u => (
          <button type="button" key={u.id} className="bi" aria-current={sel?.id === u.id} onClick={() => pick(u)}>
            <span className="who"><span className="av">{initials(u.name, u.last_name)}</span>
              <span className="t"><span className="nm t">{fullName(u)}{u.id === myId && <span className="ad"> (vos)</span>}</span><span className="ad t">{ROLE[u.type].l}{u.parkingName ? ` · ${u.parkingName}` : ''} · {u.email}</span></span></span>
            {u.status === 'BAJA' && <span className="st mute">De baja</span>}
          </button>
        )) : <p className="ad" style={{ padding: '8px 12px' }}>Ningún usuario coincide con los filtros.</p>}
      </div>
      <Pager page={list.page} limit={list.limit} total={list.meta?.total ?? 0} busy={list.busy} onPage={list.setPage} />
    </>
  );

  return (
    <>
      <PageHead title="Usuarios" sub="Todos los usuarios del sistema."
        actions={<button type="button" className="btn pri" onClick={() => setForm('new')}><Plus className="i sm" />Nuevo usuario</button>} />
      {list.status !== 'error' && (
        <FilterBar search={{ value: q, onChange: setQ, label: 'Buscar usuario', placeholder: 'Buscar por nombre, email o DNI' }} active={filtered}
          onClear={() => { setQ(''); setFr('all'); setFs('ACTIVO'); }}>
          <div className="seg" role="group" aria-label="Filtrar por rol">
            {([['all', 'Todos', sum(counts?.role)], ...(Object.keys(ROLE) as Role[]).map(r => [r, ROLE[r].pl, counts?.role[r] ?? 0])] as ['all' | Role, string, number][]).map(([k, l, n]) => (
              <button type="button" key={k} aria-pressed={fr === k} onClick={() => setFr(k)}>{l}<b>{n}</b></button>
            ))}
          </div>
          <div className="seg" role="group" aria-label="Filtrar por estado">
            {([['ACTIVO', 'Activos', counts?.status.ACTIVO ?? 0], ['BAJA', 'De baja', counts?.status.BAJA ?? 0], ['all', 'Todos', sum(counts?.status)]] as const).map(([k, l, n]) => (
              <button type="button" key={k} aria-pressed={fs === k} onClick={() => setFs(k)}>{l}<b>{n}</b></button>
            ))}
          </div>
        </FilterBar>
      )}
      <div className="split">
        <section className="panel side" aria-label="Usuarios">{side}</section>
        <section className="panel main" aria-label="Detalle del usuario" aria-live="polite" ref={detail}>
          {sel ? <UserDetail key={sel.id} u={sel} self={sel.id === myId} onEdit={() => setForm(sel)} onDeactivate={() => setDel(sel)} onReactivate={() => reactivate(sel)} onResetPassword={() => { setPw(''); setPwErr(''); setReset(sel); }}
            onUser={id => navigate(`/admin/users?u=${id}`)} onParking={id => navigate(`/admin/parkings?p=${id}`)} />
            : <Empty icon={<Users className="i" />} title="Elegí un usuario">Mirá sus datos y lo que hace en el sistema: vehículos y reservas, cocheras o sucursal.</Empty>}
        </section>
      </div>
      <Shown when={del}>{del => <ConfirmModal title={`¿Dar de baja a ${fullName(del)}?`}
        body={`No va a poder iniciar sesión hasta que lo reactives. ${del.type === 'CLIENTE' ? 'Si tiene reservas activas, no se puede.' : del.type === 'DUEÑO' ? 'Si tiene sucursales activas, primero tiene que pausarlas, y las reservas en curso tienen que terminar.' : del.type === 'EMPLEADO' ? 'Si tiene turnos o reservas asignadas, primero hay que sacarlo de los turnos y reasignarlas.' : ''}`}
        ok="Dar de baja" back="Volver" danger onConfirm={deactivate} onClose={() => setDel(null)} />}</Shown>
      <Shown when={reset}>{u => <ConfirmModal title={`Restablecer la contraseña de ${fullName(u)}`}
        body="Elegí una contraseña temporal y pasásela. Al iniciar sesión se le pide una nueva." ok="Restablecer" back="Volver" onConfirm={resetPassword} onClose={() => setReset(null)}>
        <Password label="Contraseña temporal" data-first autoComplete="new-password" value={pw} error={pwErr} onChange={e => { setPw(e.target.value); setPwErr(''); }} />
      </ConfirmModal>}</Shown>
      <Shown when={form}>{form => <UserDrawer edit={form === 'new' ? null : form} onClose={() => setForm(null)}
        onSaved={async (msg, id) => { setForm(null); if (id) await refresh(id); else list.reload(); toast(msg); }} />}</Shown>
    </>
  );
}

function UserDetail({ u, self, onEdit, onDeactivate, onReactivate, onResetPassword, onUser, onParking }: {
  u: U; self: boolean; onEdit: () => void; onDeactivate: () => void; onReactivate: () => void; onResetPassword: () => void; onUser: (id: string) => void; onParking: (id: string) => void;
}) {
  const active = u.status === 'ACTIVO';
  return (
    <>
      <div className="mhead">
        <div className="who"><span className="av lg">{initials(u.name, u.last_name)}</span>
          <div className="t"><h2 className="t">{fullName(u)}{self && <span className="ad"> (vos)</span>}</h2>
            <div className="ad">{ROLE[u.type].l} · <span className={`st ${active ? 'ok' : 'mute'}`}>{active ? 'Activo' : 'De baja'}</span></div></div></div>
        {!self && (
          <div className="macts">
            {active ? <>
              <button type="button" className="btn" onClick={onEdit}><Pencil className="i sm" />Editar</button>
              {u.type !== 'ADMINISTRADOR' && <button type="button" className="btn" onClick={onResetPassword}><KeyRound className="i sm" />Contraseña</button>}
              <button type="button" className="btn errtx" onClick={onDeactivate}><Trash2 className="i sm" />Dar de baja</button>
            </> : <button type="button" className="btn" onClick={onReactivate}><RotateCcw className="i sm" />Reactivar</button>}
          </div>
        )}
      </div>
      <div className="fs"><div className="fh"><h3>Datos</h3></div>
        <dl className="dl">
          <dt>DNI</dt><dd>{u.dni}</dd>
          <dt>Email</dt><dd className="t">{u.email}</dd>
          <dt>Teléfono</dt><dd>{u.phone || '—'}</dd>
          <dt>Nacimiento</dt><dd>{birth(u.date_of_birth)}</dd>
        </dl>
      </div>
      {u.type === 'CLIENTE' && <ClientBlocks u={u} />}
      {u.type === 'DUEÑO' && <OwnerBlocks u={u} onParking={onParking} />}
      {u.type === 'EMPLEADO' && <EmployeeBlocks u={u} onUser={onUser} onParking={onParking} />}
    </>
  );
}

// Cada bloque pide lo suyo y tiene sus cuatro estados: carga, error con Reintentar, vacío y datos.
function Block({ title, a, empty, children }: { title: string; a: { status: 'loading' | 'ready' | 'error'; reload: () => void }; empty?: string; children: ReactNode }) {
  return (
    <div className="fs"><div className="fh"><h3>{title}</h3></div>
      {a.status === 'error' ? <ErrorBox what={title.toLowerCase()} onRetry={a.reload} />
        : a.status === 'loading' ? <span className="sk" style={{ height: 64 }} />
        : empty ? <p className="ad">{empty}</p> : children}
    </div>
  );
}

function ClientBlocks({ u }: { u: U }) {
  const veh = useAsync(() => getUserVehicle(u.id).then(asList<any>), [u.id]);
  const res = useAsync(() => getReservationsByClient(u.id).then(x => asList<any>(x).map(normRes).sort((a, b) => (b.date + b.start).localeCompare(a.date + a.start))), [u.id]);
  const open = (res.data ?? []).filter(r => r.st === 'curso' || r.st === 'reservada').length;
  const total = res.data?.length ?? 0;
  return (
    <>
      <Block title="Vehículos" a={veh} empty={veh.data && !veh.data.length ? 'No registró vehículos.' : undefined}>
        <div className="panel tw"><table className="tbl">
          <thead><tr><th>Patente</th><th>Vehículo</th><th>Seguro</th></tr></thead>
          <tbody>{(veh.data ?? []).map(v => (
            <tr key={v.id}><td data-label="Patente"><span className="plate">{v.plate}</span></td>
              <td data-label="Vehículo"><span className="nm">{[v.brand?.name, v.model?.name].filter(Boolean).join(' ') || '—'}</span>{v.vehicleType?.name && <div className="ad cap">{createElement(iconOf(v.vehicleType.name), { className: 'i sm', 'aria-hidden': true })}{typeLabel(v.vehicleType.name)}</div>}</td>
              <td data-label="Seguro">{v.insurance?.name ?? <span className="ad">Sin seguro</span>}</td></tr>
          ))}</tbody>
        </table></div>
      </Block>
      <Block title="Reservas" a={res} empty={res.data && !total ? 'Todavía no hizo reservas.' : undefined}>
        <p className="ad">{plural(total, 'reserva', 'reservas')} · {plural(open, 'activa', 'activas')}</p>
        <div className="panel tw"><table className="tbl">
          <thead><tr><th>Código</th><th>Cochera</th><th>Fecha</th><th>Estado</th></tr></thead>
          <tbody>{(res.data ?? []).slice(0, 5).map(r => (
            <tr key={r.id}><td data-label="Código"><span className="nm">{r.code}</span></td><td data-label="Cochera">{r.pname}</td>
              <td data-label="Fecha">{r.date.slice(8)}/{r.date.slice(5, 7)} · {r.start}</td><td data-label="Estado">{RS[r.st].l}</td></tr>
          ))}</tbody>
        </table></div>
        {total > 5 && <p className="ad">Se muestran las últimas 5 de {total}.</p>}
      </Block>
    </>
  );
}

function OwnerBlocks({ u, onParking }: { u: U; onParking: (id: string) => void }) {
  const parkings = useAsync(() => getParkingsByOwner(u.id).then(asList<any>), [u.id]);
  const crew = useAsync(() => getEmployeesByOwner(u.id).then(asList<any>), [u.id]);
  return (
    <>
      <Block title="Cocheras" a={parkings} empty={parkings.data && !parkings.data.length ? 'Todavía no registró sucursales.' : undefined}>
        <div className="rows">{(parkings.data ?? []).map(p => (
          <button type="button" key={p.id} className="bi" onClick={() => onParking(p.id)}>
            <span className="t"><span className="nm t">{p.name}</span><span className="ad t">{p.locality}{p.province ? `, ${p.province}` : ''} · {pct(p)} % ocupada</span></span>
            <span className={`st ${p.isActive ? 'ok' : 'mute'}`}>{p.isActive ? 'Activa' : 'Pausada'}</span><ChevronRight className="i sm go" aria-hidden="true" />
          </button>
        ))}</div>
      </Block>
      <Block title="Empleados" a={crew} empty={crew.data && !crew.data.length ? 'No tiene empleados activos.' : undefined}>
        <p className="ad">{(crew.data ?? []).map(e => fullName(e)).join(', ')}</p>
      </Block>
    </>
  );
}

function EmployeeBlocks({ u, onUser, onParking }: { u: U; onUser: (id: string) => void; onParking: (id: string) => void }) {
  const owner = useAsync<U | null>(() => (u.ownerId ? getUser(u.ownerId) : Promise.resolve(null)), [u.ownerId]);
  const parkings = useAsync(() => (u.ownerId ? getParkingsByOwner(u.ownerId).then(asList<any>) : Promise.resolve([])), [u.ownerId]);
  const park = (parkings.data ?? []).find(p => p.id === u.parkingId);
  return (
    <Block title="Dónde trabaja" a={owner.status === 'error' ? owner : parkings} empty={!u.ownerId ? 'Sin dueño ni sucursal asignados.' : undefined}>
      <dl className="dl">
        <dt>Sucursal</dt><dd>{park ? <button type="button" className="link lk" onClick={() => onParking(park.id)}>{park.name}</button> : 'Sin sucursal'}</dd>
        {park && <><dt>Localidad</dt><dd>{park.locality}{park.province ? `, ${park.province}` : ''}</dd></>}
        <dt>Dueño</dt><dd>{owner.data ? <button type="button" className="link lk" onClick={() => onUser(owner.data!.id)}>{fullName(owner.data)}</button> : '—'}</dd>
      </dl>
    </Block>
  );
}

const NEW_ROLES: Role[] = ['CLIENTE', 'DUEÑO', 'EMPLEADO'];

// Alta y edición (RA-01, RA-02, RA-10): el rol decide el formulario; el empleado depende de un dueño y de una sucursal de ese dueño, y no cambia de dueño ni de rol.
function UserDrawer({ edit, onClose, onSaved }: { edit: U | null; onClose: () => void; onSaved: (msg: string, id?: string) => void }) {
  const [role, setRole] = useState<Role>(edit?.type ?? 'EMPLEADO');
  const [ownerId, setOwnerId] = useState(edit?.ownerId ?? '');
  const [parkingId, setParkingId] = useState(edit?.parkingId ?? '');
  const [parkings, setParkings] = useState<{ id: string; name: string }[]>([]);
  const [v, setV] = useState({ dni: edit?.dni ?? '', name: edit?.name ?? '', last_name: edit?.last_name ?? '', date_of_birth: edit?.date_of_birth?.slice(0, 10) ?? '', phone: edit?.phone ?? '', email: edit?.email ?? '', password: '' });
  const [err, setErr] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof v) => (e: { target: { value: string } }) => { setV({ ...v, [k]: e.target.value }); setErr({ ...err, [k]: '', general: '' }); };

  // Dueños activos para elegir (solo al dar de alta un empleado) y, al editar, el nombre del dueño del empleado.
  // shortcut: L-35, el selector trae hasta 100 dueños activos; pasar a un buscador si hay más.
  const needOwners = !edit && role === 'EMPLEADO';
  const owners = useAsync<U[]>(() => (needOwners ? getUsersPage({ role: 'DUEÑO', status: 'ACTIVO', page: 1, limit: 100 }).then(r => r.data) : Promise.resolve([])), [needOwners]);
  const ownerOfEdit = useAsync<U | null>(() => (edit?.ownerId ? getUser(edit.ownerId) : Promise.resolve(null)), [edit?.ownerId]);

  // La sucursal solo lista las del dueño elegido.
  useEffect(() => {
    if (role !== 'EMPLEADO' || !ownerId) { setParkings([]); return; }
    let live = true;
    getParkingsByOwner(ownerId).then(x => live && setParkings(asList(x))).catch(() => live && setErr(s => ({ ...s, parkingId: 'No pudimos cargar las sucursales. Cerrá el panel e intentá de nuevo.' })));
    return () => { live = false; };
  }, [role, ownerId]);

  // Anticipa las reglas del backend (User.Schema.ts y User.Service.ts); las valida el servidor.
  const save = async (e: FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (!/^\d{7,8}$/.test(v.dni.trim())) er.dni = 'El DNI debe tener 7 u 8 dígitos.';
    if (v.name.trim().length < 2) er.name = 'Ingresá un nombre de al menos 2 caracteres.';
    if (v.last_name.trim().length < 2) er.last_name = 'Ingresá un apellido de al menos 2 caracteres.';
    if (!v.date_of_birth) er.date_of_birth = 'Ingresá la fecha de nacimiento.';
    else if (ageOf(v.date_of_birth) < 18) er.date_of_birth = 'Tiene que ser mayor de 18 años.';
    if (!/^\d{6,15}$/.test(v.phone.replace(/\s/g, ''))) er.phone = 'Solo dígitos, entre 6 y 15.';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.email.trim())) er.email = 'Ingresá un email válido.';
    if (!edit && v.password.trim().length < 6) er.password = 'Mínimo 6 caracteres.';
    if (role === 'EMPLEADO') {
      if (!ownerId) er.ownerId = 'Elegí el dueño del empleado.';
      else if (!parkingId) er.parkingId = 'Elegí la sucursal donde trabaja.';
    }
    setErr(er);
    if (Object.keys(er).length) return;
    const data: UserData = { dni: v.dni.trim(), name: v.name.trim(), last_name: v.last_name.trim(), date_of_birth: v.date_of_birth, phone: v.phone.replace(/\s/g, ''), email: v.email.trim() };
    setBusy(true);
    try {
      let id = edit?.id;
      if (edit?.type === 'EMPLEADO') await updateEmployee(edit.ownerId!, edit.id, { ...data, parkingId });
      else if (edit) await updateUser(edit.id, data);
      else if (role === 'EMPLEADO') id = (await createEmployee(ownerId, { ...data, password: v.password, parkingId }))?.data?.id;
      else id = (await createUser(role as 'CLIENTE' | 'DUEÑO', { ...data, password: v.password }))?.data?.id;
      onSaved(edit ? `${data.name} ${data.last_name} actualizado.` : `${data.name} ${data.last_name} dado de alta como ${ROLE[role].l.toLowerCase()}.`, id);
    } catch (x) { setErr({ general: apiError(x) }); setBusy(false); }
  };

  return (
    <Drawer title={edit ? 'Editar usuario' : 'Nuevo usuario'} sub={edit ? `${fullName(edit)} · ${ROLE[edit.type].l}` : 'Elegí el rol y completá los datos.'} onClose={onClose}
      footer={<div className="dfoot"><button type="button" className="btn" onClick={onClose}>Cancelar</button><button className="btn pri" type="submit" form="uform" aria-busy={busy} disabled={busy}>{edit ? 'Guardar cambios' : 'Crear usuario'}</button></div>}>
      <form id="uform" noValidate className="dbody" onSubmit={save}>
        {!edit && <section className="fs"><div className="fh"><h3>Rol</h3></div>
          <div className="seg" role="group" aria-label="Rol del usuario" style={{ justifySelf: 'start' }}>
            {NEW_ROLES.map(r => <button type="button" key={r} aria-pressed={role === r} onClick={() => { setRole(r); setErr({}); }}>{ROLE[r].l}</button>)}
          </div></section>}
        {role === 'EMPLEADO' && <section className="fs"><div className="fh"><h3>Dónde trabaja</h3></div>
          {edit
            ? <Input label="Dueño" value={ownerOfEdit.data ? fullName(ownerOfEdit.data) : '—'} disabled hint="El empleado depende de este dueño; no se traslada a otro." />
            : <Field label="Dueño" error={err.ownerId || (owners.status === 'error' ? 'No pudimos cargar los dueños. Cerrá el panel e intentá de nuevo.' : '')}>{(id, aria) => (
                <select className="sel" id={id} {...aria} value={ownerId} disabled={owners.status !== 'ready'} onChange={e => { setOwnerId(e.target.value); setParkingId(''); setErr({ ...err, ownerId: '', parkingId: '' }); }}>
                  <option value="">{owners.status === 'loading' ? 'Cargando dueños…' : 'Elegí un dueño'}</option>
                  {(owners.data ?? []).map(o => <option key={o.id} value={o.id}>{fullName(o)}</option>)}
                </select>)}</Field>}
          <Field label="Sucursal" error={err.parkingId} hint="Solo aparecen las sucursales del dueño elegido.">{(id, aria) => (
            <select className="sel" id={id} {...aria} disabled={!ownerId} value={parkingId} onChange={e => { setParkingId(e.target.value); setErr({ ...err, parkingId: '' }); }}>
              <option value="">{ownerId ? 'Elegí una sucursal' : 'Elegí primero un dueño'}</option>
              {parkings.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>)}</Field>
        </section>}
        <section className="fs"><div className="fh"><h3>Datos personales</h3></div>
          <Input label="DNI" placeholder="Sin puntos" inputMode="numeric" maxLength={8} autoComplete="off" value={v.dni} onChange={set('dni')} error={err.dni} data-first />
          <div className="g2"><Input label="Nombre" value={v.name} onChange={set('name')} error={err.name} /><Input label="Apellido" value={v.last_name} onChange={set('last_name')} error={err.last_name} /></div>
          <div className="g2"><Input label="Fecha de nacimiento" type="date" value={v.date_of_birth} onChange={set('date_of_birth')} error={err.date_of_birth} hint="Tiene que ser mayor de 18 años." />
            <Input label="Teléfono" type="tel" placeholder="3415550000" value={v.phone} onChange={set('phone')} error={err.phone} /></div>
        </section>
        <section className="fs"><div className="fh"><h3>Acceso</h3></div>
          <Input label="Email" type="email" placeholder="nombre@empresa.com" autoComplete="off" value={v.email} onChange={set('email')} error={err.email} />
          {edit
            ? <Input label="Rol" value={ROLE[edit.type].l} disabled hint="El rol no se cambia." />
            : <Password label="Contraseña temporal" autoComplete="new-password" value={v.password} onChange={set('password')} error={err.password} hint="Pasásela al usuario; la puede cambiar desde Mi perfil." />}
          {err.general && <div className="ferr" role="alert">{err.general}</div>}
        </section>
      </form>
    </Drawer>
  );
}
