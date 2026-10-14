import { useEffect, useState } from 'react';
import { AlertTriangle, Check, ListChecks, Search } from 'lucide-react';
import AdminCatalog from './AdminCatalog';
import { VICON } from '../../components/Owner/ui/vehicles';
import { ConfirmModal, Drawer } from '../../components/Owner/ui/Layer';
import { Shown } from '../../components/Owner/ui/Presence';
import { ErrorBox, SkeletonRows } from '../../components/Owner/ui/Page';
import { apiError } from '../../components/Owner/ui/Field';
import { useToast } from '../../components/Owner/ui/Toasts';
import { plural, typeLabel } from '../Owner/owner.lib';
import type { VehicleType } from '../../types/vehicle.types';
import {
  createVehicleType, getTypeDescriptions, getVehicleTypes, removeVehicleType, setTypeDescriptions, updateVehicleType,
  type DescriptionChange, type TypeDescription,
} from '../../services/vehicleType.service';
import { invalidateVehicleTypes } from '../../hooks/useVehicleTypes';

const Icon = VICON.AUTO;

// R-30: cada tipo tiene sus propias plazas y tarifas. Sin plazas en ninguna cochera, sus vehículos todavía no pueden reservar.
const coverage = (t: VehicleType) => t.parkings
  ? `Con plazas en ${plural(t.parkings, 'cochera', 'cocheras')}`
  : 'Sin plazas en ninguna cochera: sus vehículos todavía no pueden reservar';

// Si es un tipo base y en cuántas cocheras tiene plazas lo calcula el backend; acá solo se muestra.
// Fuera del componente para que no cambie en cada render (AdminCatalog lo usa como dependencia de la carga).
// Después de cada cambio se descarta la lista guardada, así el alta de plazas y el filtro del mapa ven el tipo nuevo.
const changed = <T,>(p: Promise<T>) => p.then(r => { invalidateVehicleTypes(); return r; });
const API = {
  list: () => getVehicleTypes().then(res => res.data.map(t => ({
    id: t.id, name: t.name, locked: t.isBase,
    description: t.isBase ? `Tipo base del sistema: no se edita ni se elimina · ${coverage(t)}` : coverage(t),
  }))),
  create: (v: { name: string }) => changed(createVehicleType({ name: v.name })),
  update: (id: string, v: { name: string }) => changed(updateVehicleType(id, { name: v.name })),
  remove: (id: string) => changed(removeVehicleType(id)),
};

type Target = { id: string; name: string; fresh: boolean }; // fresh: recién creado, con las sugeridas ya tildadas

export default function AdminVehicleTypes() {
  const [target, setTarget] = useState<Target | null>(null);
  return (
    <>
      <AdminCatalog title="Tipos de vehículo" sub="Cada tipo tiene sus propias plazas y tarifas, que carga el dueño de cada cochera, y sus modelos salen de las descripciones del DNRPA que se le asignan. Un tipo con plazas, tarifas, modelos o vehículos no se da de baja."
        noun={{ one: 'tipo de vehículo', many: 'tipos de vehículo', nuevo: 'Nuevo tipo' }} icon={<Icon className="i" />} api={API}
        actions={i => [{ label: 'Descripciones del DNRPA', icon: <ListChecks className="i" />, onClick: () => setTarget({ id: i.id, name: i.name, fresh: false }) }]}
        onCreated={res => res?.data?.id && setTarget({ id: res.data.id, name: res.data.name, fresh: true })} />
      <Shown when={target}>{t => <DescriptionsDrawer target={t} onClose={() => setTarget(null)} />}</Shown>
    </>
  );
}

// RA-26: qué descripciones del DNRPA van a este tipo. Al guardar se reasignan sus modelos y la copia del tipo en sus vehículos;
// las que se destildan vuelven a la sugerencia automática. Con reservas activas de esos vehículos no se puede (409).
function DescriptionsDrawer({ target, onClose }: { target: Target; onClose: () => void }) {
  const toast = useToast();
  const [list, setList] = useState<TypeDescription[] | null>(null);
  const [loadErr, setLoadErr] = useState(false);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [blocked, setBlocked] = useState<DescriptionChange['reservations'] | null>(null);
  const [review, setReview] = useState<DescriptionChange | null>(null);

  const load = () => {
    setLoadErr(false);
    getTypeDescriptions(target.id)
      .then(l => { setList(l); setSel(new Set(l.filter(d => d.assigned || (target.fresh && d.suggested)).map(d => d.key))); })
      .catch(() => setLoadErr(true));
  };
  useEffect(load, [target.id]);

  const toggle = (key: string) => { setBlocked(null); setSel(s => { const n = new Set(s); if (n.has(key)) n.delete(key); else n.add(key); return n; }); };
  const fail = (x: any) => {
    const reservations = x?.response?.status === 409 ? x.response.data?.details?.reservations : undefined;
    if (reservations?.length) setBlocked(reservations); else toast(apiError(x, 'No se pudo guardar. Intentá de nuevo.'), 'err');
  };
  // Primero la vista previa: si hay reservas activas se muestran; si no, se confirma con lo que se mueve.
  const save = async () => {
    setBusy(true);
    try {
      const dry = await setTypeDescriptions(target.id, [...sel], true);
      if (dry.reservations.length) setBlocked(dry.reservations);
      else if (!dry.descriptions) { toast('No hay cambios para guardar.', 'info'); onClose(); }
      else setReview(dry);
    } catch (x) { fail(x); } finally { setBusy(false); }
  };
  const apply = async () => {
    setReview(null); setBusy(true);
    try {
      const done = await setTypeDescriptions(target.id, [...sel], false);
      invalidateVehicleTypes();
      toast(`Descripciones de ${target.name} guardadas: ${plural(done.models, 'modelo reasignado', 'modelos reasignados')}.`);
      onClose();
    } catch (x) { fail(x); } finally { setBusy(false); }
  };

  const term = q.trim().toUpperCase();
  const shown = (list ?? []).filter(d => !term || d.description.toUpperCase().includes(term));
  const when = (iso: string) => new Date(iso).toLocaleString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  let body;
  if (loadErr) body = <ErrorBox what="las descripciones" onRetry={load} />;
  else if (!list) body = <SkeletonRows n={4} cols={1} />;
  else if (!list.length) body = <p className="ctx">Todavía no hay descripciones del DNRPA: se cargan al actualizar el catálogo con el CSV.</p>;
  else body = (<>
    <div className="search"><Search className="i" /><input className="inp" type="search" placeholder="Buscar descripción (PICK-UP, FURGON…)" aria-label="Buscar descripción" value={q} onChange={e => setQ(e.target.value)} data-first /></div>
    {!shown.length ? <p className="ctx">Ninguna descripción coincide con “{q}”.</p> : (
      <div className="optlist" role="group" aria-label={`Descripciones del DNRPA de ${target.name}`}>
        {shown.map(d => {
          const checked = sel.has(d.key);
          return (
            <button key={d.key} type="button" role="checkbox" aria-checked={checked} className="opt" onClick={() => toggle(d.key)}>
              <span className="grow">
                {d.description}
                <small>{plural(d.models, 'modelo', 'modelos')} · hoy: {typeLabel(d.vehicleType.name)}</small>
              </span>
              {d.suggested && <span className="tag">Sugerida</span>}
              {checked && <Check className="i" aria-hidden="true" />}
            </button>
          );
        })}
      </div>
    )}
  </>);

  return (
    <>
      <Drawer title="Descripciones del DNRPA" sub={target.name} onClose={onClose} focusSel="[data-first]"
        footer={<div className="dfoot"><button type="button" className="btn" onClick={onClose}>Cancelar</button>
          <button type="button" className="btn pri" onClick={save} aria-busy={busy} disabled={busy || !list}>Guardar</button></div>}>
        <div className="dbody">
          <section className="fs">
            <p className="ctx" style={{ margin: 0 }}>Los modelos de las descripciones tildadas pasan a {target.name}, y también sus vehículos. Las que destildes vuelven al tipo sugerido.{target.fresh && ' Tildamos las que contienen el nombre del tipo.'}</p>
            {blocked && (
              <div className="list" role="alert">
                <div className="li"><span className="st warn"><AlertTriangle className="i sm" />Todavía no se puede cambiar</span></div>
                <p className="ad" style={{ margin: 0 }}>Estas reservas activas son de vehículos de esos modelos: su plaza es del tipo actual. Reintentá cuando terminen o se cancelen.</p>
                {blocked.map(r => <div className="li" key={r.code}><span>{r.code} · {r.plate}</span><span className="ad">{r.parking} · {when(r.startTime)}</span></div>)}
              </div>
            )}
            {body}
          </section>
        </div>
      </Drawer>
      <Shown when={review}>{review => <ConfirmModal title={`¿Guardar las descripciones de ${target.name}?`}
        body={`Cambian de tipo ${plural(review.descriptions, 'descripción', 'descripciones')}: ${plural(review.models, 'modelo', 'modelos')} y ${plural(review.vehicles, 'vehículo registrado', 'vehículos registrados')}.`}
        ok="Guardar" back="Volver" onConfirm={apply} onClose={() => setReview(null)} />}</Shown>
    </>
  );
}
