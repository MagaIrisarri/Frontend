import { createElement, useCallback, useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LayoutGrid, MoreVertical, Plus, Search, Trash2, Wrench, Check } from 'lucide-react';
import { ConfirmModal } from '../../components/Owner/ui/Layer';
import { Shown } from '../../components/Owner/ui/Presence';
import { Empty, ErrorBox, PageHead } from '../../components/Owner/ui/Page';
import { apiError } from '../../components/Owner/ui/Field';
import { Menu } from '../../components/Owner/ui/Menu';
import { useToast } from '../../components/Owner/ui/Toasts';
import { createBulkParkingSpaces, getParkingSpace, removeParkingSpace, updateParkingSpace } from '../../services/parkingSpace.service';
import { useOwner } from './OwnerContext';
import { useVehicleTypes } from '../../hooks/useVehicleTypes';
import { iconOf } from '../../components/Owner/ui/vehicles';
import { isoD, plural, shD, typeLabel, typePlural } from './owner.lib';

type State = 'LIBRE' | 'OCUPADO' | 'MANTENIMIENTO';
// R-30: la plaza admite un tipo de vehículo del catálogo del administrador.
interface Space { id: string; spaceCode: string; vehicleType: { id: string; name: string }; state: State }

const ST: Record<State, { l: string; c: string }> = {
  LIBRE: { l: 'Libre', c: 'ok' }, OCUPADO: { l: 'Ocupada', c: 'ac' }, MANTENIMIENTO: { l: 'Mantenimiento', c: 'warn' },
};
type Action = 'MANTENIMIENTO' | 'BAJA';
// Reserva futura de la plaza y la plaza libre que le propone el backend (null: no hay lugar en su horario).
interface Relocation { reservationId: string; code: string; plate: string; startTime: string; endTime: string; toSpaceId: string | null; toSpaceCode: string | null }
const when = (r: Relocation) => {
  const s = new Date(r.startTime), e = new Date(r.endTime), t = (d: Date) => d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  return `${shD(isoD(s))} ${t(s)}–${t(e)}`;
};

// Plazas de cada sucursal: agregar, pasar a mantenimiento, volver a habilitar y dar de baja (R-18).
export default function OwnerSpaces() {
  const { parkings, status, refresh } = useOwner();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const pid = parkings.find(p => p.id === params.get('p'))?.id ?? parkings[0]?.id;
  const p = parkings.find(x => x.id === pid);
  const [list, setList] = useState<Space[] | null>(null);
  const [loadErr, setLoadErr] = useState(false);
  const [fk, setFk] = useState<string>('all'); // 'all' o el id del tipo
  const [fs, setFs] = useState<'all' | State>('all');
  const [q, setQ] = useState('');
  const { types } = useVehicleTypes();
  const [addK, setAddK] = useState(''); // id del tipo; vacío = el primero de la lista
  const addType = types.find(t => t.id === addK) ?? types[0];
  const [addN, setAddN] = useState('1');
  const [addErr, setAddErr] = useState('');
  const [del, setDel] = useState<Space | null>(null);
  const [reloc, setReloc] = useState<{ space: Space; action: Action; conflicts: Relocation[]; message: string } | null>(null);

  const load = useCallback(async () => {
    if (!pid) return;
    setList(null); setLoadErr(false);
    try {
      const x = await getParkingSpace(pid);
      setList((Array.isArray(x) ? x : x?.data ?? []).sort((a: Space, b: Space) => a.spaceCode.localeCompare(b.spaceCode, 'es', { numeric: true })));
    } catch { setLoadErr(true); }
  }, [pid]);
  useEffect(() => { load(); }, [load]);

  // Recarga las plazas y la sucursal (capacidad y ocupación del panel).
  const reload = async () => { await Promise.all([load(), refresh()]); };

  // Saca la plaza de servicio. Si tiene reservas futuras, el backend responde 409 con la plaza propuesta para cada una
  // (details.conflicts) y se muestran para confirmar; al confirmar se repite con relocate (R-19).
  const takeOut = async (s: Space, action: Action, relocate = false) => {
    try {
      const res = action === 'MANTENIMIENTO' ? await updateParkingSpace(s.id, { state: 'MANTENIMIENTO', relocate }) : await removeParkingSpace(s.id, relocate);
      setReloc(null);
      await reload();
      const moved: Relocation[] = res?.moved ?? [];
      const done = action === 'MANTENIMIENTO' ? `Plaza ${s.spaceCode} en mantenimiento.` : `Plaza ${s.spaceCode} dada de baja.`;
      toast(moved.length ? `${done} ${plural(moved.length, 'reserva pasó', 'reservas pasaron')} a otra plaza: ${moved.map(m => `${m.code} → ${m.toSpaceCode}`).join(', ')}.` : done, 'info');
    } catch (x: any) {
      const conflicts: Relocation[] | undefined = x?.response?.status === 409 ? x.response.data?.details?.conflicts : undefined;
      if (conflicts?.length) setReloc({ space: s, action, conflicts, message: apiError(x) });
      else { setReloc(null); toast(apiError(x, 'No se pudo completar. Intentá de nuevo.'), 'err'); }
    }
  };
  const enable = async (s: Space) => {
    try {
      await updateParkingSpace(s.id, { state: 'LIBRE' });
      await reload();
      toast(`Plaza ${s.spaceCode} habilitada de nuevo.`);
    } catch (x) { toast(apiError(x, 'No se pudo habilitar. Intentá de nuevo.'), 'err'); }
  };
  const remove = () => { const s = del!; setDel(null); takeOut(s, 'BAJA'); };
  const add = async (e: FormEvent) => {
    e.preventDefault();
    const n = Number(addN);
    if (!Number.isInteger(n) || n < 1 || n > 100) return setAddErr('Ingresá una cantidad entre 1 y 100.');
    if (!addType) return setAddErr('No hay tipos de vehículo cargados.');
    try {
      await createBulkParkingSpaces(pid!, { vehicleTypeId: addType.id, count: n });
      setAddN('1'); setAddErr('');
      await reload();
      toast(`${plural(n, `plaza de ${typeLabel(addType.name).toLowerCase()} agregada`, `plazas de ${typePlural(addType.name).toLowerCase()} agregadas`)} a ${p!.name}.`);
    } catch (x) { setAddErr(apiError(x)); }
  };

  const all = list ?? [];
  const term = q.trim().toUpperCase().replace(/\s/g, '');
  // Tipos de las plazas de la sucursal, en el orden del catálogo (los que ya no están en el catálogo, al final).
  const spaceTypes = [...new Map(all.map(s => [s.vehicleType.id, s.vehicleType])).values()]
    .sort((a, b) => (types.findIndex(t => t.id === a.id) + 1 || 99) - (types.findIndex(t => t.id === b.id) + 1 || 99));
  const shown = all.filter(s => (fk === 'all' || s.vehicleType.id === fk) && (fs === 'all' || s.state === fs) && (!term || s.spaceCode.toUpperCase().includes(term)));
  const maint = all.filter(s => s.state === 'MANTENIMIENTO').length;

  let detail;
  if (loadErr) detail = <ErrorBox what="las plazas" onRetry={load} />;
  else if (list === null) detail = <span className="sk" style={{ height: 44 }} />;
  else if (!all.length) detail = (
    <div className="empty" style={{ padding: '36px 0 20px' }}><div className="ico"><LayoutGrid className="i" /></div><h3>Sin plazas</h3>
      <p>Agregá plazas para que esta sucursal pueda recibir reservas.</p></div>);
  else if (!shown.length) detail = (
    <div className="empty" style={{ padding: '36px 0 20px' }}><div className="ico"><Search className="i" /></div><h3>Sin resultados</h3>
      <p>Ninguna plaza coincide con los filtros actuales.</p>
      <button type="button" className="btn" onClick={() => { setFk('all'); setFs('all'); setQ(''); }}>Limpiar filtros</button></div>);
  else detail = (
    <div className="tw"><table className="tbl">
      <colgroup><col /><col style={{ width: '30%' }} /><col style={{ width: 160 }} /><col style={{ width: 64 }} /></colgroup>
      <thead><tr><th>Plaza</th><th>Tipo</th><th>Estado</th><th><span className="sr">Acciones</span></th></tr></thead>
      <tbody>{shown.map(s => {
        const items = [
          ...(s.state === 'LIBRE' ? [{ label: 'Pasar a mantenimiento', icon: <Wrench className="i" />, onClick: () => takeOut(s, 'MANTENIMIENTO') }] : []),
          ...(s.state === 'MANTENIMIENTO' ? [{ label: 'Volver a habilitar', icon: <Check className="i" />, onClick: () => enable(s) }] : []),
          { label: 'Dar de baja', icon: <Trash2 className="i" />, danger: true, sep: true, onClick: () => setDel(s) },
        ];
        return (
          <tr key={s.id}>
            <td><span className="plate">{s.spaceCode}</span></td>
            <td data-label="Tipo"><span className="cap">{createElement(iconOf(s.vehicleType.name), { className: 'i', 'aria-hidden': true })}{typeLabel(s.vehicleType.name)}</span></td>
            <td data-label="Estado"><span className={`st ${ST[s.state].c}`}>{ST[s.state].l}</span></td>
            <td className="r"><div className="acts">{s.state === 'OCUPADO'
              ? <span className="na" title="Con un vehículo adentro no se puede pasar a mantenimiento ni dar de baja">En uso</span>
              : <Menu label={`Más acciones de la plaza ${s.spaceCode}`} button={<MoreVertical className="i" />} items={items} />}</div></td>
          </tr>
        );
      })}</tbody>
    </table></div>
  );

  let body;
  if (status === 'error') body = <ErrorBox what="las sucursales" onRetry={refresh} />;
  else if (status === 'loading') body = <div className="md"><div className="panel mlist"><span className="sk" style={{ height: 38, margin: 4 }} /></div><div className="panel dpanel"><span className="sk" style={{ height: 44 }} /></div></div>;
  else if (!p) body = (
    <Empty icon={<LayoutGrid className="i" />} title="No hay sucursales"
      action={<button type="button" className="btn pri" onClick={() => navigate('/owner?new=1')}><Plus className="i sm" />Registrar sucursal</button>}>
      Las plazas pertenecen a una sucursal. Registrá una para empezar.
    </Empty>);
  else body = (
    <div className="md">
      <div className="panel mlist" role="list" aria-label="Sucursales">
        {parkings.map(x => (
          <button type="button" key={x.id} className="mitem" role="listitem" aria-current={x.id === p.id} onClick={() => { setParams({ p: x.id }); setFk('all'); setFs('all'); setQ(''); }}>
            <span style={{ minWidth: 0 }}><span className="nm">{x.name}</span><span className="ad" style={{ display: 'block' }}>{x.address}</span></span>
          </button>
        ))}
      </div>
      <section className="panel dpanel" aria-label={`Plazas de ${p.name}`}>
        <div className="head"><div><h2>{p.name}</h2>
          <p className="sub">{list ? `${plural(all.length, 'plaza', 'plazas')}${maint ? ` · ${maint} en mantenimiento` : ''}` : 'Cargando plazas…'}</p></div></div>
        <form className="addrow" noValidate onSubmit={add}>
          <div className="field"><label htmlFor="sk">Tipo de plaza</label>
            <select className="sel" id="sk" value={addType?.id ?? ''} onChange={e => setAddK(e.target.value)}>
              {types.map(t => <option key={t.id} value={t.id}>{typeLabel(t.name)}</option>)}
            </select></div>
          <div className="field"><label htmlFor="sn">Cantidad</label>
            <input className="inp" id="sn" inputMode="numeric" autoComplete="off" aria-invalid={!!addErr} value={addN} onChange={e => { setAddN(e.target.value.replace(/\D/g, '')); setAddErr(''); }} /></div>
          <button type="submit" className="btn pri"><Plus className="i sm" />Agregar plazas</button>
          {addErr && <div className="ferr" style={{ gridColumn: '1/-1' }} role="alert">{addErr}</div>}
        </form>
        {all.length > 0 && <>
          <div className="toolbar">
            <div className="search"><Search className="i" /><input className="inp" type="search" placeholder="Buscar plaza (A-01)" aria-label="Buscar plaza por código" value={q} onChange={e => setQ(e.target.value)} /></div>
          </div>
          <div className="seg" role="group" aria-label="Filtrar por tipo" style={{ justifySelf: 'start' }}>
            {([['all', 'Todas'], ...spaceTypes.map(t => [t.id, typePlural(t.name)])] as [string, string][]).map(([k, l]) => (
              <button type="button" key={k} aria-pressed={fk === k} onClick={() => setFk(k)}>{l}<b>{all.filter(s => k === 'all' || s.vehicleType.id === k).length}</b></button>
            ))}
          </div>
          <div className="seg" role="group" aria-label="Filtrar por estado" style={{ justifySelf: 'start' }}>
            {([['all', 'Todos'], ['LIBRE', 'Libres'], ['OCUPADO', 'Ocupadas'], ['MANTENIMIENTO', 'Mantenimiento']] as ['all' | State, string][]).map(([k, l]) => (
              <button type="button" key={k} aria-pressed={fs === k} onClick={() => setFs(k)}>{l}<b>{all.filter(s => k === 'all' || s.state === k).length}</b></button>
            ))}
          </div>
        </>}
        {detail}
      </section>
    </div>
  );

  return (
    <>
      <PageHead title="Plazas" sub="Agregá plazas, pasalas a mantenimiento o dalas de baja. Las que tienen un vehículo adentro o reservas pendientes no se pueden sacar de servicio." />
      {body}
      <Shown when={del}>{del => <ConfirmModal title={`¿Dar de baja la plaza ${del.spaceCode}?`}
        body={`Deja de existir en ${p?.name} y la capacidad de ${typePlural(del.vehicleType.name).toLowerCase()} baja en 1. Si solo está fuera de servicio por un tiempo, pasala a mantenimiento.`}
        ok="Dar de baja" back="Volver" danger onConfirm={remove} onClose={() => setDel(null)} />}</Shown>
      <Shown when={reloc}>{reloc => <RelocateModal {...reloc} onConfirm={() => takeOut(reloc.space, reloc.action, true)} onClose={() => setReloc(null)} />}</Shown>
    </>
  );
}

// R-19: reservas futuras de la plaza que se saca de servicio y a qué plaza pasaría cada una.
// Si alguna no tiene lugar, solo informa: no se puede sacar la plaza hasta liberar ese horario.
function RelocateModal({ space, action, conflicts, message, onConfirm, onClose }: {
  space: Space; action: Action; conflicts: Relocation[]; message: string; onConfirm: () => void; onClose: () => void;
}) {
  const ok = conflicts.every(c => c.toSpaceId);
  const body = (<>
    {message}.
    {conflicts.map(c => (
      <span key={c.reservationId} style={{ display: 'block', marginTop: 6 }}>
        <b>{c.code}</b> · {c.plate} · {when(c)} → {c.toSpaceCode ? <b>plaza {c.toSpaceCode}</b> : <span className="na">sin plaza libre</span>}
      </span>
    ))}
  </>);
  return ok
    ? <ConfirmModal title={`Mover ${plural(conflicts.length, 'reserva', 'reservas')} de la plaza ${space.spaceCode}`} body={body}
      ok={action === 'MANTENIMIENTO' ? 'Mover y pasar a mantenimiento' : 'Mover y dar de baja'} back="Volver" danger={action === 'BAJA'} onConfirm={onConfirm} onClose={onClose} />
    : <ConfirmModal title={`No se puede sacar de servicio la plaza ${space.spaceCode}`} body={body} ok="Entendido" back="Volver" onConfirm={onClose} onClose={onClose} />;
}
