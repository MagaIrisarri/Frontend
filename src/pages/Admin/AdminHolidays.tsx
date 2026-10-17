import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarDays, Download, Plus, Trash2 } from 'lucide-react';
import { Drawer, ConfirmModal } from '../../components/Owner/ui/Layer';
import { Shown } from '../../components/Owner/ui/Presence';
import { Empty, ErrorBox, PageHead, SkeletonRows } from '../../components/Owner/ui/Page';
import { Input, apiError } from '../../components/Owner/ui/Field';
import { useToast } from '../../components/Owner/ui/Toasts';
import { cap, fmtD, plural, today } from '../Owner/owner.lib';
import { createHoliday, getHolidays, importOfficialHolidays, previewOfficialHolidays, removeHoliday, type OfficialHolidaysDiff } from '../../services/holiday.service';
import type { Holiday } from '../../types/schedule.types';

// Feriados nacionales (R-10, D-09): los carga el administrador y los ven todos los dueños. Cargar no cierra nada:
// cada sucursal trabaja hasta que su dueño la adhiere. Sin edición: un nombre mal escrito se quita y se vuelve a cargar.
export default function AdminHolidays() {
  const toast = useToast();
  const thisYear = +today().slice(0, 4);
  const [year, setYear] = useState(thisYear);
  const [items, setItems] = useState<Holiday[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [adding, setAdding] = useState(false);
  const [del, setDel] = useState<Holiday | null>(null);
  // L-12: el aviso FERIADOS_ACTUALIZADOS abre la importación con ?import=1.
  const [params, setParams] = useSearchParams();
  const [importing, setImporting] = useState(params.has('import'));
  const closeImport = () => { setImporting(false); if (params.has('import')) setParams({}, { replace: true }); };

  const load = useCallback(async () => {
    try { setItems(await getHolidays(year)); setStatus('ready'); } catch { setStatus('error'); }
  }, [year]);
  useEffect(() => { setStatus('loading'); load(); }, [load]);

  const remove = async () => {
    const h = del!;
    setDel(null);
    try { await removeHoliday(h.id); await load(); toast(`“${h.name}” quitado. Las sucursales que cerraban ese día vuelven a su semana tipo.`, 'info'); }
    catch (x) { toast(apiError(x, 'No se pudo quitar. Intentá de nuevo.'), 'err'); }
  };

  const newBtn = <button type="button" className="btn pri" onClick={() => setAdding(true)}><Plus className="i sm" />Nuevo feriado</button>;
  const importBtn = <button type="button" className="btn" onClick={() => setImporting(true)}><Download className="i sm" />Importar calendario oficial</button>;
  let body;
  if (status === 'error') body = <ErrorBox what="los feriados" onRetry={load} />;
  else if (status === 'loading') body = <SkeletonRows n={4} cols={2} />;
  else if (!items.length) body = <Empty icon={<CalendarDays className="i" />} title={`No hay feriados nacionales en ${year}`} action={newBtn}>Los que cargues los ven todos los dueños.</Empty>;
  else body = (
    <div className="panel tw"><table className="tbl ev">
      <colgroup><col style={{ width: 260 }} /><col /><col style={{ width: 64 }} /></colgroup>
      <thead><tr><th>Fecha</th><th>Nombre</th><th><span className="sr">Acciones</span></th></tr></thead>
      <tbody>{items.map(h => (
        <tr key={h.id}>
          <td className="c-dt"><span className="nm">{cap(fmtD(h.date))}</span></td>
          <td className="c-nm">{h.name}{h.origin === 'oficial' && <div className="ad">Calendario oficial</div>}</td>
          <td className="r c-ac"><div className="acts">
            <button type="button" className="icon-btn" data-tip="Quitar feriado" aria-label={`Quitar ${h.name}`} onClick={() => setDel(h)}><Trash2 className="i" /></button>
          </div></td>
        </tr>
      ))}</tbody>
    </table></div>
  );

  return (
    <>
      <PageHead title="Feriados"
        sub={`Feriados nacionales: los ven todos los dueños, y cada sucursal trabaja salvo que su dueño la cierre.${status === 'ready' && items.length ? ` ${plural(items.length, 'feriado', 'feriados')} en ${year}.` : ''}`}
        actions={<>{importBtn}{status === 'ready' && items.length > 0 && newBtn}</>} />
      <div className="toolbar">
        <select className="sel" style={{ width: 'auto' }} aria-label="Año" value={year} onChange={e => setYear(+e.target.value)}>
          {[thisYear - 1, thisYear, thisYear + 1].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      {body}
      <Shown when={adding}>{() => <HolidayDrawer onSaved={async (h) => {
        setAdding(false);
        if (+h.date.slice(0, 4) !== year) setYear(+h.date.slice(0, 4)); else await load();
        toast(`“${h.name}” cargado. Las sucursales trabajan salvo que su dueño las cierre.`);
      }} onClose={() => setAdding(false)} />}</Shown>
      <Shown when={importing}>{() => <ImportDrawer onClose={closeImport} onDone={async ({ added, removed }) => {
        closeImport();
        await load();
        toast(added || removed
          ? `Calendario oficial importado: ${[added && `${plural(added, 'feriado agregado', 'feriados agregados')}`, removed && `${plural(removed, 'quitado', 'quitados')}`].filter(Boolean).join(' y ')}.`
          : 'El calendario ya estaba al día.');
      }} />}</Shown>
      <Shown when={del}>{h => <ConfirmModal title={`¿Quitar “${h.name}”?`} body={`Se quita para todos los dueños el ${fmtD(h.date)}. Las sucursales que cerraban ese día vuelven a su semana tipo.`}
        ok="Quitar feriado" back="Volver" danger onConfirm={remove} onClose={() => setDel(null)} />}</Shown>
    </>
  );
}

function HolidayDrawer({ onSaved, onClose }: { onSaved: (h: { date: string; name: string }) => void; onClose: () => void }) {
  const [v, setV] = useState({ date: '', name: '' });
  const [err, setErr] = useState<{ date?: string; name?: string; general?: string }>({});
  const [busy, setBusy] = useState(false);

  // Anticipa Holiday.Schema.ts: fecha y nombre obligatorios; el servidor rechaza (409) una fecha nacional repetida.
  const save = async (e: FormEvent) => {
    e.preventDefault();
    const er: typeof err = {};
    if (!v.date) er.date = 'Elegí la fecha.';
    if (!v.name.trim()) er.name = 'Ingresá el nombre del feriado.';
    setErr(er);
    if (Object.keys(er).length) return;
    setBusy(true);
    try { await createHoliday(v.date, v.name.trim()); onSaved({ date: v.date, name: v.name.trim() }); }
    catch (x) { setErr({ general: apiError(x) }); setBusy(false); }
  };
  const set = (k: 'date' | 'name') => (e: { target: { value: string } }) => { setV(s => ({ ...s, [k]: e.target.value })); setErr(s => ({ ...s, [k]: undefined, general: undefined })); };

  return (
    <Drawer title="Nuevo feriado" onClose={onClose}
      footer={<div className="dfoot"><button type="button" className="btn" onClick={onClose}>Cancelar</button><button className="btn pri" type="submit" form="hform" aria-busy={busy} disabled={busy}>Cargar</button></div>}>
      <form id="hform" noValidate className="dbody" onSubmit={save}>
        <section className="fs">
          <Input label="Fecha" type="date" value={v.date} onChange={set('date')} error={err.date} data-first />
          <Input label="Nombre" maxLength={60} autoComplete="off" placeholder="Ej.: Día de la Soberanía Nacional" value={v.name} onChange={set('name')} error={err.name} />
          {err.general && <div className="ferr" role="alert">{err.general}</div>}
        </section>
      </form>
    </Drawer>
  );
}

// L-12: vista previa de las diferencias con el calendario oficial (argentinadatos.com). Las fechas nuevas se agregan todas;
// las que ya no figuran (p. ej. por un traslado) se quitan solo si el administrador las tilda, porque abren las sucursales.
function ImportDrawer({ onDone, onClose }: { onDone: (r: { added: number; removed: number }) => void; onClose: () => void }) {
  const [diff, setDiff] = useState<OfficialHolidaysDiff | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error' | 'saving'>('loading');
  const [drop, setDrop] = useState<Set<string>>(new Set());
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    setStatus('loading');
    try { setDiff(await previewOfficialHolidays()); setDrop(new Set()); setStatus('ready'); } catch { setStatus('error'); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const pending = diff ? diff.toAdd.length + drop.size : 0;
  const busy = status === 'saving';
  const save = async () => {
    setStatus('saving'); setErr('');
    try { onDone(await importOfficialHolidays([...drop])); }
    catch (x) { setErr(apiError(x, 'No se pudo importar. Intentá de nuevo.')); setStatus('ready'); }
  };
  const toggle = (id: string) => setDrop(s => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  let body;
  if (status === 'error') body = <ErrorBox what="el calendario oficial" onRetry={load} />;
  else if (status === 'loading' || !diff) body = <div role="status" aria-label="Consultando el calendario oficial"><SkeletonRows n={4} cols={2} /></div>;
  else body = (<>
    <p className="ad" style={{ margin: 0 }}>Fuente: argentinadatos.com, desde hoy hasta fin del año próximo. Las fechas nuevas también se cargan solas una vez por día; un traslado aparece como una fecha nueva y otra que ya no figura.</p>
    {!diff.toAdd.length && !diff.missing.length && <p className="ctx">El calendario ya está al día: no hay nada para importar.</p>}
    {diff.toAdd.length > 0 && (<section className="fs"><div className="fh"><h3>Fechas nuevas</h3></div>
      <p className="ad" style={{ margin: 0 }}>Se agregan {plural(diff.toAdd.length, 'feriado', 'feriados')}. Las sucursales trabajan salvo que su dueño las cierre.</p>
      <div className="panel tw"><table className="tbl">
        <thead><tr><th>Fecha</th><th>Nombre</th></tr></thead>
        <tbody>{diff.toAdd.map(h => <tr key={h.date}><td data-label="Fecha">{cap(fmtD(h.date))}</td><td data-label="Nombre">{h.name}</td></tr>)}</tbody>
      </table></div>
    </section>)}
    {diff.missing.length > 0 && (<section className="fs"><div className="fh"><h3>Ya no figuran en el calendario oficial</h3></div>
      <p className="ad" style={{ margin: 0 }}>Tildá los que quieras quitar. Las sucursales que cerraban ese día vuelven a su semana tipo.</p>
      <div className="panel tw"><table className="tbl">
        <thead><tr><th aria-label="Quitar" /><th>Fecha</th><th>Nombre</th><th>Sucursales cerradas</th></tr></thead>
        <tbody>{diff.missing.map(h => (
          <tr key={h.id}>
            <td data-label="Quitar"><input type="checkbox" aria-label={`Quitar ${h.name} del ${fmtD(h.date)}`} checked={drop.has(h.id)} disabled={busy} onChange={() => toggle(h.id)} /></td>
            <td data-label="Fecha">{cap(fmtD(h.date))}</td>
            <td data-label="Nombre">{h.name}</td>
            <td data-label="Sucursales cerradas">{h.closures ? plural(h.closures, 'sucursal', 'sucursales') : 'Ninguna'}</td>
          </tr>
        ))}</tbody>
      </table></div>
    </section>)}
  </>);

  return (
    <Drawer title="Importar calendario oficial" wide onClose={onClose}
      footer={<div className="dfoot">
        {err ? <div className="fmsg" role="alert">{err}</div>
          : diff && status === 'ready' && !pending && diff.missing.length > 0 && <div className="fmsg">Las fechas nuevas ya están cargadas. Tildá los que quieras quitar.</div>}
        <button type="button" className="btn" onClick={onClose}>{diff && status === 'ready' && !pending ? 'Cerrar' : 'Cancelar'}</button>
        {(status !== 'ready' || pending > 0) && (
          <button type="button" className="btn pri" onClick={save} aria-busy={busy} disabled={busy || status !== 'ready'}>
            {[diff?.toAdd.length && `Agregar ${diff.toAdd.length}`, drop.size && `quitar ${drop.size}`].filter(Boolean).join(' y ').replace(/^q/, 'Q') || 'Importar'}
          </button>
        )}
      </div>}>
      <div className="dbody stack">{body}</div>
    </Drawer>
  );
}
