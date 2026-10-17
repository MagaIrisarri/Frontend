import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle, Building2, CalendarDays, Check, DollarSign, Eye, LayoutGrid, Layers, Lock, MoreVertical,
  Pause, Pencil, Plus, Power, Search, Users,
} from 'lucide-react';
import { ConfirmModal, Drawer } from '../../components/Owner/ui/Layer';
import { Shown } from '../../components/Owner/ui/Presence';
import { Menu } from '../../components/Owner/ui/Menu';
import { Empty, ErrorBox, SkeletonRows } from '../../components/Owner/ui/Page';
import { apiError } from '../../components/Owner/ui/Field';
import { useToast } from '../../components/Owner/ui/Toasts';
import { deleteParking, reactivateParking } from '../../services/parking.service';
import { getServicePrices } from '../../services/servicePrice.service';
import type { Parking } from '../../types/parking.types';
import { useOwner } from './OwnerContext';
import ParkingDrawer from './ParkingDrawer';
import {
  capOf, svcOf, coverage, gapGroups, hrs, initials, issues, lvl, money, oc, occOf, pct, plural, priceOf, shiftsText, span, today, tot,
  typeLabel, typePlural, typesAcross, typesOf,
} from './owner.lib';

import { matchesQuery } from '../../utils/search';
import { iconOf } from '../../components/Owner/ui/vehicles';
type Filter = 'all' | 'ok' | 'alert' | 'paused';
// Localidad de una sucursal, con su provincia: hay localidades con el mismo nombre en distintas provincias.
const locOf = (p: Parking) => [p.locality, p.province].filter(Boolean).join(', ');

export function WarnBtn({ list }: { list: { l: string; d: string }[] }) {
  if (!list.length) return null;
  return (
    <button type="button" className="warnbtn" data-tip={list.map(x => `${x.l}: ${x.d}`).join('\n')}
      aria-label={`${plural(list.length, 'aviso', 'avisos')}: ${list.map(x => x.l).join(', ')}`}>
      <AlertTriangle className="i sm" />{list.length > 1 && <b>{list.length}</b>}
    </button>
  );
}

function OccBar({ value, label }: { value: number; label: string }) {
  return <div className={`bar-t ${lvl(value)}`} role="img" aria-label={label}><i style={{ width: `${Math.min(100, value)}%` }} /></div>;
}

export default function OwnerDashboard() {
  const { parkings, templates, reservations, employees, me, status, refresh } = useOwner();
  const navigate = useNavigate();
  const toast = useToast();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [loc, setLoc] = useState(''); // '' = todas las localidades
  const [detail, setDetail] = useState<Parking | null>(null);
  const [pausing, setPausing] = useState<Parking | null>(null); // L-42: confirmar antes de pausar
  const [params, setParams] = useSearchParams();
  const [pform, setPform] = useState<Parking | 'new' | null>(params.get('new') ? 'new' : null);
  useEffect(() => { if (params.get('new')) setParams({}, { replace: true }); }, [params, setParams]);

  // La localidad elegida limita la lista y también los indicadores (ocupación, facturado hoy y reservas en curso).
  const localities = useMemo(() => [...new Set(parkings.map(locOf))].sort((a, b) => a.localeCompare(b)), [parkings]);
  const scoped = loc ? parkings.filter(p => locOf(p) === loc) : parkings;
  const inScope = new Set(scoped.map(p => p.id));
  const scopedRes = loc ? reservations.filter(r => inScope.has(r.pid)) : reservations;
  const T = scoped.reduce((a, p) => a + tot(p), 0), O = scoped.reduce((a, p) => a + oc(p), 0), pc = T ? Math.round((O / T) * 100) : 0;
  const now = today();
  // Solo las que tienen factura vigente: una factura anulada deja `amount` en null.
  const fin = scopedRes.filter(r => r.st === 'finalizada' && r.endDate === now && r.amount != null);
  const revenue = fin.reduce((a, r) => a + (r.amount ?? 0), 0);
  const active = scopedRes.filter(r => r.st === 'curso').length;
  const alerts = useMemo(() => Object.fromEntries(parkings.map(p => [p.id, issues(p, templates[p.id])])), [parkings, templates]);

  const stOf = (p: Parking) => (p.isActive ? 'ok' : 'paused');
  const list = scoped.filter(p =>
    (filter === 'all' || (filter === 'ok' && stOf(p) === 'ok') || (filter === 'alert' && alerts[p.id]!.length) || (filter === 'paused' && stOf(p) === 'paused'))
    && matchesQuery(q, p.name, p.address, p.neighborhood, p.locality, p.province));
  const cnt: Record<Filter, number> = {
    all: scoped.length, ok: scoped.filter(p => p.isActive).length,
    alert: scoped.filter(p => alerts[p.id]!.length).length, paused: scoped.filter(p => !p.isActive).length,
  };

  // L-42: pausar cancela las pendientes (cada cliente recibe el aviso con el motivo), respeta las que están en curso y no
  // acepta reservas nuevas, ni online ni en el mostrador. Por eso se confirma antes, con lo que va a pasar.
  const toggle = async (p: Parking) => {
    if (p.isActive) { setPausing(p); return; }
    try {
      await reactivateParking(p.id);
      toast(`“${p.name}” habilitada y visible al público.`);
      setDetail(null);
      await refresh();
    } catch (x) { toast(apiError(x), 'err'); }
  };
  const pause = async () => {
    const p = pausing!;
    try {
      const { cancelled = 0, inProgress = 0 } = (await deleteParking(p.id))?.data ?? {};
      toast(`“${p.name}” pausada. Ya no aparece en las búsquedas.${cancelled ? ` Se ${cancelled === 1 ? 'canceló' : 'cancelaron'} ${plural(cancelled, 'reserva pendiente', 'reservas pendientes')}.` : ''}${inProgress ? ` ${plural(inProgress, 'en curso sigue', 'en curso siguen')} hasta su salida.` : ''}`, 'info');
      setPausing(null);
      setDetail(null);
      await refresh();
    } catch (x) { toast(apiError(x), 'err'); }
  };
  const pauseBody = (p: Parking) => {
    const mine = reservations.filter(r => r.pid === p.id);
    const pending = mine.filter(r => r.st === 'reservada').length, inside = mine.filter(r => r.st === 'curso').length;
    return `Deja de aparecer en el mapa y no acepta reservas nuevas, ni online ni en el mostrador.${pending ? ` Se ${pending === 1 ? 'cancela' : 'cancelan'} ${plural(pending, 'reserva pendiente', 'reservas pendientes')} y cada cliente recibe un aviso con el motivo.` : ''}${inside ? ` ${plural(inside, 'reserva en curso sigue', 'reservas en curso siguen')} hasta su salida.` : ''} El personal de la sucursal recibe un aviso.`;
  };

  const menuFor = (p: Parking) => [
    { label: 'Ver detalle', icon: <Eye className="i" />, onClick: () => setDetail(p) },
    { label: 'Editar sucursal', icon: <Pencil className="i" />, onClick: () => setPform(p) },
    { label: 'Gestionar plazas', icon: <LayoutGrid className="i" />, onClick: () => navigate(`/owner/spaces?p=${p.id}`) },
    { label: 'Tarifas', icon: <DollarSign className="i" />, sep: true, onClick: () => navigate(`/owner/tariffs?p=${p.id}`) },
    { label: 'Servicios', icon: <Layers className="i" />, onClick: () => navigate(`/owner/services?p=${p.id}`) },
    { label: 'Turnos y cobertura', icon: <CalendarDays className="i" />, onClick: () => navigate(`/owner/shifts?p=${p.id}`) },
    { label: 'Personal', icon: <Users className="i" />, onClick: () => navigate(`/owner/employees?p=${p.id}`) },
    p.isActive
      ? { label: 'Pausar sucursal', icon: <Pause className="i" />, sep: true, onClick: () => toggle(p) }
      : { label: 'Habilitar sucursal', icon: <Power className="i" />, sep: true, onClick: () => toggle(p) },
  ];

  const loading = status === 'loading';
  const name = `${me.name ?? ''} ${me.last_name ?? ''}`.trim();
  let body;
  if (status === 'error') body = <ErrorBox what="tus sucursales" onRetry={refresh} />;
  else if (loading) body = <SkeletonRows n={4} />;
  else if (!parkings.length) body = (
    <Empty icon={<Building2 className="i" />} title="Todavía no tenés sucursales"
      action={<button type="button" className="btn pri" onClick={() => setPform('new')}><Plus className="i sm" />Registrar sucursal</button>}>
      Registrá tu primera cochera, definí sus plazas y tarifas, y empezá a recibir reservas.
    </Empty>);
  else if (!list.length) body = (
    <Empty icon={<Search className="i" />} title="Sin resultados"
      action={<button type="button" className="btn" onClick={() => { setQ(''); setFilter('all'); setLoc(''); }}>Limpiar filtros</button>}>
      Ninguna sucursal coincide con el filtro o la búsqueda actual.
    </Empty>);
  else body = (
    <div className="panel tw"><table className="tbl br">
      <colgroup><col /><col style={{ width: 176 }} /><col style={{ width: '24%' }} /><col style={{ width: 176 }} /><col style={{ width: 152 }} /></colgroup>
      <thead><tr><th>Sucursal</th><th>Plazas</th><th>Ocupación en vivo</th><th>Estado</th><th><span className="sr">Acciones</span></th></tr></thead>
      <tbody>{list.map(p => {
        const n = pct(p), o = oc(p), t = tot(p);
        return (
          <tr key={p.id}>
            <td className="c-name"><button type="button" className="nm" onClick={() => setDetail(p)}>{p.name}</button><div className="ad" title={`${p.address}, ${p.locality}`}>{p.address}, {p.locality}</div></td>
            <td className="c-cap" data-label="Plazas"><div className="caps">{typesAcross(list).map(v => { const I = iconOf(v.name), c = capOf(p, v.id); return <span key={v.id} className={`cap ${c ? '' : 'z'}`} title={`${typePlural(v.name)}: ${c}`}><I className="i" />{c}</span>; })}</div></td>
            <td className="c-occ" data-label="Ocupación en vivo"><div className="occ2"><OccBar value={n} label={`${n}% ocupada`} /><div className="meta"><span>{o} ocupadas · {t - o} libres</span><b>{n}%</b></div></div></td>
            <td className="c-st" data-label="Estado">
              {p.isActive ? <span className="st ok"><Check className="i sm" />Operativa</span> : <span className="st mute"><Pause className="i sm" />Pausada</span>}
              <WarnBtn list={alerts[p.id]!} />
            </td>
            <td className="c-act r"><div className="acts">
              <button type="button" className="icon-btn" data-tip="Tarifas" aria-label={`Tarifas de ${p.name}`} onClick={() => navigate(`/owner/tariffs?p=${p.id}`)}><DollarSign className="i" /></button>
              <button type="button" className="icon-btn" data-tip="Turnos y cierres" aria-label={`Turnos y cierres de ${p.name}`} onClick={() => navigate(`/owner/shifts?p=${p.id}`)}><CalendarDays className="i" /></button>
              <Menu label={`Más acciones de ${p.name}`} button={<MoreVertical className="i" />} items={menuFor(p)} />
            </div></td>
          </tr>
        );
      })}</tbody>
    </table></div>
  );

  return (
    <>
      <section className="panel mecard" aria-label="Mi perfil">
        <span className="av lg" aria-hidden="true">{initials(me.name, me.last_name)}</span>
        <div className="mei"><div className="men"><h2>{name || 'Dueño'}</h2></div><p>{me.email}</p></div>
        <div className="mec"><span className="ctx">{plural(cnt.ok, 'sucursal activa', 'sucursales activas')}</span></div>
      </section>

      {loading ? <SkeletonRows n={2} cols={2} /> : (
        <div className="kpis">
          <section className="panel occ" aria-label="Ocupación actual">
            <div><div className="lab">Ocupación actual{loc && ` · ${loc}`}</div><div className="big">{pc}<span>%</span></div><div className="ctx">{O} de {T} plazas ocupadas · {T - O} libres</div></div>
            <div className="types">{T ? typesAcross(scoped).map(t => {
              const c = scoped.reduce((a, p) => a + svcOf(p, t.id), 0), o = scoped.reduce((a, p) => a + occOf(p, t.id), 0), I = iconOf(t.name), pl = typePlural(t.name);
              return c ? <div className="trow" key={t.id}><span className="n"><I className="i" />{pl}</span><OccBar value={Math.round((o / c) * 100)} label={`${pl}: ${o} de ${c} ocupadas`} /><span className="v">{o}/{c}</span></div> : null;
            }) : <span className="ctx">Todavía no hay plazas configuradas.</span>}</div>
          </section>
          <section className="panel stats" aria-label="Indicadores del día">
            <div className="srow"><div><div className="lab">Facturado hoy</div><div className="ctx">{plural(fin.length, 'check-out facturado', 'check-outs facturados')} desde las 00:00</div></div><div className="val">{money(revenue)}</div></div>
            <div className="srow"><div><div className="lab">Reservas en curso</div><div className="ctx">Vehículos adentro ahora</div></div><div className="val"><button type="button" aria-label={`${active} reservas en curso. Ver planilla`} onClick={() => navigate('/owner/reservations?s=curso')}>{active}</button></div></div>
          </section>
        </div>
      )}

      <section>
        <div className="sechead">
          <div><h2>Sucursales<span className="count">{scoped.length}</span></h2><p>Monitoreá cada cochera, configurá tarifas y gestioná plazas.</p></div>
          <button type="button" className="btn pri" onClick={() => setPform('new')}><Plus className="i sm" />Nueva sucursal</button>
        </div>
        <div className="toolbar">
          <div className="search"><Search className="i" /><input className="inp" type="search" placeholder="Buscar por nombre o dirección" aria-label="Buscar sucursal" value={q} onChange={e => setQ(e.target.value)} /></div>
          {localities.length > 1 && (
            <select className="sel" aria-label="Filtrar por localidad" style={{ width: 'auto', minWidth: 200 }} value={loc} onChange={e => setLoc(e.target.value)}>
              <option value="">Todas las localidades</option>
              {localities.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          )}
          <div className="seg" role="group" aria-label="Filtrar por estado">
            {([['all', 'Todas'], ['ok', 'Operativas'], ['alert', 'Con alertas'], ['paused', 'Pausadas']] as [Filter, string][]).map(([k, l]) => (
              <button type="button" key={k} aria-pressed={filter === k} onClick={() => setFilter(k)}>{l}<b>{cnt[k]}</b></button>
            ))}
          </div>
        </div>
        {body}
      </section>

      <Shown when={detail}>{d => <ParkingDetail p={parkings.find(x => x.id === d.id) ?? d} employees={employees} week={templates[d.id]} alerts={alerts[d.id] ?? []}
        onClose={() => setDetail(null)} onToggle={() => toggle(d)} onEdit={() => { setPform(d); setDetail(null); }} />}</Shown>
      <ParkingDrawer parking={pform} onClose={() => setPform(null)} />
      <Shown when={pausing}>{p => <ConfirmModal title={`¿Pausar “${p.name}”?`} body={pauseBody(p)} ok="Pausar sucursal" back="Volver" danger
        onConfirm={pause} onClose={() => setPausing(null)} />}</Shown>
    </>
  );
}

function ParkingDetail({ p, employees, week, alerts, onClose, onToggle, onEdit }: {
  p: Parking; employees: { id: string; name: string; last_name: string; parkingId?: string | null }[]; week?: ReturnType<typeof useOwner>['templates'][string];
  alerts: { l: string; d: string }[]; onClose: () => void; onToggle: () => void; onEdit: () => void;
}) {
  const navigate = useNavigate();
  const [services, setServices] = useState<any[] | null>(null);
  useEffect(() => { getServicePrices(p.id).then(setServices).catch(() => setServices([])); }, [p.id]);
  const n = pct(p), staff = employees.filter(e => e.parkingId === p.id);
  const cov = week?.some(d => d.length) ? coverage(week, ...span(p)) : null;
  const closed = shiftsText(week, '__closed');

  return (
    <Drawer title={p.name} sub={`${p.address}, ${p.locality}`} onClose={onClose} focusSel=".dfoot .btn.pri"
      footer={<div className="dfoot">
        <button type="button" className="btn" onClick={onToggle}><Power className="i sm" />{p.isActive ? 'Pausar' : 'Habilitar'}</button>
        <button type="button" className="btn" onClick={() => navigate(`/owner/spaces?p=${p.id}`)}><LayoutGrid className="i sm" />Plazas</button>
        <button type="button" className="btn pri" onClick={onEdit}><Pencil className="i sm" />Editar sucursal</button>
      </div>}>
      <div className="dbody">
        {(p.imageUrl || p.image) && <img src={p.imageUrl || p.image} alt={`Fachada de ${p.name}`} style={{ width: '100%', height: 128, objectFit: 'cover', borderRadius: 8, marginTop: 16 }} />}
        <div className="fs"><div className="fh"><h3>Ocupación en vivo</h3>
          {p.isActive ? <span className="st ok"><Check className="i sm" />Operativa</span> : <span className="st mute"><Pause className="i sm" />Pausada</span>}</div>
          {!!alerts.length && <div className="list">{alerts.map(x => <div className="li" key={x.l}><span className="st warn"><AlertTriangle className="i sm" />{x.l}</span><span className="sd">{x.d}</span></div>)}</div>}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}><span style={{ fontSize: 34, fontWeight: 600, letterSpacing: '-.03em' }}>{n}%</span><span className="ctx">{oc(p)} ocupadas · {tot(p) - oc(p)} libres de {tot(p)}</span></div>
          <div style={{ display: 'grid', gap: 12 }}>{typesOf(p).filter(t => capOf(p, t.id)).map(t => {
            const c = svcOf(p, t.id), o = occOf(p, t.id), x = c ? Math.round((o / c) * 100) : 0, I = iconOf(t.name), pl = typePlural(t.name);
            return <div className="trow" key={t.id} style={{ gridTemplateColumns: '104px 1fr 64px' }}><span className="n"><I className="i" />{pl}</span><OccBar value={x} label={`${pl}: ${x}%`} /><span className="v">{o}/{c}</span></div>;
          })}</div>
        </div>
        <div className="fs"><div className="fh"><h3>Datos de la sucursal</h3></div>
          <dl className="dl" style={{ margin: 0 }}>
            <dt>Dirección</dt><dd>{[p.address, p.neighborhood, p.locality].filter(Boolean).join(', ')} ({p.postalCode})</dd>
            <dt>Horario</dt><dd>{hrs(p)}</dd>
            <dt>Reserva</dt><dd>{p.minReservationHours} a {p.maxReservationHours} h · margen entre reservas {p.reservationMargin} min</dd>
          </dl>
        </div>
        <div className="fs"><div className="fh"><h3>Tarifas por hora</h3><button type="button" className="link" onClick={() => navigate(`/owner/tariffs?p=${p.id}`)}>Editar tarifas</button></div>
          <div className="list">{typesOf(p).filter(t => capOf(p, t.id)).map(t => {
            const pr = priceOf(p, t.id), I = iconOf(t.name);
            return <div className="li" key={t.id}><span className="l"><I className="i" />{typeLabel(t.name)}</span>{pr ? <b>{money(pr.price)}<span className="ctx" style={{ fontWeight: 400 }}> /h</span></b> : <span className="st warn"><AlertTriangle className="i sm" />Sin tarifa</span>}</div>;
          })}</div>
        </div>
        <div className="fs"><div className="fh"><h3>Servicios adicionales</h3><button type="button" className="link" onClick={() => navigate(`/owner/services?p=${p.id}`)}>Gestionar</button></div>
          {services === null ? <span className="sk" style={{ height: 14, width: '60%' }} /> : services.length
            ? <div className="list">{services.map(s => <div className="li" key={s.id}><span>{s.serviceCatalog?.name}</span><b>{money(s.price)}</b></div>)}</div>
            : <p className="ctx">Sin servicios asignados.</p>}
        </div>
        <div className="fs"><div className="fh"><h3>Turnos y cobertura</h3><button type="button" className="link" onClick={() => navigate(`/owner/shifts?p=${p.id}`)}>Gestionar turnos</button></div>
          {cov ? (cov.pct === 100
            ? <span className="st ok"><Check className="i sm" />Todo el horario está cubierto</span>
            : <span className="st warn"><AlertTriangle className="i sm" />Cobertura {cov.pct} % · {plural(gapGroups(cov.gaps).length, 'tramo sin cubrir', 'tramos sin cubrir')}</span>)
            : <p className="ctx">Sin turnos definidos.</p>}
          {!!closed.length && <p className="ctx"><Lock className="i sm" /> Cerrada: {closed.join(' · ')}</p>}
          {staff.length ? <div className="list">{staff.map(e => {
            const t = shiftsText(week, e.id);
            return <div className="li" key={e.id}><span className="l"><span className="av">{initials(e.name, e.last_name)}</span><span>{e.name} {e.last_name}</span></span><span className="sd">{t.length ? t.join(' · ') : 'Sin turnos'}</span></div>;
          })}</div> : <p className="ctx">Ningún empleado asignado.</p>}
        </div>
      </div>
    </Drawer>
  );
}
