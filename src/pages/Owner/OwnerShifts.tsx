import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent as RKeyboardEvent, type PointerEvent as RPointerEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Check, ChevronLeft, ChevronRight, Clock, Lock, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { ConfirmModal, Drawer } from '../../components/Owner/ui/Layer';
import { Shown } from '../../components/Owner/ui/Presence';
import { Empty, ErrorBox, PageHead } from '../../components/Owner/ui/Page';
import { Field, apiError } from '../../components/Owner/ui/Field';
import { useToast } from '../../components/Owner/ui/Toasts';
import { conflictsOf, getRange, getTemplate, resetDay, saveDay, saveTemplateDay } from '../../services/shift.service';
import { createHoliday, getHolidays, removeHoliday, setHolidayOpen } from '../../services/holiday.service';
import type { Holiday, ResolvedDay } from '../../types/schedule.types';
import { useActiveParking, useOwner, type Emp } from './OwnerContext';
import { ParkingPicker } from '../../components/Owner/ui/ParkingPicker';
import {
  CLOSED, DAYS, DAYS_LONG, DOW, SLOT, addD, cap, coverage, dropOn, fmtD, fmtH, fromServer, gapGroups, gaps, hhmm, hoursOf,
  initials, monday, nowMin, place, plural, samePast, shD, span, tm, toServer, today, wdOf, workWarnings, type Block, type Day,
} from './owner.lib';

const ROW = 20; // px por franja de 30 min
// shortcut: L-10, bloques fijos de 30 minutos, parametrizar por sucursal si se pide
// Mover y estirar turnos es con mouse; en táctil (y con teclado) cada turno se edita en su editor (L-19, cerrada).

type Mode = 'tpl' | 'date';
interface Drag {
  kind: 'new' | 'move' | 'rt' | 'rb';
  who?: string; label?: string; // paleta
  d0: number; i: number; a0: number; b0: number; // bloque
  x0: number; y0: number; pid: number; on: boolean;
  res?: { d: number; a: number; b: number }; out?: boolean; over?: number | null; gx?: number; gy?: number;
}

export default function OwnerShifts() {
  const { parkings, employees, status, refresh: refreshOwner } = useOwner();
  const toast = useToast();
  const navigate = useNavigate();
  const { parking: p, select } = useActiveParking();
  const [mode, setMode] = useState<Mode>('tpl');
  const [wk, setWk] = useState(monday(today()));
  const [week, setWeek] = useState<(Day | null)[] | null>(null);
  const [meta, setMeta] = useState<(ResolvedDay | null)[]>([]);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [holKey, setHolKey] = useState(0);
  const [loadErr, setLoadErr] = useState(false);
  const [editing, setEditing] = useState<{ d: number; blk: Block } | null>(null); // turno abierto en el editor
  const cols = useRef<(HTMLDivElement | null)[]>([]);
  const calRef = useRef<HTMLDivElement>(null);

  // Solo la última carga escribe: al cambiar rápido de sucursal, de modo o de semana, una respuesta atrasada se descarta.
  const req = useRef(0);
  const load = useCallback(async () => {
    if (!p) return;
    const n = ++req.current;
    setWeek(null); setLoadErr(false); setEditing(null);
    try {
      if (mode === 'tpl') {
        const w = (await getTemplate(p.id)).map(fromServer);
        if (n !== req.current) return;
        setWeek(w);
        setMeta([]);
      } else {
        const days = await getRange(p.id, wk, addD(wk, 6));
        if (n !== req.current) return;
        setMeta(days);
        setWeek(days.map(d => (d.source === 'holiday-closed' ? null : fromServer(d))));
      }
    } catch {
      // Sin los turnos reales no se muestra un calendario vacío: guardar un día lo reemplazaría entero.
      if (n === req.current) setLoadErr(true);
    }
  }, [p?.id, mode, wk]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [load]);

  if (status === 'loading') return <><PageHead title="Turnos" /><span className="sk" style={{ height: 320 }} /></>;
  if (status === 'error') return <><PageHead title="Turnos" /><ErrorBox what="tus sucursales" onRetry={refreshOwner} /></>;
  if (!p) return (
    <><PageHead title="Turnos" />
      <Empty icon={<Clock className="i" />} title="Todavía no hay sucursales"
        action={<button type="button" className="btn pri" onClick={() => navigate('/owner?new=1')}><Plus className="i sm" />Registrar sucursal</button>}>
        Los turnos se arman por sucursal. Registrá una para empezar.
      </Empty></>
  );

  const [s, e] = span(p);
  const rows = Math.max(1, Math.floor((e - s) / SLOT));
  const staff = employees.filter(x => x.parkingId === p.id);
  const name = (id: string) => { const x = employees.find(y => y.id === id); return x ? x.name : id === CLOSED ? 'Cerrado' : '?'; };
  const dateOf = (d: number) => addD(wk, d);
  const locked = (d: number) => mode === 'date' && (!meta[d]?.editable || !week?.[d]);

  // Guarda un día. El backend valida R-01/R-02/R-05 y reasigna solo las reservas del empleado que pierde horas (R-06, R-07).
  const commit = async (d: number, day: Day, msg: string, undoable = true): Promise<boolean> => {
    if (!week) return false;
    const prev = week[d]!;
    if (mode === 'date' && dateOf(d) === today() && !samePast(prev, day, nowMin())) {
      toast(`No se pueden cambiar los turnos de hoy anteriores a las ${hhmm(nowMin())}.`, 'err');
      return false;
    }
    setWeek(w => w && w.map((x, i) => (i === d ? day : x)));
    try {
      let moved = 0;
      if (mode === 'tpl') {
        const r = await saveTemplateDay(p.id, DOW[d], toServer(day));
        setWeek(w => w && w.map((x, i) => (i === d ? fromServer(r) : x)));
        moved = r.reassigned ?? 0;
      } else {
        const r = await saveDay(p.id, dateOf(d), toServer(day));
        setWeek(w => w && w.map((x, i) => (i === d ? fromServer(r) : x)));
        setMeta(m => m.map((x, i) => (i === d ? r : x)));
        moved = r.reassigned ?? 0;
      }
      if (mode === 'tpl' || moved) refreshOwner(); // panel, personal y reservas leen la semana tipo y el empleado asignado
      const text = `${msg}${moved ? ` ${plural(moved, 'reserva pasó', 'reservas pasaron')} al empleado de turno.` : ''}`.trim();
      if (text) toast(text, 'ok', undoable ? () => commit(d, prev, 'Cambio deshecho.', false) : undefined);
      return true;
    } catch (x) {
      setWeek(w => w && w.map((y, i) => (i === d ? prev : y)));
      toast(conflictsOf(x).length ? `${apiError(x)}. Reubicá o cancelá esas reservas desde Reservas.` : apiError(x), 'err');
      return false;
    }
  };

  // ---------- arrastre con puntero ----------
  const colAt = (x: number, y: number) => {
    const i = cols.current.findIndex(el => { if (!el) return false; const r = el.getBoundingClientRect(); return x >= r.left && x < r.right; });
    if (i < 0) return null;
    const r = cols.current[i]!.getBoundingClientRect();
    return { d: i, m: s + Math.floor(Math.max(0, Math.min(y - r.top, r.height - 1)) / ROW) * SLOT };
  };
  const outside = (x: number, y: number) => { const r = calRef.current!.getBoundingClientRect(); return x < r.left || x > r.right || y < r.top || y > r.bottom; };
  const ownerRoot = () => document.querySelector('.owner');

  const startDrag = (ev: RPointerEvent, dr: Omit<Drag, 'x0' | 'y0' | 'pid' | 'on'>) => {
    if (ev.button || (dr.kind !== 'new' && ev.pointerType === 'touch')) return;
    const st: Drag = { ...dr, x0: ev.clientX, y0: ev.clientY, pid: ev.pointerId, on: false };
    let cur = st;
    const move = (m: PointerEvent) => {
      if (m.pointerId !== st.pid) return;
      const dx = m.clientX - st.x0, dy = m.clientY - st.y0;
      if (!cur.on && Math.hypot(dx, dy) < 6) return;
      if (!cur.on) ownerRoot()?.classList.add('dragging');
      const dm = Math.round(dy / ROW) * SLOT;
      let next: Drag = { ...cur, on: true };
      if (st.kind === 'new') next = { ...next, gx: m.clientX + 12, gy: m.clientY + 12, over: colAt(m.clientX, m.clientY)?.d ?? null };
      else if (st.kind === 'move') {
        const len = st.b0 - st.a0, a = Math.max(s, Math.min(e - len, st.a0 + dm));
        const cw = cols.current[st.d0]?.offsetWidth || 1, d = Math.max(0, Math.min(6, st.d0 + Math.round(dx / cw)));
        next = { ...next, res: { d, a, b: a + len }, out: outside(m.clientX, m.clientY) };
      } else if (st.kind === 'rt') next = { ...next, res: { d: st.d0, a: Math.max(s, Math.min(st.b0 - SLOT, st.a0 + dm)), b: st.b0 } };
      else next = { ...next, res: { d: st.d0, a: st.a0, b: Math.min(e, Math.max(st.a0 + SLOT, st.b0 + dm)) } };
      cur = next;
      setDrag(next);
    };
    const end = (u: PointerEvent) => {
      if (u.pointerId !== st.pid) return;
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
      ownerRoot()?.classList.remove('dragging');
      setDrag(null);
      if (!cur.on || u.type === 'pointercancel') return;
      // evita el clic que sigue al soltar
      const swallow = (c: MouseEvent) => { c.stopPropagation(); c.preventDefault(); };
      window.addEventListener('click', swallow, true);
      setTimeout(() => window.removeEventListener('click', swallow, true), 60);
      if (st.kind === 'new') { const c = colAt(u.clientX, u.clientY); if (c) dropAt(st.who!, c.d, c.m); return; }
      if (cur.out) return removeBlock(st.d0, st.i);
      const r = cur.res;
      if (r && !(r.d === st.d0 && r.a === st.a0 && r.b === st.b0)) moveBlock(st.d0, st.i, r);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
    setDrag(st);
  };

  // ---------- operaciones ----------
  const lockedMsg = (d: number) => (mode === 'date' && !week?.[d] ? 'Es feriado y la sucursal está cerrada. Abrila para armar ese día.' : 'No se pueden modificar fechas pasadas.');

  const dropAt = (who: string, d: number, m: number) => {
    if (!week) return;
    if (locked(d)) return toast(lockedMsg(d), 'err');
    const r = dropOn(week[d]!, who, m, s, e, name(who));
    if ('error' in r) return toast(r.error, 'err');
    commit(d, r.day, who === CLOSED ? `Cierre programado el ${DAYS_LONG[d]} de ${r.msg}.` : `${name(who)} cubre el ${DAYS_LONG[d]} de ${r.msg}.`);
  };

  const kbdAdd = (who: string) => {
    if (!week) return;
    const d = week.findIndex((x, i) => x && !locked(i) && gaps(x, s, e).length);
    if (d < 0) return toast('No hay horarios sin cubrir. Arrastrá al empleado sobre un turno para dividirlo.', 'info');
    dropAt(who, d, gaps(week[d]!, s, e)[0]![0]);
  };

  const removeBlock = (d: number, i: number) => {
    if (!week || locked(d)) return toast(lockedMsg(d), 'err');
    const b = week[d]![i]!;
    commit(d, week[d]!.filter((_, k) => k !== i), b.who === CLOSED ? `Cierre del ${DAYS_LONG[d]} quitado.` : `Turno de ${name(b.who)} del ${DAYS_LONG[d]} quitado.`);
  };

  const moveBlock = async (d0: number, i: number, r: { d: number; a: number; b: number }) => {
    if (!week) return;
    if (locked(d0) || locked(r.d)) return toast(lockedMsg(locked(d0) ? d0 : r.d), 'err');
    if (r.a < s || r.b > e) return toast('Fuera del horario de la sucursal.', 'err');
    const b = week[d0]![i]!, rest = week[d0]!.filter((_, k) => k !== i);
    if (r.d === d0) return commit(d0, place(rest, { who: b.who, a: r.a, b: r.b }), '');
    // Entre días: se guarda primero el destino y después se libera el origen.
    if (await commit(r.d, place(week[r.d]!, { who: b.who, a: r.a, b: r.b }), '', false)) await commit(d0, rest, '');
  };

  // ---------- editor de un turno ----------
  // Se busca de nuevo el bloque en el día: el calendario puede haber cambiado mientras el editor estaba abierto.
  const editIndex = (ed: { d: number; blk: Block }) => week?.[ed.d]?.findIndex(x => x.who === ed.blk.who && x.a === ed.blk.a && x.b === ed.blk.b) ?? -1;
  const editTarget = () => {
    const ed = editing!, i = editIndex(ed);
    if (locked(ed.d)) { toast(lockedMsg(ed.d), 'err'); return null; }
    if (i < 0) { toast('El turno cambió mientras lo editabas. Volvé a abrirlo.', 'err'); setEditing(null); return null; }
    return { ed, i };
  };
  const saveEdit = async (who: string, a: number, b: number) => {
    const t = editTarget();
    if (!t) return;
    const { ed: { d, blk }, i } = t;
    if (who === blk.who && a === blk.a && b === blk.b) { setEditing(null); return; } // sin cambios
    const label = who === CLOSED ? `Cierre del ${DAYS_LONG[d]} de ${hhmm(a)} a ${tm(b)}.` : `${name(who)} cubre el ${DAYS_LONG[d]} de ${hhmm(a)} a ${tm(b)}.`;
    if (await commit(d, place(week![d]!.filter((_, k) => k !== i), { who, a, b }), label)) setEditing(null);
  };
  const removeEdited = async () => {
    const t = editTarget();
    if (!t) return;
    const { ed: { d, blk }, i } = t;
    const label = blk.who === CLOSED ? `Cierre del ${DAYS_LONG[d]} quitado.` : `Turno de ${name(blk.who)} del ${DAYS_LONG[d]} quitado.`;
    if (await commit(d, week![d]!.filter((_, k) => k !== i), label)) setEditing(null);
  };

  const onBlockKey = (ev: RKeyboardEvent, d: number, i: number) => {
    if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); return setEditing({ d, blk: week![d]![i]! }); }
    if (ev.key === 'Delete' || ev.key === 'Backspace') { ev.preventDefault(); return removeBlock(d, i); }
    const mv = ({ ArrowUp: [0, -SLOT], ArrowDown: [0, SLOT], ArrowLeft: [-1, 0], ArrowRight: [1, 0] } as Record<string, [number, number]>)[ev.key];
    if (!mv || !week) return;
    ev.preventDefault();
    const b = week[d]![i]!, nd = d + mv[0];
    if (nd < 0 || nd > 6) return;
    moveBlock(d, i, { d: nd, a: b.a + mv[1], b: b.b + mv[1] });
  };

  // ---------- render ----------
  const cov = week ? coverage(week, s, e) : null;
  const groups = cov ? gapGroups(cov.gaps) : [];
  const anyShift = !!week?.some(d => d?.some(x => x.who !== CLOSED));
  const ww = week ? workWarnings(week, staff) : [];
  const date = mode === 'date';
  const wkLabel = (() => {
    const a = new Date(wk + 'T12:00'), b = new Date(addD(wk, 6) + 'T12:00'), f = (d: Date, o: Intl.DateTimeFormatOptions) => d.toLocaleDateString('es-AR', o);
    return (a.getMonth() === b.getMonth() ? `${a.getDate()}–${f(b, { day: 'numeric', month: 'long' })}` : `${f(a, { day: 'numeric', month: 'short' })} – ${f(b, { day: 'numeric', month: 'short' })}`) + ` de ${b.getFullYear()}`;
  })();
  const top = (m: number) => ((m - s) / SLOT) * ROW;
  const hgt = (a: number, b: number) => Math.max(18, ((b - a) / SLOT) * ROW - 2);

  const header = (d: number) => {
    if (!date) return <div className="ch" key={d}>{DAYS[d]}</div>;
    const m = meta[d], iso = dateOf(d), past = !m?.editable && iso < today(), isToday = iso === today();
    let bd = null;
    if (m?.source === 'holiday-closed') bd = <span className="bd hol" data-tip={m.holiday?.name}>Feriado</span>;
    else if (m?.modified && m.editable) bd = <button type="button" className="bd mod" data-tip="Restablecer a la semana tipo" onClick={() => reset(d)}>Modificado<RotateCcw className="i xs" aria-hidden="true" /></button>;
    else if (m?.holiday?.open) bd = <span className="bd" data-tip={m.holiday.name}>Feriado · trabaja</span>;
    else if (isToday) bd = <span className="bd today">Hoy</span>;
    else if (past) bd = <span className="bd past">Pasado</span>;
    return <div className={`ch${isToday ? ' td' : ''}`} key={d}><span>{DAYS[d]} {+iso.slice(8)}</span>{bd}</div>;
  };

  const reset = async (d: number) => {
    try {
      const r = await resetDay(p.id, dateOf(d));
      setMeta(m => m.map((x, i) => (i === d ? r : x)));
      setWeek(w => w && w.map((x, i) => (i === d ? fromServer(r) : x)));
      toast(`El ${fmtD(dateOf(d))} vuelve a la semana tipo.`);
    } catch (x) { toast(apiError(x), 'err'); }
  };

  const openHoliday = async (d: number) => {
    const h = meta[d]?.holiday;
    if (!h) return;
    try { await setHolidayOpen(h.id, p.id, true); setHolKey(k => k + 1); await load(); toast(`${p.name} abre el ${fmtD(dateOf(d))} con los turnos del ${DAYS_LONG[d]}.`); }
    catch (x) { toast(apiError(x), 'err'); }
  };

  const column = (d: number) => {
    const day = week?.[d], m = meta[d], ro = locked(d), past = date && !m?.editable;
    const items = (day ?? []).map((b, i) => ({ b, i })).filter(({ i }) => !(drag?.on && drag.kind !== 'new' && drag.d0 === d && drag.i === i && drag.res?.d !== d));
    const dragged = drag?.on && drag.kind !== 'new' && drag.res?.d === d && drag.d0 !== d ? week?.[drag.d0]?.[drag.i] : null;
    const blk = (b: Block, i: number, from = d) => {
      const dr = drag?.on && drag.kind !== 'new' && drag.d0 === from && drag.i === i ? drag : null;
      const a = dr?.res?.a ?? b.a, z = dr?.res?.b ?? b.b, cl = b.who === CLOSED, nm = cl ? 'Cerrado' : name(b.who);
      return (
        <div key={`${from}-${i}`} className={`shb${cl ? ' cl' : ''}${ro ? ' ro' : ''}${dr ? ' drag' : ''}${dr?.out ? ' out' : ''}`}
          style={{ top: top(a), height: hgt(a, z), left: 2, width: 'calc(100% - 4px)' }}
          tabIndex={ro ? undefined : 0} role="button" aria-haspopup={ro ? undefined : 'dialog'}
          aria-label={`${nm}, ${DAYS_LONG[d]} de ${hhmm(a)} a ${tm(z)}.${ro ? '' : ' Enter para editar, flechas para mover, Suprimir para quitar'}`}
          onClick={ro ? undefined : () => setEditing({ d: from, blk: b })}
          onPointerDown={ro ? undefined : ev => startDrag(ev, { kind: 'move', d0: from, i, a0: b.a, b0: b.b })}
          onKeyDown={ro ? undefined : ev => onBlockKey(ev, from, i)}>
          <b>{cl && <Lock className="i sm" />}{nm}</b><small>{hhmm(a)}–{tm(z)}</small>
          {!ro && <>
            <i className="rh t" onPointerDown={ev => { ev.stopPropagation(); startDrag(ev, { kind: 'rt', d0: from, i, a0: b.a, b0: b.b }); }} />
            <i className="rh b" onPointerDown={ev => { ev.stopPropagation(); startDrag(ev, { kind: 'rb', d0: from, i, a0: b.a, b0: b.b }); }} />
          </>}
        </div>
      );
    };
    return (
      <div key={d} ref={el => { cols.current[d] = el; }} className={`cd${past ? ' past' : ''}${date && !day ? ' hol' : ''}${drag?.over === d ? ' over' : ''}`}
        role="group" aria-label={`${DAYS_LONG[d]}${date ? ', ' + dateOf(d) : ''}`}>
        {day && !past && gaps(day, s, e).map(([a, b]) => <div key={a} className="gap" style={{ top: top(a), height: ((b - a) / SLOT) * ROW }} aria-hidden="true">{b - a >= 90 && <span>Sin cobertura</span>}</div>)}
        {!day && date && (
          <div className="shb cl hol ro" style={{ top: 0, height: hgt(s, e), left: 2, width: 'calc(100% - 4px)' }}>
            <b><Lock className="i sm" />Feriado</b><small>{m?.holiday?.name}</small>
            {m?.editable && <button type="button" className="btn" style={{ marginTop: 8, height: 28 }} onClick={() => openHoliday(d)}>Abrir</button>}
          </div>
        )}
        {items.map(({ b, i }) => blk(b, i))}
        {dragged && blk(dragged, drag!.i, drag!.d0)}
      </div>
    );
  };

  const labels: number[] = [];
  for (let m = Math.ceil(s / 60) * 60; m < e; m += 60) labels.push(m);

  return (
    <>
      <PageHead title={date ? 'Turnos por fecha' : 'Semana tipo'}
        sub={date ? 'Estás viendo fechas concretas. Un cambio vale solo para ese día y no modifica la semana tipo. Los días pasados son de solo lectura.'
          : 'Esta es la configuración estándar que se repite todas las semanas. Para cambios de una fecha puntual usá “Por fecha”; los feriados se manejan más abajo.'}
        actions={<ParkingPicker parkings={parkings} value={p.id} onChange={select} />} />

      <div className="panel" style={{ padding: 16 }}>
        <div className="toolbar" style={{ justifyContent: 'flex-start', gap: 16 }}>
          <div className="seg" role="group" aria-label="Vista del calendario">
            {([['tpl', 'Semana tipo'], ['date', 'Por fecha']] as [Mode, string][]).map(([k, l]) => <button type="button" key={k} aria-pressed={mode === k} onClick={() => setMode(k)}>{l}</button>)}
          </div>
          {date && (
            <div className="dt" role="group" aria-label="Semana">
              {/* shortcut: L-24, horizonte de navegación fijo (52 semanas atrás, D-06 adelante), acordarlo con negocio */}
              <button type="button" className="icon-btn" aria-label="Semana anterior" disabled={wk <= addD(monday(today()), -52 * 7)} onClick={() => setWk(addD(wk, -7))}><ChevronLeft className="i" /></button>
              <span style={{ minWidth: 190, textAlign: 'center', fontWeight: 500 }} aria-live="polite">{wkLabel}</span>
              <button type="button" className="icon-btn" aria-label="Semana siguiente" disabled={wk >= addD(monday(today()), 26 * 7)} onClick={() => setWk(addD(wk, 7))}><ChevronRight className="i" /></button>
              <button type="button" className="btn" onClick={() => setWk(monday(today()))}>Hoy</button>
            </div>
          )}
        </div>

        {loadErr ? <ErrorBox what="los turnos" onRetry={load} /> : !week ? <span className="sk" style={{ height: 320, marginTop: 16 }} /> : (
          <div>
            <div className="shsum"><div><div className="lab">Cobertura semanal</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}><span className="bigsm">{cov!.pct}%</span>
                {!anyShift ? <span className="st mute"><Clock className="i sm" />Sin turnos definidos</span>
                  : cov!.pct === 100 ? <span className="st ok"><Check className="i sm" />Todo el horario está cubierto</span>
                    : <span className="st warn"><AlertTriangle className="i sm" />{plural(groups.length, 'tramo sin cubrir', 'tramos sin cubrir')}</span>}
              </div></div></div>
            {!!groups.length && anyShift && <div className="gaps"><span className="lbl">Sin cubrir (no admiten reservas):</span>
              {groups.slice(0, 8).map(g => <span key={g} className="gapchip">{g}</span>)}{groups.length > 8 && <span className="ctx">+{groups.length - 8} más</span>}</div>}
            {!!ww.length && <div className="gaps"><span className="lbl">Jornada:</span>{ww.map(x => <span key={x.t} className={x.c === 'err' ? 'errchip' : 'gapchip'}>{x.c === 'err' && <AlertTriangle className="i xs" aria-hidden="true" />}{x.t}</span>)}</div>}

            <div className="pal" role="group" aria-label="Empleados de la sucursal">
              <span className="lbl">Arrastrá al día</span>
              {staff.map((x: Emp) => {
                const h = week.reduce((t, d) => t + (d ? hoursOf(d, x.id) : 0), 0);
                return (
                  <button type="button" key={x.id} className="pc" aria-label={`${x.name} ${x.last_name}, ${fmtH(h)} por semana. Enter para cubrir el primer horario libre`}
                    onPointerDown={ev => startDrag(ev, { kind: 'new', who: x.id, label: `${x.name} ${x.last_name}`, d0: -1, i: -1, a0: 0, b0: 0 })}
                    onClick={() => kbdAdd(x.id)}>
                    <span className="av">{initials(x.name, x.last_name)}</span>{x.name} {x.last_name}<small className="hr">{fmtH(h)}/sem</small>
                  </button>
                );
              })}
              {!staff.length && <span className="ctx">No hay empleados en esta sucursal. <button type="button" className="link" onClick={() => navigate(`/owner/employees?p=${p.id}`)}>Asignalos desde Personal</button>.</span>}
              <button type="button" className="pc closed" aria-label="Programar un cierre"
                onPointerDown={ev => startDrag(ev, { kind: 'new', who: CLOSED, label: 'Cerrado', d0: -1, i: -1, a0: 0, b0: 0 })}
                onClick={() => kbdAdd(CLOSED)}><Lock className="i sm" />Cerrado</button>
            </div>
            {/* Lo esencial a la vista; el detalle del arrastre, un nivel más abajo */}
            <div className="howto">
              <p className="ctx">Soltá un empleado sobre un horario libre para cubrirlo, o tocá un turno para editarlo.</p>
              <details><summary>Cómo funciona</summary><p className="ctx">Sobre un turno: en el medio lo reemplaza entero; arriba o abajo lo divide en partes iguales. Las reservas pasan solas al empleado que queda de turno. Arrastrá los turnos para moverlos (el que queda debajo se recorta solo) y sus bordes para ajustarlos; arrastralos fuera del calendario para quitarlos. “Cerrado” funciona igual que un empleado y se rechaza si hay reservas activas o pendientes en ese horario.</p></details>
            </div>
            <div className="legend">
              <span><i className="sw-shift" />Turno</span>
              <span><i className="hatch" />Sin cobertura</span>
              <span><i className="sw-closed" />Cerrado</span>
              {date && <span><i className="sw-hol" />Feriado</span>}
            </div>
            <div className="calwrap" ref={calRef}>
              <div className={`cal${date ? ' dm' : ''}`} style={{ ['--rows' as string]: rows }}>
                <div className="ch" />{DAYS.map((_, d) => header(d))}
                <div className="ct">{labels.map(m => <span key={m} style={{ top: top(m) }}>{hhmm(m)}</span>)}</div>
                {DAYS.map((_, d) => column(d))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="panel" style={{ padding: 16, marginTop: 16 }}>
        <Holidays key={`${p.id}-${holKey}`} parkingId={p.id} parkingName={p.name} onChange={() => date && load()} />
      </div>

      {drag?.on && drag.kind === 'new' && <div className="dgh" style={{ left: drag.gx, top: drag.gy }}>{drag.label}</div>}
      <Shown when={editing}>{ed => (
        <ShiftEditor blk={ed.blk} day={`${cap(DAYS_LONG[ed.d]!)}${date ? ` ${shD(dateOf(ed.d))}` : ' · semana tipo'}`} staff={staff} s={s} e={e} name={name}
          onSave={saveEdit} onRemove={removeEdited} onClose={() => setEditing(null)} />
      )}</Shown>
    </>
  );
}

// Editor de un turno (prototipo 57-editar-turno y 113-form-turno): el camino en el celular, donde los turnos no se arrastran (L-19), y con teclado.
// Guarda por el mismo commit que el arrastre: lo que queda debajo se recorta (R-02) y el backend rechaza dejar reservas sin cubrir.
function ShiftEditor({ blk, day, staff, s, e, name, onSave, onRemove, onClose }: {
  blk: Block; day: string; staff: Emp[]; s: number; e: number; name: (id: string) => string;
  onSave: (who: string, a: number, b: number) => Promise<void>; onRemove: () => Promise<void>; onClose: () => void;
}) {
  const [who, setWho] = useState(blk.who);
  const [a, setA] = useState(blk.a);
  const [b, setB] = useState(blk.b);
  const [busy, setBusy] = useState(false);
  const err = b <= a ? 'El fin tiene que ser posterior al inicio.' : '';
  const closed = blk.who === CLOSED;
  // Franjas de 30 min dentro del horario de la sucursal; si el turno viene con otra hora, también se ofrece.
  const opts = (from: number, to: number, cur: number) => {
    const l: number[] = [];
    for (let m = from; m <= to; m += SLOT) l.push(m);
    return (l.includes(cur) ? l : [...l, cur]).sort((x, y) => x - y);
  };
  const run = (fn: () => Promise<void>) => async () => {
    if (busy) return;
    setBusy(true);
    try { await fn(); } finally { setBusy(false); }
  };
  const submit = (ev: FormEvent) => { ev.preventDefault(); if (!err) run(() => onSave(who, a, b))(); };

  return (
    <Drawer title={closed ? 'Editar cierre' : 'Editar turno'} sub={day} onClose={onClose}
      footer={<div className="dfoot">
        <button type="button" className="btn danger push" disabled={busy} onClick={run(onRemove)}><Trash2 className="i sm" />{closed ? 'Quitar cierre' : 'Quitar turno'}</button>
        <button type="button" className="btn" onClick={onClose}>Cancelar</button>
        <button type="submit" form="shform" className="btn pri" disabled={busy || !!err} aria-busy={busy}>Guardar</button>
      </div>}>
      <form id="shform" noValidate className="dbody" onSubmit={submit}>
        <section className="fs">
          <Field label="Quién cubre">
            {(id, aria) => (
              <select className="sel" id={id} {...aria} data-first value={who} onChange={ev => setWho(ev.target.value)}>
                {staff.map(x => <option key={x.id} value={x.id}>{x.name} {x.last_name}</option>)}
                {blk.who !== CLOSED && !staff.some(x => x.id === blk.who) && <option value={blk.who}>{name(blk.who)}</option>}
                <option value={CLOSED}>Cerrado</option>
              </select>
            )}
          </Field>
          <div className="g2">
            <Field label="Desde">
              {(id, aria) => <select className="sel" id={id} {...aria} value={a} onChange={ev => setA(+ev.target.value)}>
                {opts(s, e - SLOT, a).map(m => <option key={m} value={m}>{hhmm(m)}</option>)}</select>}
            </Field>
            <Field label="Hasta" error={err}>
              {(id, aria) => <select className="sel" id={id} {...aria} value={b} onChange={ev => setB(+ev.target.value)}>
                {opts(s + SLOT, e, b).map(m => <option key={m} value={m}>{tm(m)}</option>)}</select>}
            </Field>
          </div>
          <p className="ctx" style={{ margin: 0 }}>
            Lo que quede debajo de este horario se recorta. Las reservas pasan solas al empleado que quede de turno; si un horario con reservas activas o pendientes quedaría sin cubrir, el cambio se rechaza.
          </p>
        </section>
      </form>
    </Drawer>
  );
}

// D-01, D-09: dos estados por sucursal, Trabaja (por defecto) y Cierra (se adhiere al feriado). Editar un día que trabaja lo marca "Modificado" en el calendario.
function Holidays({ parkingId, parkingName, onChange }: { parkingId: string; parkingName: string; onChange: () => void }) {
  const toast = useToast();
  const [list, setList] = useState<Holiday[] | null>(null);
  const [nd, setNd] = useState('');
  const [nn, setNn] = useState('');
  const [del, setDel] = useState<Holiday | null>(null);
  const now = today(), y = +now.slice(0, 4);

  const load = useCallback(async () => {
    const [a, b] = await Promise.all([getHolidays(y, parkingId), getHolidays(y + 1, parkingId)]).catch(() => [[], []]);
    setList([...a, ...b].filter(h => h.date >= now));
  }, [parkingId, y, now]);
  useEffect(() => { load(); }, [load]);

  const setOpen = async (h: Holiday, open: boolean) => {
    try {
      await setHolidayOpen(h.id, parkingId, open);
      await load(); onChange();
      toast(open ? `${parkingName} trabaja el ${fmtD(h.date)} con los turnos del ${DAYS_LONG[wdOf(h.date)]}.` : `${parkingName} cierra el ${fmtD(h.date)}.`, 'ok', () => setOpen(h, !open));
    } catch (x) {
      const n = conflictsOf(x).length;
      toast(n ? `No se puede cerrar el ${fmtD(h.date)}: hay ${plural(n, 'reserva activa o pendiente', 'reservas activas o pendientes')}.` : apiError(x), 'err');
    }
  };
  const add = async () => {
    if (!nd || nd < now) return toast('Elegí una fecha desde hoy.', 'err');
    try { await createHoliday(nd, nn.trim() || 'Fecha especial'); setNd(''); setNn(''); await load(); onChange(); toast(`${cap(fmtD(nd))} agregado a tus sucursales. Trabajan salvo que las cierres.`); }
    catch (x) { toast(apiError(x), 'err'); }
  };
  const remove = async () => {
    const h = del!;
    setDel(null);
    try { await removeHoliday(h.id); await load(); onChange(); toast(`${h.name} quitado de tus sucursales.`, 'info'); }
    catch (x) { toast(apiError(x), 'err'); }
  };

  return (
    <div className="fs">
      <div className="fh"><h3>Feriados y fechas especiales</h3></div>
      <p className="ctx" style={{ margin: '0 0 10px' }}>Los feriados nacionales los carga el administrador, y podés sumar fechas propias, que solo ven tus sucursales. Por defecto todas trabajan: acá elegís si <b>{parkingName}</b> cierra cada fecha. Para un horario distinto, editá el día en “Por fecha”.</p>
      {list === null ? <span className="sk" style={{ height: 40 }} /> : list.length ? (
        <div className="list">{list.map(h => (
          <div className="li" key={h.id}>
            <span className="l"><span><div className="nm">{cap(fmtD(h.date))}</div><div className="ad">{h.name} · {h.scope === 'propio' ? 'propio' : 'nacional'}</div></span></span>
            <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <select className="sel" style={{ width: 'auto' }} aria-label={`Qué hace ${parkingName} el ${h.date}`} value={h.open ? 'o' : 'c'} onChange={ev => setOpen(h, ev.target.value === 'o')}>
                <option value="o">Trabaja con turnos del {DAYS_LONG[wdOf(h.date)]}</option><option value="c">Cierra</option>
              </select>
              {h.scope === 'propio' && <button type="button" className="icon-btn" data-tip="Quitar fecha propia" aria-label={`Quitar ${h.name}`} onClick={() => setDel(h)}><Trash2 className="i" /></button>}
            </span>
          </div>
        ))}</div>
      ) : <p className="ctx">No hay fechas próximas cargadas.</p>}
      <div className="toolbar" style={{ marginTop: 12, justifyContent: 'flex-start' }}>
        <input type="date" className="inp" style={{ width: 'auto' }} min={now} aria-label="Fecha" value={nd} onChange={ev => setNd(ev.target.value)} />
        <input className="inp" style={{ width: 260 }} placeholder="Nombre (ej. Feriado puente)" aria-label="Nombre de la fecha" maxLength={60} value={nn} onChange={ev => setNn(ev.target.value)} />
        <button type="button" className="btn" onClick={add}><Plus className="i sm" />Agregar a mis sucursales</button>
      </div>
      <Shown when={del}>{h => <ConfirmModal title={`¿Quitar ${h.name}?`} body="Se quita de tus sucursales. Las que cerraban ese día vuelven a su semana tipo." ok="Quitar feriado" danger onConfirm={remove} onClose={() => setDel(null)} />}</Shown>
    </div>
  );
}
