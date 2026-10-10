import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Building2, MoreVertical, Pencil, Plus, RotateCcw, Search, Trash2, Unlink, Users } from 'lucide-react';
import { ConfirmModal, Drawer } from '../../components/Owner/ui/Layer';
import { Empty, ErrorBox, PageHead, SkeletonRows } from '../../components/Owner/ui/Page';
import { Field, Input, Password, apiError } from '../../components/Owner/ui/Field';
import { Menu } from '../../components/Owner/ui/Menu';
import { useToast } from '../../components/Owner/ui/Toasts';
import { createEmployee, deleteEmployee, getEmployeesByOwner, reactivateEmployee, updateEmployee } from '../../services/employee.service';
import { useOwner, type Emp } from './OwnerContext';
import { initials, shiftsText } from './owner.lib';

export default function OwnerEmployees() {
  const { employees, parkings, templates, status, refresh, ownerId } = useOwner();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [q, setQ] = useState('');
  const [ep, setEp] = useState(params.get('p') ?? '');
  const [form, setForm] = useState<Emp | 'new' | null>(null);
  const [del, setDel] = useState<Emp | null>(null);
  const [gone, setGone] = useState<Emp[] | null>(null); // dados de baja, solo cuando se piden

  const showGone = ep === 'baja';
  useEffect(() => {
    if (!showGone) return;
    setGone(null);
    getEmployeesByOwner(ownerId, 'BAJA').then(setGone).catch(() => { setGone([]); toast('No se pudieron cargar los empleados dados de baja.', 'err'); });
  }, [showGone, ownerId, employees, toast]);

  const reactivate = async (e: Emp) => {
    try {
      await reactivateEmployee(ownerId, e.id);
      await refresh();
      toast(`${e.name} ${e.last_name} vuelve a estar activo.`);
    } catch (x) { toast(apiError(x, 'No se pudo reactivar el empleado.'), 'err'); }
  };

  const ql = q.trim().toLowerCase();
  const list = employees.filter(e => (!ep || (ep === 'none' ? !e.parkingId : e.parkingId === ep))
    && (!ql || `${e.name} ${e.last_name} ${e.email} ${e.dni}`.toLowerCase().includes(ql)));

  const remove = async () => {
    const e = del!;
    try {
      await deleteEmployee(ownerId, e.id);
      setDel(null);
      await refresh();
      toast(`${e.name} ${e.last_name} fue dado de baja. Podés reactivarlo desde “Dados de baja”.`, 'info');
    } catch (x) { setDel(null); toast(apiError(x, 'No se pudo eliminar el empleado.'), 'err'); }
  };

  let body;
  if (status === 'error') body = <ErrorBox what="tu personal" onRetry={refresh} />;
  else if (status === 'loading' || (showGone && !gone)) body = <SkeletonRows n={4} />;
  else if (showGone) body = !gone!.length ? <Empty icon={<Users className="i" />} title="No hay empleados dados de baja" /> : (
    <div className="panel tw"><table className="tbl em">
      <thead><tr><th>Empleado</th><th>DNI</th><th>Teléfono</th><th><span className="sr">Acciones</span></th></tr></thead>
      <tbody>{gone!.filter(e => !ql || `${e.name} ${e.last_name} ${e.email} ${e.dni}`.toLowerCase().includes(ql)).map(e => (
        <tr key={e.id}>
          <td><div className="l" style={{ display: 'flex', gap: 12, alignItems: 'center', minWidth: 0 }}><span className="av lg">{initials(e.name, e.last_name)}</span>
            <div style={{ minWidth: 0 }}><span className="nm">{e.name} {e.last_name}</span><div className="ad">{e.email}</div></div></div></td>
          <td data-label="DNI">{e.dni}</td>
          <td data-label="Teléfono">{e.phone || <span className="na">—</span>}</td>
          <td className="r"><div className="acts"><button type="button" className="btn sm" onClick={() => reactivate(e)}><RotateCcw className="i sm" />Reactivar</button></div></td>
        </tr>
      ))}</tbody>
    </table></div>
  );
  else if (!employees.length && !showGone) body = (
    <Empty icon={<Users className="i" />} title="No tenés empleados"
      action={<button type="button" className="btn pri" onClick={() => setForm('new')}><Plus className="i sm" />Crear primer empleado</button>}>
      Registrá a tu personal para que pueda operar las sucursales: check-in, check-out y validación de reservas.
    </Empty>);
  else if (!list.length) body = <Empty icon={<Search className="i" />} title="Sin resultados">Ningún empleado coincide con la búsqueda.</Empty>;
  else body = (
    <div className="panel tw"><table className="tbl em">
      <colgroup><col /><col style={{ width: 110 }} /><col style={{ width: 140 }} /><col style={{ width: '30%' }} /><col style={{ width: 152 }} /></colgroup>
      <thead><tr><th>Empleado</th><th>DNI</th><th>Teléfono</th><th>Sucursal y turno</th><th><span className="sr">Acciones</span></th></tr></thead>
      <tbody>{list.map(e => {
        const p = parkings.find(x => x.id === e.parkingId), sh = p ? shiftsText(templates[p.id], e.id) : [];
        return (
          <tr key={e.id}>
            <td><div className="l" style={{ display: 'flex', gap: 12, alignItems: 'center', minWidth: 0 }}><span className="av lg">{initials(e.name, e.last_name)}</span>
              <div style={{ minWidth: 0 }}><button type="button" className="nm" onClick={() => setForm(e)}>{e.name} {e.last_name}</button><div className="ad">{e.email}</div></div></div></td>
            <td data-label="DNI">{e.dni}</td>
            <td data-label="Teléfono">{e.phone || <span className="na">—</span>}</td>
            <td className="c-wide" data-label="Sucursal y turno">{p ? (
              <><div style={{ display: 'flex', gap: 8, alignItems: 'center', minWidth: 0 }}><Building2 className="i sm" /><span className="nm">{p.name}</span></div>
                <div className="ad">{sh.length ? sh.join(' · ') : <button type="button" className="link" onClick={() => navigate(`/owner/shifts?p=${p.id}`)}>Definir turnos</button>}</div></>
            ) : <span className="st warn"><Unlink className="i sm" />Sin asignar</span>}</td>
            <td className="r"><div className="acts">
              <button type="button" className="btn sm" onClick={() => setForm(e)}>Editar</button>
              <Menu label={`Más acciones de ${e.name} ${e.last_name}`} button={<MoreVertical className="i" />} items={[
                { label: 'Editar empleado', icon: <Pencil className="i" />, onClick: () => setForm(e) },
                { label: 'Dar de baja', icon: <Trash2 className="i" />, danger: true, sep: true, onClick: () => setDel(e) },
              ]} />
            </div></td>
          </tr>
        );
      })}</tbody>
    </table></div>
  );

  return (
    <>
      <PageHead title="Personal" sub={`Empleados operativos de tus sucursales${employees.length ? ` · ${employees.length} registrados` : ''}.`}
        actions={<button type="button" className="btn pri" onClick={() => setForm('new')}><Plus className="i sm" />Nuevo empleado</button>} />
      {status === 'ready' && (
        <div className="toolbar" style={{ marginBottom: -12 }}>
          <div className="search"><Search className="i" /><input className="inp" type="search" placeholder="Buscar por nombre, DNI o email" aria-label="Buscar empleado" value={q} onChange={e => setQ(e.target.value)} /></div>
          <select className="sel" aria-label="Filtrar por sucursal" style={{ width: 240 }} value={ep} onChange={e => setEp(e.target.value)}>
            <option value="">Todas las sucursales</option><option value="none">Sin asignar</option>
            {parkings.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            <option value="baja">Dados de baja</option>
          </select>
        </div>
      )}
      {body}
      {form && <EmployeeDrawer emp={form === 'new' ? null : form} onClose={() => setForm(null)} />}
      {del && <ConfirmModal title={`¿Dar de baja a ${del.name} ${del.last_name}?`} body="Pierde el acceso y deja de aparecer en tu personal. Podés reactivarlo más tarde." ok="Dar de baja" danger onConfirm={remove} onClose={() => setDel(null)} />}
    </>
  );
}

function EmployeeDrawer({ emp, onClose }: { emp: Emp | null; onClose: () => void }) {
  const { parkings, templates, employees, ownerId, reservations, refresh } = useOwner();
  const toast = useToast();
  const [v, setV] = useState({
    dni: emp?.dni ?? '', name: emp?.name ?? '', last_name: emp?.last_name ?? '', date_of_birth: emp?.date_of_birth?.slice(0, 10) ?? '',
    phone: emp?.phone ?? '', email: emp?.email ?? '', password: '', parkingId: emp?.parkingId ?? parkings[0]?.id ?? '',
  });
  const [err, setErr] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof v) => (e: { target: { value: string } }) => { setV({ ...v, [k]: e.target.value }); setErr({ ...err, [k]: '' }); };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (!/^\d{7,8}$/.test(v.dni.trim())) er.dni = 'El DNI debe tener 7 u 8 dígitos.';
    if (v.name.trim().length < 2) er.name = 'Requerido.';
    if (v.last_name.trim().length < 2) er.last_name = 'Requerido.';
    if (!v.date_of_birth) er.date_of_birth = 'Requerido.';
    if (!/^\d{6,15}$/.test(v.phone.replace(/\s/g, ''))) er.phone = 'Solo dígitos, entre 6 y 15.';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.email.trim())) er.email = 'Ingresá un email válido.';
    else if (employees.some(x => x.email.toLowerCase() === v.email.trim().toLowerCase() && x.id !== emp?.id)) er.email = 'Ya existe un empleado con ese email.';
    if (!emp && v.password.length < 6) er.password = 'Mínimo 6 caracteres.';
    if (!v.parkingId) er.parkingId = 'Elegí una sucursal.';
    // L-25: un empleado pertenece a una sola sucursal; sus turnos y reservas quedan en la anterior hasta que se reasignen.
    if (emp?.parkingId && emp.parkingId !== v.parkingId) {
      const pend = reservations.filter(r => r.eid === emp.id && (r.st === 'curso' || r.st === 'reservada')).length;
      if (pend) er.parkingId = `Tiene ${pend} reservas activas o pendientes en su sucursal actual. Reasignalas desde Reservas primero.`;
      else if (shiftsText(templates[emp.parkingId], emp.id).length) er.parkingId = 'Tiene turnos en su sucursal actual. Quitáselos desde Turnos primero.';
    }
    setErr(er);
    if (Object.keys(er).length) return toast('Revisá los campos marcados.', 'err');

    setBusy(true);
    const data = { dni: v.dni.trim(), name: v.name.trim(), last_name: v.last_name.trim(), date_of_birth: v.date_of_birth, phone: v.phone.replace(/\s/g, ''), email: v.email.trim(), parkingId: v.parkingId };
    try {
      if (emp) { await updateEmployee(ownerId, emp.id, data); toast(`Datos de ${data.name} actualizados.`); }
      else {
        await createEmployee(ownerId, { ...data, password: v.password });
        toast(`${data.name} ${data.last_name} fue dado de alta en ${parkings.find(p => p.id === data.parkingId)?.name}.`);
      }
      await refresh();
      onClose();
    } catch (x) { toast(apiError(x), 'err'); } finally { setBusy(false); }
  };

  return (
    <Drawer title={emp ? 'Editar empleado' : 'Nuevo empleado'} sub={emp ? `${emp.name} ${emp.last_name}` : 'Alta de personal operativo.'} onClose={onClose}
      footer={<div className="dfoot"><button type="button" className="btn" onClick={onClose}>Cancelar</button><button className="btn pri" type="submit" form="eform" aria-busy={busy}>{emp ? 'Guardar cambios' : 'Crear empleado'}</button></div>}>
      <form id="eform" noValidate className="dbody" onSubmit={save}>
        <section className="fs"><div className="fh"><h3>Datos personales</h3></div>
          <Input label="DNI" placeholder="Sin puntos" inputMode="numeric" maxLength={8} autoComplete="off" value={v.dni} onChange={set('dni')} error={err.dni} data-first />
          <div className="g2"><Input label="Nombre" value={v.name} onChange={set('name')} error={err.name} /><Input label="Apellido" value={v.last_name} onChange={set('last_name')} error={err.last_name} /></div>
          <div className="g2"><Input label="Fecha de nacimiento" type="date" value={v.date_of_birth} onChange={set('date_of_birth')} error={err.date_of_birth} />
            <Input label="Teléfono" type="tel" placeholder="3415550000" value={v.phone} onChange={set('phone')} error={err.phone} /></div>
        </section>
        <section className="fs"><div className="fh"><h3>Acceso</h3></div>
          <Input label="Email" type="email" placeholder="nombre@empresa.com" autoComplete="off" value={v.email} onChange={set('email')} error={err.email} />
          {!emp && <Password label="Contraseña temporal" autoComplete="new-password" value={v.password} onChange={set('password')} error={err.password} hint="El empleado deberá cambiarla en su primer ingreso." />}
        </section>
        <section className="fs"><div className="fh"><h3>Sucursal</h3></div>
          <Field label="Sucursal asignada" error={err.parkingId} hint="Los turnos se definen en Turnos.">
            {(id, aria) => <select className="sel" id={id} {...aria} value={v.parkingId} onChange={set('parkingId')}>{parkings.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>}
          </Field>
        </section>
      </form>
    </Drawer>
  );
}
