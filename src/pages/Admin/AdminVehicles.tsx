import { createElement, useCallback, useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { Drawer } from '../../components/Owner/ui/Layer';
import { Shown } from '../../components/Owner/ui/Presence';
import { Empty, ErrorBox, PageHead, SkeletonRows } from '../../components/Owner/ui/Page';
import { FilterBar } from '../../components/Owner/ui/FilterBar';
import { VICON, iconOf } from '../../components/Owner/ui/vehicles';
import { getVehicles } from '../../services/vehicle.service';
import { matchesQuery } from '../../utils/search';
import { initials, plural, typeLabel, typePlural } from '../Owner/owner.lib';

interface Client { id: string; name: string; last_name: string; dni?: string; email?: string; phone?: string }
interface V {
  id: string; plate: string; year?: number; color?: string | null;
  brand?: { name: string }; model?: { name: string }; vehicleType?: { name: string }; insurance?: { name: string } | null;
  client?: Client;
}
const fullName = (c?: Client) => (c ? `${c.name} ${c.last_name}` : '—');
const Car = VICON.AUTO;
const TypeCell = ({ name }: { name: string }) => <span className="cap">{createElement(iconOf(name), { className: 'i', 'aria-hidden': true })}{typeLabel(name)}</span>;

// Listado de vehículos registrados (alcance adicional del proposal): por tipo, con patente, marca, modelo y seguro → detalle del cliente.
export default function AdminVehicles() {
  const [list, setList] = useState<V[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [q, setQ] = useState('');
  const [ft, setFt] = useState('all');
  const [client, setClient] = useState<Client | null>(null);

  const load = useCallback(async () => {
    try {
      const x = await getVehicles();
      setList(Array.isArray(x) ? x : x?.data ?? []);
      setStatus('ready');
    } catch { setStatus('error'); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const types = [...new Set(list.map(v => v.vehicleType?.name).filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b, 'es'));
  // La patente se busca también sin espacios ("AB 123 CD"); el resto, con matchesQuery (sin tildes ni mayúsculas, todas las palabras).
  const plateQ = q.trim().toUpperCase().replace(/\s/g, '');
  const shown = list
    .filter(v => (ft === 'all' || v.vehicleType?.name === ft)
      && (!q.trim() || v.plate.toUpperCase().includes(plateQ) || matchesQuery(q, `${v.brand?.name ?? ''} ${v.model?.name ?? ''} ${fullName(v.client)}`)))
    .sort((a, b) => a.plate.localeCompare(b.plate));

  let body;
  if (status === 'error') body = <ErrorBox what="los vehículos" onRetry={load} />;
  else if (status === 'loading') body = <SkeletonRows n={6} cols={5} />;
  else if (!list.length) body = <Empty icon={<Car className="i" />} title="Todavía no hay vehículos">Los vehículos aparecen acá cuando los clientes los registran.</Empty>;
  else if (!shown.length) body = (
    <Empty icon={<Search className="i" />} title="Sin resultados"
      action={<button type="button" className="btn" onClick={() => { setQ(''); setFt('all'); }}>Limpiar filtros</button>}>
      Ningún vehículo coincide con los filtros actuales.
    </Empty>);
  else body = (
    <div className="panel tw"><table className="tbl">
      <colgroup><col style={{ width: 130 }} /><col /><col style={{ width: 120 }} /><col style={{ width: 170 }} /><col style={{ width: '24%' }} /></colgroup>
      <thead><tr><th>Patente</th><th>Marca y modelo</th><th>Tipo</th><th>Seguro</th><th>Cliente</th></tr></thead>
      <tbody>{shown.map(v => (
        <tr key={v.id}>
          <td><span className="plate">{v.plate}</span>{v.year && <div className="ad">{v.year}{v.color ? ` · ${v.color}` : ''}</div>}</td>
          <td data-label="Marca y modelo"><span className="nm">{v.brand?.name ?? '—'}</span><div className="ad">{v.model?.name ?? ''}</div></td>
          <td data-label="Tipo">{v.vehicleType ? <TypeCell name={v.vehicleType.name} /> : '—'}</td>
          <td data-label="Seguro">{v.insurance?.name ?? <span className="na">Sin seguro</span>}</td>
          <td data-label="Cliente">{v.client
            ? <button type="button" className="link" aria-label={`Ver datos de ${fullName(v.client)}`} onClick={() => setClient(v.client!)}>{fullName(v.client)}</button>
            : <span className="na">—</span>}</td>
        </tr>
      ))}</tbody>
    </table></div>
  );

  return (
    <>
      <PageHead title="Vehículos" sub={status === 'ready' ? `${plural(list.length, 'vehículo registrado', 'vehículos registrados')} por los clientes.` : 'Vehículos registrados por los clientes.'} />
      {status === 'ready' && list.length > 0 && (
        <FilterBar search={{ value: q, onChange: setQ, label: 'Buscar vehículo', placeholder: 'Buscar por patente, marca, modelo o cliente' }}
          active={!!q || ft !== 'all'} onClear={() => { setQ(''); setFt('all'); }}>
          {types.length > 1 && (
            <div className="seg" role="group" aria-label="Filtrar por tipo de vehículo">
              {[['all', 'Todos'], ...types.map(t => [t, typePlural(t)])].map(([k, l]) => (
                <button type="button" key={k} aria-pressed={ft === k} onClick={() => setFt(k)}>{l}<b>{list.filter(v => k === 'all' || v.vehicleType?.name === k).length}</b></button>
              ))}
            </div>
          )}
        </FilterBar>
      )}
      {body}
      <Shown when={client}>{client => (
        <Drawer title={fullName(client)} sub="Cliente" onClose={() => setClient(null)} footer={<div className="dfoot"><button type="button" className="btn" onClick={() => setClient(null)}>Cerrar</button></div>}>
          <div className="dbody">
            <div className="fs"><div className="li" style={{ padding: 0 }}><span className="l"><span className="av lg">{initials(client.name, client.last_name)}</span>
              <span><div className="nm">{fullName(client)}</div><div className="ad">{client.email}</div></span></span></div></div>
            <div className="fs"><div className="fh"><h3>Datos</h3></div>
              <dl className="dl" style={{ margin: 0 }}>
                <dt>DNI</dt><dd>{client.dni ?? '—'}</dd><dt>Email</dt><dd>{client.email ?? '—'}</dd><dt>Teléfono</dt><dd>{client.phone ?? '—'}</dd>
                <dt>Vehículos</dt><dd>{list.filter(v => v.client?.id === client.id).map(v => v.plate).join(', ')}</dd>
              </dl>
            </div>
          </div>
        </Drawer>
      )}</Shown>
    </>
  );
}
