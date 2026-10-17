import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Layers, Pencil, Plus, Trash2, X } from 'lucide-react';
import { Empty, ErrorBox, PageHead } from '../../components/Owner/ui/Page';
import { apiError } from '../../components/Owner/ui/Field';
import { useToast } from '../../components/Owner/ui/Toasts';
import { ParkingPicker } from '../../components/Owner/ui/ParkingPicker';
import { createServicePrice, deleteServicePrice, getServiceCatalog, getServicePrices } from '../../services/servicePrice.service';
import { useActiveParking, useOwner } from './OwnerContext';
import { money, parsePesos, pesosTyping, plural } from './owner.lib';

interface Svc { id: string; price: number; serviceCatalog: { id: string; name: string; description?: string } }
interface Cat { id: string; name: string; description?: string }

export default function OwnerServices() {
  const { parkings, status, refresh } = useOwner();
  const { parking: p, select } = useActiveParking();
  const pid = p?.id;
  const navigate = useNavigate();
  const toast = useToast();
  const [catalog, setCatalog] = useState<Cat[] | null>(null); // null: cargando
  const [catErr, setCatErr] = useState(false);
  const [list, setList] = useState<Svc[] | null>(null);
  const [listErr, setListErr] = useState(false);
  const [cat, setCat] = useState('');
  const [price, setPrice] = useState('');
  const [err, setErr] = useState('');
  const [edit, setEdit] = useState<{ id: string; v: string; err: string } | null>(null);

  const loadCatalog = useCallback(() => {
    setCatalog(null); setCatErr(false);
    getServiceCatalog().then(setCatalog).catch(() => { setCatalog([]); setCatErr(true); });
  }, []);
  useEffect(() => { loadCatalog(); }, [loadCatalog]);
  // Solo la última carga escribe: al cambiar rápido de sucursal, una respuesta atrasada de la anterior se descarta.
  const req = useRef(0);
  const load = useCallback(async () => {
    if (!pid) return;
    const n = ++req.current;
    setList(null); setListErr(false); setEdit(null);
    try {
      const l: Svc[] = await getServicePrices(pid);
      if (n === req.current) setList(l);
    } catch { if (n === req.current) setListErr(true); }
  }, [pid]);
  useEffect(() => { load(); }, [load]);

  const used = new Set((list ?? []).map(s => s.serviceCatalog.id));
  const avail = (catalog ?? []).filter(c => !used.has(c.id));
  const catSel = avail.some(c => c.id === cat) ? cat : avail[0]?.id ?? '';

  const assign = async (e: FormEvent) => {
    e.preventDefault();
    const n = parsePesos(price);
    if (typeof n === 'string') return setErr(n);
    try {
      await createServicePrice(pid!, { serviceCatalogId: catSel, price: n });
      setPrice(''); setErr('');
      await load();
      toast(`${catalog?.find(c => c.id === catSel)?.name} asignado a ${p!.name}.`);
    } catch (x) { setErr(apiError(x)); }
  };
  const savePrice = async (s: Svc) => {
    const n = parsePesos(edit!.v);
    if (typeof n === 'string') return setEdit({ ...edit!, err: n });
    try {
      await createServicePrice(pid!, { serviceCatalogId: s.serviceCatalog.id, price: n }); // reemplaza el precio activo
      setEdit(null);
      await load();
      toast(`Precio de ${s.serviceCatalog.name}: ${money(n)}.`);
    } catch (x) { setEdit({ ...edit!, err: apiError(x) }); }
  };
  // Sin confirmación previa: se puede deshacer, y vuelve a asignarse con el mismo precio (R-24 ya rechaza quitarlo con reservas activas).
  const remove = async (s: Svc) => {
    const where = { id: pid!, name: p!.name };
    try {
      await deleteServicePrice(s.id);
      await load();
      toast(`${s.serviceCatalog.name} quitado de ${where.name}.`, 'info', async () => {
        try {
          await createServicePrice(where.id, { serviceCatalogId: s.serviceCatalog.id, price: Number(s.price) });
          await load();
          toast(`${s.serviceCatalog.name} vuelve a ${where.name} a ${money(Number(s.price))}.`);
        } catch (x) { toast(apiError(x), 'err'); }
      });
    } catch (x) { toast(apiError(x), 'err'); }
  };

  let form;
  if (catErr) form = <ErrorBox what="el catálogo de servicios" onRetry={loadCatalog} />;
  else if (catalog && !catalog.length) form = <p className="ctx">El catálogo está vacío; lo carga el administrador.</p>;
  else form = (
    <form className="addrow" noValidate onSubmit={assign}>
      <div className="field"><label htmlFor="sc">Servicio del catálogo</label>
        <select className="sel" id="sc" disabled={!avail.length} value={catSel} onChange={e => setCat(e.target.value)}>
          {catalog === null || list === null ? <option>Cargando…</option>
            : avail.length ? avail.map(c => <option key={c.id} value={c.id}>{c.name}</option>) : <option>Ya asignaste todo el catálogo</option>}
        </select></div>
      <div className="field"><label htmlFor="sp">Precio</label>
        <div className="price-in"><span>$</span><input className="inp" id="sp" inputMode="numeric" placeholder="0" autoComplete="off" disabled={!avail.length}
          aria-invalid={!!err} aria-describedby={err ? 'sp-e' : undefined} value={price} onChange={e => { setPrice(e.target.value); setErr(pesosTyping(e.target.value)); }} /></div></div>
      <button type="submit" className="btn pri" disabled={!avail.length}><Plus className="i sm" />Asignar</button>
      {err && <div className="ferr" id="sp-e" style={{ gridColumn: '1/-1' }} role="alert">{err}</div>}
    </form>
  );

  let assigned;
  if (listErr) assigned = <ErrorBox what="los servicios de la sucursal" onRetry={load} />;
  else if (list === null) assigned = <span className="sk" style={{ height: 44 }} />;
  else if (!list.length) assigned = (
    <div className="empty inset"><div className="ico"><Layers className="i" /></div><h3>Sin servicios adicionales</h3>
      <p>Sumá lavado, carga eléctrica u otros servicios del catálogo para ofrecerlos en esta sucursal.</p></div>);
  else assigned = (
    <div className="list">{list.map(s => (
      <div className="li" key={s.id}>
        <div className="l"><div style={{ minWidth: 0 }}><div className="nm">{s.serviceCatalog.name}</div><div className="sd">{s.serviceCatalog.description}</div></div></div>
        {edit?.id === s.id ? (
          <div>
            <div className="inl"><span className="cur">$</span>
              <input className="inp" inputMode="numeric" autoFocus aria-label={`Precio de ${s.serviceCatalog.name}`} aria-invalid={!!edit.err} value={edit.v}
                onChange={e => setEdit({ id: s.id, v: e.target.value, err: pesosTyping(e.target.value) })}
                onKeyDown={e => { if (e.key === 'Enter') savePrice(s); if (e.key === 'Escape') setEdit(null); }} />
              <button type="button" className="icon-btn sm pri" aria-label="Guardar precio" onClick={() => savePrice(s)}><Check className="i sm" /></button>
              <button type="button" className="icon-btn sm" aria-label="Cancelar" onClick={() => setEdit(null)}><X className="i sm" /></button>
            </div>
            {edit.err && <div className="ferr" role="alert">{edit.err}</div>}
          </div>
        ) : (
          <div className="acts"><b style={{ marginRight: 8 }}>{money(s.price)}</b>
            <button type="button" className="icon-btn sm" aria-label={`Editar precio de ${s.serviceCatalog.name}`} onClick={() => setEdit({ id: s.id, v: String(s.price), err: '' })}><Pencil className="i sm" /></button>
            <button type="button" className="icon-btn sm" aria-label={`Quitar ${s.serviceCatalog.name}`} onClick={() => remove(s)}><Trash2 className="i sm" /></button>
          </div>
        )}
      </div>
    ))}</div>
  );

  let body;
  if (status === 'error') body = <ErrorBox what="las sucursales" onRetry={refresh} />;
  else if (status === 'loading') body = <div className="panel dpanel"><span className="sk" style={{ height: 44 }} /></div>;
  else if (!p) body = (
    <Empty icon={<Layers className="i" />} title="No hay sucursales"
      action={<button type="button" className="btn pri" onClick={() => navigate('/owner?new=1')}><Plus className="i sm" />Registrar sucursal</button>}>
      Los servicios adicionales se asignan a cada sucursal. Registrá una para empezar.
    </Empty>);
  else body = (
    <section className="panel dpanel" aria-label={`Servicios de ${p.name}`}>
      <div className="head"><div><h2>{p.name}</h2><p className="sub">{list?.length ? plural(list.length, 'servicio asignado', 'servicios asignados') : 'Sin servicios adicionales'}</p></div></div>
      {form}
      {assigned}
    </section>
  );

  return (
    <>
      <PageHead title="Servicios" sub="Asigná servicios del catálogo a cada sucursal y definí su precio."
        actions={p && <ParkingPicker parkings={parkings} value={p.id} onChange={select} />} />
      {body}
    </>
  );
}
