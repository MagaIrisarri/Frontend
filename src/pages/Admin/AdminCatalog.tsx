import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { MoreVertical, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { Drawer, ConfirmModal } from '../../components/Owner/ui/Layer';
import { Shown } from '../../components/Owner/ui/Presence';
import { Empty, ErrorBox, PageHead, SkeletonRows } from '../../components/Owner/ui/Page';
import { Input, apiError } from '../../components/Owner/ui/Field';
import { Menu } from '../../components/Owner/ui/Menu';
import { useToast } from '../../components/Owner/ui/Toasts';
import { plural } from '../Owner/owner.lib';

export interface CatalogItem { id: string; name: string; description?: string; locked?: boolean } // locked: sin editar ni eliminar
type Values = { name: string; description: string };

// Lista del catálogo general (tipos de vehículo, servicios, seguros, marcas), con los patrones del panel del dueño.
// Cada acción aparece solo si se pasa su función en `api`: sin create no hay alta, sin update/remove no hay menú.
// `actions`: acciones propias de la pantalla en el menú de cada fila (también en las bloqueadas); `onCreated`: el ítem recién creado.
export interface CatalogAction { label: string; icon: ReactNode; onClick: () => void }
export default function AdminCatalog({ title, sub, noun, icon, withDescription, api, actions, onCreated }: {
  title: string;
  sub: string;
  noun: { one: string; many: string; nuevo: string }; // "tipo de vehículo", "tipos de vehículo", "Nuevo tipo"
  icon: ReactNode;
  withDescription?: boolean;
  api: {
    list: () => Promise<any>;
    create?: (v: Values) => Promise<unknown>;
    update?: (id: string, v: Values) => Promise<unknown>;
    remove?: (id: string) => Promise<unknown>;
  };
  actions?: (item: CatalogItem) => CatalogAction[];
  onCreated?: (created: any) => void;
}) {
  const toast = useToast();
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [q, setQ] = useState('');
  const [form, setForm] = useState<CatalogItem | 'new' | null>(null);
  const [del, setDel] = useState<CatalogItem | null>(null);
  const hasMenu = !!(api.update || api.remove || actions);
  const newBtn = api.create && <button type="button" className="btn pri" onClick={() => setForm('new')}><Plus className="i sm" />{noun.nuevo}</button>;

  const load = useCallback(async () => {
    try {
      const x = await api.list();
      setItems(Array.isArray(x) ? x : x?.data ?? []);
      setStatus('ready');
    } catch { setStatus('error'); }
  }, [api]);
  useEffect(() => { load(); }, [load]);

  const remove = async () => {
    const it = del!;
    setDel(null);
    try {
      await api.remove!(it.id);
      await load();
      toast(`“${it.name}” eliminado.`, 'info');
    } catch (x) { toast(apiError(x, 'No se pudo eliminar. Intentá de nuevo.'), 'err'); }
  };

  const term = q.trim().toLowerCase();
  const shown = items.filter(i => !term || (i.name + ' ' + (i.description ?? '')).toLowerCase().includes(term))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));

  let body;
  if (status === 'error') body = <ErrorBox what={`los ${noun.many}`} onRetry={load} />;
  else if (status === 'loading') body = <SkeletonRows n={4} cols={2} />;
  else if (!items.length) body = (
    <Empty icon={icon} title={`Todavía no hay ${noun.many}`} action={newBtn}>
      {api.create ? 'Cargá el primero para que esté disponible en todas las sucursales.' : undefined}
    </Empty>);
  else if (!shown.length) body = (
    <Empty icon={<Search className="i" />} title="Sin resultados" action={<button type="button" className="btn" onClick={() => setQ('')}>Limpiar búsqueda</button>}>
      Ningún {noun.one} coincide con “{q}”.
    </Empty>);
  else body = (
    <div className="panel tw"><table className="tbl">
      <colgroup><col />{hasMenu && <col style={{ width: 64 }} />}</colgroup>
      <thead><tr><th>Nombre</th>{hasMenu && <th><span className="sr">Acciones</span></th>}</tr></thead>
      <tbody>{shown.map(i => (
        <tr key={i.id}>
          <td><span className="nm">{i.name}</span>{i.description && <div className="ad">{i.description}</div>}</td>
          {hasMenu && <td className="r"><div className="acts">
            {(!i.locked || !!actions?.(i).length) && <Menu label={`Más acciones de ${i.name}`} button={<MoreVertical className="i" />} items={[
              ...(actions?.(i) ?? []),
              ...(!i.locked && api.update ? [{ label: 'Editar', icon: <Pencil className="i" />, onClick: () => setForm(i) }] : []),
              ...(!i.locked && api.remove ? [{ label: 'Eliminar', icon: <Trash2 className="i" />, danger: true, sep: !!api.update || !!actions, onClick: () => setDel(i) }] : []),
            ]} />}
          </div></td>}
        </tr>
      ))}</tbody>
    </table></div>
  );

  return (
    <>
      <PageHead title={title} sub={status === 'ready' && items.length ? `${sub} ${plural(items.length, noun.one, noun.many)}.` : sub}
        actions={status === 'ready' && items.length > 0 && newBtn} />
      {status === 'ready' && items.length > 0 && (
        <div className="toolbar">
          <div className="search"><Search className="i" /><input className="inp" type="search" placeholder="Buscar por nombre" aria-label="Buscar por nombre" value={q} onChange={e => setQ(e.target.value)} /></div>
        </div>
      )}
      {body}
      <Shown when={form}>{form => <ItemDrawer item={form === 'new' ? null : form} noun={noun} withDescription={withDescription} api={api}
        onSaved={async (msg, created) => { setForm(null); await load(); toast(msg); if (created) onCreated?.(created); }} onClose={() => setForm(null)} />}</Shown>
      <Shown when={del}>{del => <ConfirmModal title={`¿Eliminar “${del.name}”?`} body={`Deja de estar disponible para elegir. Lo que ya lo usa no cambia.`}
        ok="Eliminar" back="Volver" danger onConfirm={remove} onClose={() => setDel(null)} />}</Shown>
    </>
  );
}

function ItemDrawer({ item, noun, withDescription, api, onSaved, onClose }: {
  item: CatalogItem | null; noun: { one: string; nuevo: string }; withDescription?: boolean;
  api: { create?: (v: Values) => Promise<unknown>; update?: (id: string, v: Values) => Promise<unknown> };
  onSaved: (msg: string, created?: unknown) => void; onClose: () => void;
}) {
  const [v, setV] = useState<Values>({ name: item?.name ?? '', description: item?.description ?? '' });
  const [err, setErr] = useState<Partial<Values> & { general?: string }>({});
  const [busy, setBusy] = useState(false);

  // Anticipa las reglas del backend (VehicleType.Schema.ts y ServiceCatalog.Schema.ts).
  const save = async (e: FormEvent) => {
    e.preventDefault();
    const er: typeof err = {};
    if (v.name.trim().length < 2) er.name = 'Ingresá un nombre de al menos 2 caracteres.';
    if (withDescription && v.description.trim().length < 5) er.description = 'Ingresá una descripción de al menos 5 caracteres.';
    setErr(er);
    if (Object.keys(er).length) return;
    const data = { name: v.name.trim(), description: v.description.trim() };
    setBusy(true);
    try {
      const res = item ? await api.update!(item.id, data) : await api.create!(data);
      onSaved(item ? `“${data.name}” actualizado.` : `“${data.name}” creado.`, item ? undefined : res);
    } catch (x) { setErr({ general: apiError(x) }); setBusy(false); }
  };
  const set = (k: keyof Values) => (e: { target: { value: string } }) => { setV(s => ({ ...s, [k]: e.target.value })); setErr(s => ({ ...s, [k]: undefined, general: undefined })); };

  return (
    <Drawer title={item ? `Editar ${noun.one}` : noun.nuevo} sub={item?.name} onClose={onClose}
      footer={<div className="dfoot"><button type="button" className="btn" onClick={onClose}>Cancelar</button><button className="btn pri" type="submit" form="cform" aria-busy={busy} disabled={busy}>{item ? 'Guardar cambios' : 'Crear'}</button></div>}>
      <form id="cform" noValidate className="dbody" onSubmit={save}>
        <section className="fs">
          <Input label="Nombre" maxLength={50} autoComplete="off" value={v.name} onChange={set('name')} error={err.name} data-first />
          {withDescription && <Input label="Descripción" maxLength={200} autoComplete="off" value={v.description} onChange={set('description')} error={err.description} />}
          {err.general && <div className="ferr" role="alert">{err.general}</div>}
        </section>
      </form>
    </Drawer>
  );
}
