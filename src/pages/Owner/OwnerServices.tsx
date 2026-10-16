import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, Layers, Pencil, Plus, Trash2, X } from 'lucide-react';
import { Empty, ErrorBox, PageHead } from '../../components/Owner/ui/Page';
import { apiError } from '../../components/Owner/ui/Field';
import { useToast } from '../../components/Owner/ui/Toasts';
import { createServicePrice, deleteServicePrice, getServiceCatalog, getServicePrices } from '../../services/servicePrice.service';
import { useOwner } from './OwnerContext';
import { money, plural } from './owner.lib';

interface Svc { id: string; price: number; serviceCatalog: { id: string; name: string; description?: string } }
interface Cat { id: string; name: string; description?: string }

export default function OwnerServices() {
  const { parkings, status, refresh } = useOwner();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const pid = parkings.find(p => p.id === params.get('p'))?.id ?? parkings[0]?.id;
  const p = parkings.find(x => x.id === pid);
  const [catalog, setCatalog] = useState<Cat[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [list, setList] = useState<Svc[] | null>(null);
  const [cat, setCat] = useState('');
  const [price, setPrice] = useState('');
  const [err, setErr] = useState('');
  const [edit, setEdit] = useState<{ id: string; v: string } | null>(null);

  useEffect(() => { getServiceCatalog().then(setCatalog).catch(() => setCatalog([])); }, []);
  useEffect(() => {
    Promise.all(parkings.map(x => getServicePrices(x.id).then((l: Svc[]) => [x.id, l.length] as const).catch(() => [x.id, 0] as const)))
      .then(e => setCounts(Object.fromEntries(e)));
  }, [parkings]);
  const load = useCallback(async () => {
    if (!pid) return;
    setList(null);
    const l: Svc[] = await getServicePrices(pid).catch(() => []);
    setList(l);
    setCounts(c => ({ ...c, [pid]: l.length }));
  }, [pid]);
  useEffect(() => { load(); }, [load]);

  const used = new Set((list ?? []).map(s => s.serviceCatalog.id));
  const avail = catalog.filter(c => !used.has(c.id));
  const catSel = avail.some(c => c.id === cat) ? cat : avail[0]?.id ?? '';

  const assign = async (e: FormEvent) => {
    e.preventDefault();
    const n = Number(price.replace(/\D/g, ''));
    if (!n) return setErr('Ingresá un precio mayor a 0.');
    try {
      await createServicePrice(pid!, { serviceCatalogId: catSel, price: n });
      setPrice(''); setErr('');
      await load();
      toast(`${catalog.find(c => c.id === catSel)?.name} asignado a ${p!.name}.`);
    } catch (x) { setErr(apiError(x)); }
  };
  const savePrice = async (s: Svc) => {
    const n = Number(edit!.v.replace(/\D/g, ''));
    if (!n) return toast('Ingresá un precio mayor a 0.', 'err');
    try {
      await createServicePrice(pid!, { serviceCatalogId: s.serviceCatalog.id, price: n }); // reemplaza el precio activo
      setEdit(null);
      await load();
      toast(`Precio de ${s.serviceCatalog.name}: ${money(n)}.`);
    } catch (x) { toast(apiError(x), 'err'); }
  };
  const remove = async (s: Svc) => {
    try {
      await deleteServicePrice(s.id);
      await load();
      toast(`${s.serviceCatalog.name} quitado de ${p!.name}.`, 'info');
    } catch (x) { toast(apiError(x), 'err'); }
  };

  let body;
  if (status === 'error') body = <ErrorBox what="los servicios" onRetry={refresh} />;
  else if (status === 'loading') body = <div className="md"><div className="panel mlist"><span className="sk" style={{ height: 38, margin: 4 }} /></div><div className="panel dpanel"><span className="sk" style={{ height: 44 }} /></div></div>;
  else if (!p) body = (
    <Empty icon={<Layers className="i" />} title="No hay sucursales"
      action={<button type="button" className="btn pri" onClick={() => navigate('/owner?new=1')}><Plus className="i sm" />Registrar sucursal</button>}>
      Los servicios adicionales se asignan a cada sucursal. Registrá una para empezar.
    </Empty>);
  else body = (
    <div className="md">
      <div className="panel mlist" role="list" aria-label="Sucursales">
        {parkings.map(x => (
          <button type="button" key={x.id} className="mitem" role="listitem" aria-current={x.id === p.id} onClick={() => setParams({ p: x.id })}>
            <span style={{ minWidth: 0 }}><span className="nm">{x.name}</span><span className="ad" style={{ display: 'block' }}>{x.address}</span></span>
            <span className="badge">{counts[x.id] ?? '…'}</span>
          </button>
        ))}
      </div>
      <section className="panel dpanel" aria-label={`Servicios de ${p.name}`}>
        <div className="head"><div><h2>{p.name}</h2><p className="sub">{list?.length ? plural(list.length, 'servicio asignado', 'servicios asignados') : 'Sin servicios adicionales'}</p></div></div>
        <form className="addrow" noValidate onSubmit={assign}>
          <div className="field"><label htmlFor="sc">Servicio del catálogo</label>
            <select className="sel" id="sc" disabled={!avail.length} value={catSel} onChange={e => setCat(e.target.value)}>
              {avail.length ? avail.map(c => <option key={c.id} value={c.id}>{c.name}</option>) : <option>Ya asignaste todo el catálogo</option>}
            </select></div>
          <div className="field"><label htmlFor="sp">Precio</label>
            <div className="price-in"><span>$</span><input className="inp" id="sp" inputMode="numeric" placeholder="0" autoComplete="off" disabled={!avail.length}
              aria-invalid={!!err} value={price} onChange={e => { setPrice(e.target.value); setErr(''); }} /></div></div>
          <button type="submit" className="btn pri" disabled={!avail.length}><Plus className="i sm" />Asignar</button>
          {err && <div className="ferr" style={{ gridColumn: '1/-1' }} role="alert">{err}</div>}
        </form>
        {list === null ? <span className="sk" style={{ height: 44 }} /> : list.length ? (
          <div className="list">{list.map(s => (
            <div className="li" key={s.id}>
              <div className="l"><div style={{ minWidth: 0 }}><div className="nm">{s.serviceCatalog.name}</div><div className="sd">{s.serviceCatalog.description}</div></div></div>
              {edit?.id === s.id ? (
                <div className="inl"><span className="cur">$</span>
                  <input className="inp" inputMode="numeric" autoFocus aria-label={`Precio de ${s.serviceCatalog.name}`} value={edit.v}
                    onChange={e => setEdit({ id: s.id, v: e.target.value })} onKeyDown={e => { if (e.key === 'Enter') savePrice(s); if (e.key === 'Escape') setEdit(null); }} />
                  <button type="button" className="icon-btn sm pri" aria-label="Guardar precio" onClick={() => savePrice(s)}><Check className="i sm" /></button>
                  <button type="button" className="icon-btn sm" aria-label="Cancelar" onClick={() => setEdit(null)}><X className="i sm" /></button>
                </div>
              ) : (
                <div className="acts"><b style={{ marginRight: 8 }}>{money(s.price)}</b>
                  <button type="button" className="icon-btn sm" aria-label={`Editar precio de ${s.serviceCatalog.name}`} onClick={() => setEdit({ id: s.id, v: String(s.price) })}><Pencil className="i sm" /></button>
                  <button type="button" className="icon-btn sm" aria-label={`Quitar ${s.serviceCatalog.name}`} onClick={() => remove(s)}><Trash2 className="i sm" /></button>
                </div>
              )}
            </div>
          ))}</div>
        ) : (
          <div className="empty" style={{ padding: '36px 0 20px' }}><div className="ico"><Layers className="i" /></div><h3>Sin servicios adicionales</h3>
            <p>Sumá lavado, carga eléctrica u otros servicios del catálogo para ofrecerlos en esta sucursal.</p></div>
        )}
      </section>
    </div>
  );

  return <><PageHead title="Servicios" sub="Asigná servicios del catálogo a cada sucursal y definí su precio." />{body}</>;
}
