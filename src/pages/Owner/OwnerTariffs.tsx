import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertTriangle, Check, DollarSign, Pause, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import { Empty, ErrorBox, PageHead, SkeletonRows } from '../../components/Owner/ui/Page';
import { apiError } from '../../components/Owner/ui/Field';
import { useToast } from '../../components/Owner/ui/Toasts';
import { createParkingPrice, deleteParkingPrice } from '../../services/parking.service';
import type { Parking } from '../../types/parking.types';
import { useOwner } from './OwnerContext';
import { iconOf } from '../../components/Owner/ui/vehicles';
import { capOf, missing, money, priceOf, typeLabel, typePlural, typesAcross, type TypeRef } from './owner.lib';

export default function OwnerTariffs() {
  const { parkings, status, refresh } = useOwner();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const hl = params.get('p');
  // R-30: una columna por cada tipo con plazas o tarifa en alguna sucursal (AUTO, MOTO, CAMIONETA y los que agregue el administrador).
  const types = typesAcross(parkings);

  let body;
  if (status === 'error') body = <ErrorBox what="las tarifas" onRetry={refresh} />;
  else if (status === 'loading') body = <SkeletonRows n={4} />;
  else if (!parkings.length) body = (
    <Empty icon={<DollarSign className="i" />} title="No hay sucursales para tarificar"
      action={<button type="button" className="btn pri" onClick={() => navigate('/owner?new=1')}><Plus className="i sm" />Registrar sucursal</button>}>
      Primero registrá una sucursal; después podrás fijar el valor por hora de cada tipo de vehículo.
    </Empty>);
  else body = (
    <div className="panel tw"><table className="tbl tf">
      <colgroup><col style={{ width: '25%' }} />{types.map(t => <col key={t.id} style={{ width: `${60 / types.length}%` }} />)}<col style={{ width: '15%' }} /></colgroup>
      <thead><tr><th>Sucursal</th>{types.map(t => { const I = iconOf(t.name); return <th key={t.id}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><I className="i sm" />{typeLabel(t.name)} · por hora</span></th>; })}<th>Estado</th></tr></thead>
      <tbody>{parkings.map(p => (
        <tr key={p.id} className={hl === p.id ? 'hl' : ''}>
          <td><span className="nm">{p.name}</span><div className="ad">{p.address}</div></td>
          {types.map(t => <TariffCell key={t.id} p={p} t={t} />)}
          <td data-label="Estado">{!p.isActive ? <span className="st mute"><Pause className="i sm" />Pausada</span>
            : missing(p).length ? <span className="st warn"><AlertTriangle className="i sm" />Falta tarifa</span>
              : <span className="st ok"><Check className="i sm" />Operativa</span>}</td>
        </tr>
      ))}</tbody>
    </table></div>
  );

  return (
    <>
      <PageHead title="Tarifas" sub="Valor por hora por tipo de vehículo." />
      {body}
      <p className="ctx">Los tipos sin plazas en la sucursal no admiten tarifa. Para otro tipo de vehículo, agregá plazas de ese tipo en Plazas.</p>
    </>
  );
}

// Celda editable en línea: "+ Asignar", precio con lápiz implícito, o input con guardar/cancelar.
function TariffCell({ p, t: type }: { p: Parking; t: TypeRef }) {
  const { refresh } = useOwner();
  const toast = useToast();
  const t = { n: typeLabel(type.name), pl: typePlural(type.name) };
  const price = priceOf(p, type.id);
  const [edit, setEdit] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);
  const aria = `${t.n} en ${p.name}`;

  if (!capOf(p, type.id)) return <td data-label={t.n}><span className="na" title={`La sucursal no tiene plazas de ${t.pl.toLowerCase()}`}>—<span className="sr"> Sin plazas de este tipo</span></span></td>;

  const save = async () => {
    const n = Number(String(edit).replace(/\D/g, ''));
    if (!n || n <= 0) return setErr('Ingresá un valor mayor a 0.');
    if (price && Number(price.price) === n) return setEdit(null); // sin cambios: no hay nada que guardar
    setSaving(true);
    try {
      await createParkingPrice(p.id, { vehicleTypeId: type.id, price: n }); // versiona: expira la tarifa anterior
      await refresh();
      setEdit(null);
      toast(`Tarifa de ${t.pl.toLowerCase()} en ${p.name}: ${money(n)}/h.`);
    } catch (x) { setErr(apiError(x)); } finally { setSaving(false); }
  };
  const del = async () => {
    if (!price) return;
    try {
      await deleteParkingPrice(price.id);
      await refresh();
      toast(`Tarifa de ${t.pl.toLowerCase()} eliminada en ${p.name}.`, 'info');
    } catch (x) { toast(apiError(x), 'err'); }
  };

  if (saving) return <td data-label={t.n}><span className="ctx"><RefreshCw className="i sm spin" /> Guardando…</span></td>;
  if (edit !== null) return (
    <td data-label={t.n}>
      {/* Click o foco fuera de la celda: se cancela, como con Escape. Los botones no roban el foco para que su click llegue. */}
      <div className="inl" onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) { setEdit(null); setErr(''); } }}>
        <span className="cur">$</span>
        <input className="inp" inputMode="numeric" autoComplete="off" autoFocus aria-label={`Tarifa por hora, ${aria}`} aria-invalid={!!err}
          value={edit} onChange={e => { setEdit(e.target.value); setErr(''); }}
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEdit(null); }} />
        <button type="button" className="icon-btn sm pri" aria-label="Guardar tarifa" onMouseDown={e => e.preventDefault()} onClick={save}><Check className="i sm" /></button>
        <button type="button" className="icon-btn sm" aria-label="Cancelar" onMouseDown={e => e.preventDefault()} onClick={() => setEdit(null)}><X className="i sm" /></button>
      </div>
      {err && <div className="ferr" role="alert">{err}</div>}
    </td>
  );
  return price
    ? <td data-label={t.n}><div className="pv">
      <button type="button" className="pbtn" aria-label={`Editar tarifa, ${aria}`} onClick={() => setEdit(String(price.price))}>{money(price.price)}<small>/h</small></button>
      <button type="button" className="icon-btn sm del" aria-label={`Eliminar tarifa, ${aria}`} onClick={del}><Trash2 className="i sm" /></button>
    </div></td>
    : <td data-label={t.n}><button type="button" className="assign" aria-label={`Asignar tarifa, ${aria}`} onClick={() => setEdit('')}>+ Asignar</button></td>;
}
