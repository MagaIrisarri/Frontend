import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Empty, ErrorBox, PageHead, SkeletonRows } from '../../components/Owner/ui/Page';
import CatalogImport from '../../components/Admin/CatalogImport';
import { getBrands, getModels } from '../../services/vehicle.service';
import { matchesQuery } from '../../utils/search';
import { cap, plural } from '../Owner/owner.lib';
import type { Brand, Model } from '../../types/vehicle.types';

const TYPE_ORDER = ['AUTO', 'CAMIONETA', 'MOTO'];
const asList = <T,>(x: any): T[] => (Array.isArray(x) ? x : x?.data ?? []);

// Solo lectura (RA-11): marcas con sus modelos agrupados por tipo. El catálogo solo se amplía con el CSV del DNRPA (RA-14).
export default function AdminBrands() {
  const [tab, setTab] = useState<'cat' | 'csv'>('cat');
  const [reloads, setReloads] = useState(0);
  return (
    <>
      <PageHead title="Marcas y modelos" sub="Marcas y modelos disponibles al registrar un vehículo." />
      <div className="seg" role="group" aria-label="Sección" style={{ justifySelf: 'start' }}>
        {([['cat', 'Catálogo'], ['csv', 'Actualizar con CSV']] as const).map(([k, l]) => (
          <button type="button" key={k} aria-pressed={tab === k} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>
      {tab === 'cat' ? <Catalog key={reloads} /> : <CatalogImport onDone={() => { setReloads(n => n + 1); setTab('cat'); }} />}
    </>
  );
}

function Catalog() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [q, setQ] = useState('');
  const [brand, setBrand] = useState<Brand | null>(null);

  const load = useCallback(async () => {
    setStatus('loading');
    try { setBrands(asList<Brand>(await getBrands()).sort((a, b) => a.name.localeCompare(b.name, 'es'))); setStatus('ready'); }
    catch { setStatus('error'); }
  }, []);
  useEffect(() => { load(); }, [load]);

  if (status === 'error') return <ErrorBox what="las marcas" onRetry={load} />;
  if (status === 'loading') return <SkeletonRows n={6} cols={2} />;
  if (!brands.length) return <Empty icon={<Search className="i" />} title="Todavía no hay marcas">Cargalas desde la pestaña “Actualizar con CSV”.</Empty>;

  const shown = brands.filter(b => matchesQuery(q, b.name));
  return (
    <div className="split">
      <section className="panel side" aria-label="Marcas">
        <div className="search"><Search className="i" /><input className="inp" type="search" placeholder="Buscar marca" aria-label="Buscar marca" autoComplete="off" value={q} onChange={e => setQ(e.target.value)} /></div>
        <div className="bl">
          {shown.length
            ? shown.map(b => <button type="button" key={b.id} className="bi" aria-current={brand?.id === b.id} onClick={() => setBrand(b)}>{b.name}</button>)
            : <p className="ad" style={{ padding: '8px 12px' }}>Ninguna marca coincide.</p>}
        </div>
      </section>
      <section className="panel main" aria-label="Modelos de la marca" aria-live="polite">
        {brand ? <Models key={brand.id} brand={brand} /> : <Empty icon={<Search className="i" />} title="Elegí una marca">Mirá sus modelos agrupados por tipo de vehículo.</Empty>}
      </section>
    </div>
  );
}

function Models({ brand }: { brand: Brand }) {
  const [models, setModels] = useState<Model[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [type, setType] = useState('all');
  const [q, setQ] = useState('');

  const load = useCallback(async () => {
    setStatus('loading');
    try { setModels(asList<Model>(await getModels(brand.id))); setStatus('ready'); }
    catch { setStatus('error'); }
  }, [brand.id]);
  useEffect(() => { load(); }, [load]);

  const typeOf = (m: Model) => m.vehicleType?.name.toUpperCase() ?? 'SIN TIPO';
  const types = useMemo(() => [...new Set(models.map(typeOf))].sort((a, b) => (TYPE_ORDER.indexOf(a) + 1 || 99) - (TYPE_ORDER.indexOf(b) + 1 || 99) || a.localeCompare(b)), [models]);
  const found = models.filter(m => matchesQuery(q, m.name));
  const groups = types.filter(t => type === 'all' || t === type).map(t => [t, found.filter(m => typeOf(m) === t).sort((a, b) => a.name.localeCompare(b.name, 'es'))] as const).filter(g => g[1].length);

  if (status === 'error') return <ErrorBox what={`los modelos de ${brand.name}`} onRetry={load} />;
  if (status === 'loading') return <SkeletonRows n={5} cols={1} />;
  return (
    <>
      <div className="mhead">
        <div><h2>{brand.name}</h2><div className="ad">{plural(models.length, 'modelo', 'modelos')}</div></div>
      </div>
      {models.length > 0 && (
        <div className="mtools">
          <div className="search"><Search className="i" /><input className="inp" type="search" placeholder="Buscar modelo" aria-label="Buscar modelo" autoComplete="off" value={q} onChange={e => setQ(e.target.value)} /></div>
          {types.length > 1 && (
            <div className="seg" role="group" aria-label="Filtrar por tipo de vehículo">
              {['all', ...types].map(t => (
                <button type="button" key={t} aria-pressed={type === t} onClick={() => setType(t)}>
                  {t === 'all' ? 'Todos' : cap(t.toLowerCase())}<b>{t === 'all' ? found.length : found.filter(m => typeOf(m) === t).length}</b>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      {!models.length ? <p className="ad">{brand.name} todavía no tiene modelos cargados.</p>
        : !groups.length ? <p className="ad">Ningún modelo coincide con la búsqueda.</p>
        : <div className="mscroll">{groups.map(([t, list]) => (
            <div key={t}>
              <div className="gh"><span>{cap(t.toLowerCase())}</span><b>{list.length}</b></div>
              {list.map(m => <div className="mr" key={m.id}>{m.name}</div>)}
            </div>
          ))}</div>}
    </>
  );
}
