import { useMemo, useRef, useState } from 'react';
import { Calendar, CheckCircle2, Clock, CircleDot, MapPin, SearchX, Sparkles, XCircle, type LucideIcon } from 'lucide-react';
import { Stars } from '../Owner/ui/Stars';
import type { Reservation } from '../../types/reservation.types';
import { formatReservationDate } from '../../utils/date';
import { Drawer, ConfirmModal } from '../Owner/ui/Layer';
import OwnerShell from '../Owner/ui/OwnerShell';
import { Presence } from '../Owner/ui/Presence';
import { Empty } from '../Owner/ui/Page';
import { useToast } from '../Owner/ui/Toasts';
import { apiError } from '../Owner/ui/Field';
import { money } from '../../pages/Owner/owner.lib';
import { FilterBar } from '../Owner/ui/FilterBar';
import { matchesQuery } from '../../utils/search';
import { PERIODS, inPeriod, type Period } from '../../utils/period';

interface ReservationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tab: 'active' | 'history';
  onTabChange: (tab: 'active' | 'history') => void;
  reservations: Reservation[];
  loading: boolean;
  onExploreParkings: () => void;
  onCancelReservation?: (reservationId: string) => Promise<void>;
  onRateReservation?: (reservationId: string, rating: number) => Promise<void>;
}

// Estado en color + ícono + texto (nunca solo color).
const STATUS: Record<string, { l: string; c: string; Icon: LucideIcon }> = {
  PENDIENTE: { l: 'Pendiente', c: 'warn', Icon: Clock },
  CONFIRMADA: { l: 'Confirmada', c: 'ok', Icon: CheckCircle2 },
  'EN CURSO': { l: 'En curso', c: 'ac', Icon: CircleDot },
  FINALIZADA: { l: 'Finalizada', c: 'mute', Icon: CheckCircle2 },
  CANCELADA: { l: 'Cancelada', c: 'mute', Icon: XCircle },
};

const STATUS_FILTERS = {
  active: [['all', 'Todas'], ['PENDIENTE', 'Pendientes'], ['CONFIRMADA', 'Confirmadas'], ['EN CURSO', 'En curso']],
  history: [['all', 'Todas'], ['FINALIZADA', 'Finalizadas'], ['CANCELADA', 'Canceladas']],
} as const;

const names = (r: any) => {
  const brand = r.vehicle?.brand?.name || (typeof r.vehicle?.brand === 'string' ? r.vehicle.brand : null) || r.brand;
  const model = r.vehicle?.model?.name || (typeof r.vehicle?.model === 'string' ? r.vehicle.model : null) || r.model;
  return {
    parking: r.parkingSpace?.parking?.name || r.parking?.name || 'Estacionamiento',
    address: r.parkingSpace?.parking?.address || r.parking?.address || '',
    space: r.parkingSpace?.spaceCode || r.spaceCode,
    plate: r.vehicle?.plate || r.plate,
    vehicle: [brand, model].filter(Boolean).join(' '),
  };
};

const isCancellable = (r: Reservation) => {
  const start = r.startTime ? new Date(r.startTime) : null;
  const future = !start || isNaN(start.getTime()) || start > new Date();
  return (r.status === 'PENDIENTE' || r.status === 'CONFIRMADA') && future;
};

// Panel lateral con el formato del rol dueño (.owner); reemplaza al modal Tailwind.
export function ReservationsDrawer(props: ReservationsDrawerProps) {
  return (
    <Presence open={props.isOpen}>
      <OwnerShell bare>
        <Content {...props} />
      </OwnerShell>
    </Presence>
  );
}

function Content({ onClose, tab, onTabChange, reservations, loading, onExploreParkings, onCancelReservation, onRateReservation }: ReservationsDrawerProps) {
  const toast = useToast();
  const [rating, setRating] = useState<string | null>(null); // reserva que se está valorando
  const rate = async (r: Reservation, n: number) => {
    if (!onRateReservation) return;
    setRating(r.id);
    try {
      await onRateReservation(r.id, n);
      toast(`Gracias: valoraste ${names(r).parking} con ${n} de 5.`);
    } catch (err) {
      toast(apiError(err, 'No se pudo guardar la valoración. Intentá de nuevo.'), 'err');
    } finally {
      setRating(null);
    }
  };
  const [confirming, setConfirming] = useState<Reservation | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const shown = useRef<Reservation | null>(null); // la confirmación conserva sus datos mientras se va
  if (confirming) shown.current = confirming;

  const active = useMemo(
    () => (reservations || []).filter((r) => r.status === 'PENDIENTE' || r.status === 'CONFIRMADA' || r.status === 'EN CURSO'),
    [reservations]
  );
  const history = useMemo(
    () => (reservations || []).filter((r) => r.status === 'FINALIZADA' || r.status === 'CANCELADA'),
    [reservations]
  );
  const base = tab === 'active' ? active : history;

  // Filtros: texto (cochera, dirección, plaza, patente, vehículo), estado y período de la fecha de inicio.
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<string>('all');
  const [period, setPeriod] = useState<Period>('all');
  const hasFilters = !!q.trim() || status !== 'all' || period !== 'all';
  const clearFilters = () => { setQ(''); setStatus('all'); setPeriod('all'); };
  const list = base.filter((r) => {
    const n = names(r);
    return matchesQuery(q, n.parking, n.address, n.space, n.plate, n.vehicle) && (status === 'all' || r.status === status) && inPeriod(r.startTime, period);
  });
  const changeTab = (t: 'active' | 'history') => { setStatus('all'); onTabChange(t); };

  const confirmCancel = async () => {
    if (!confirming || !onCancelReservation) return;
    setCancelling(true);
    try {
      await onCancelReservation(confirming.id);
      toast('La reserva fue dada de baja.');
      setConfirming(null);
    } catch (err) {
      toast(apiError(err, 'No se pudo dar de baja la reserva. Intentá de nuevo.'), 'err');
    } finally {
      setCancelling(false);
    }
  };

  const card = (r: Reservation) => {
    const n = names(r);
    const st = STATUS[(r.status || '').toUpperCase().trim()] ?? { l: r.status || 'Desconocido', c: 'mute', Icon: Clock };
    const services = r.services || [];
    const staff = [(r as any).attendedBy?.name, (r as any).attendedBy?.last_name].filter(Boolean).join(' ');
    return (
      <article key={r.id} className="rcard">
        <div className="rtop">
          <div>
            <div className="rn">
              {n.parking}
              {n.space && <span className="tag"> Plaza #{n.space}</span>}
            </div>
            {n.address && (
              <div className="ad">
                <MapPin className="i sm" aria-hidden="true" />
                <span>{n.address}</span>
              </div>
            )}
          </div>
          <span className={`st ${st.c}`}>
            <st.Icon className="i sm" aria-hidden="true" />
            {st.l}
          </span>
        </div>

        <dl className="dl">
          <dt>Reserva</dt>
          <dd><span className="plate">{r.code || `R-${r.id.slice(0, 6).toUpperCase()}`}</span></dd>
          <dt>Empleado</dt>
          <dd>{staff || 'Sin empleado asignado'}</dd>
          <dt>Desde</dt>
          <dd>{formatReservationDate(r.startTime)}</dd>
          <dt>Hasta</dt>
          <dd>{formatReservationDate(r.endTime)}</dd>
          {n.plate && (
            <>
              <dt>Vehículo</dt>
              <dd>
                <span className="plate">{n.plate}</span>
                {n.vehicle && <span> · {n.vehicle}</span>}
              </dd>
            </>
          )}
        </dl>

        {services.length > 0 && (
          <div className="tags">
            {services.map((s: any, i: number) => (
              <span key={s.id || i} className="tag mute">
                <Sparkles className="i sm" aria-hidden="true" />
                {s.serviceCatalog?.name || s.name || 'Servicio'} · {money(s.price)}
              </span>
            ))}
          </div>
        )}

        {r.status === 'FINALIZADA' && (r.rating != null || onRateReservation) && (
          <div className="rfoot">
            <span>{r.rating != null ? 'Tu valoración' : `¿Cómo te fue en ${n.parking}?`}</span>
            {r.rating != null ? <Stars value={r.rating} /> : <Stars value={0} busy={rating === r.id} onPick={(v) => rate(r, v)} />}
          </div>
        )}

        {onCancelReservation && isCancellable(r) && (
          <div className="rfoot">
            <span>¿No vas a usar la cochera?</span>
            <button type="button" className="btn ghost sm errtx" onClick={() => setConfirming(r)}>
              Dar de baja
            </button>
          </div>
        )}
      </article>
    );
  };

  const confirmBody = (r: Reservation) => {
    const n = names(r);
    return `${n.parking} · ${formatReservationDate(r.startTime)}${n.space ? ` · Plaza #${n.space}` : ''}${n.plate ? ` · ${n.plate}` : ''}. La plaza queda disponible de inmediato para otros conductores.`;
  };

  return (
    <>
      <Drawer
        title="Mis reservas"
        sub={tab === 'active' ? 'Reservas activas y programadas' : 'Historial de estadías anteriores'}
        onClose={onClose}
      >
        <div className="dbody stack" aria-busy={loading}>
          <div className="seg" role="group" aria-label="Estado de las reservas">
            <button type="button" aria-pressed={tab === 'active'} onClick={() => changeTab('active')}>
              Activas<b>{active.length}</b>
            </button>
            <button type="button" aria-pressed={tab === 'history'} onClick={() => changeTab('history')}>
              Historial<b>{history.length}</b>
            </button>
          </div>

          {!loading && base.length > 0 && (
            <FilterBar
              search={{ value: q, onChange: setQ, label: 'Buscar en mis reservas', placeholder: 'Cochera, plaza o patente' }}
              active={hasFilters && list.length > 0}
              onClear={clearFilters}
            >
              <div className="seg" role="group" aria-label="Filtrar por estado">
                {STATUS_FILTERS[tab].map(([k, l]) => (
                  <button key={k} type="button" aria-pressed={status === k} onClick={() => setStatus(k)}>{l}</button>
                ))}
              </div>
              <select className="sel" aria-label="Período" value={period} onChange={(e) => setPeriod(e.target.value as Period)}>
                {PERIODS.map((p) => <option key={p.k} value={p.k}>{p.l}</option>)}
              </select>
            </FilterBar>
          )}

          {loading ? (
            [0, 1].map((i) => (
              <div key={i} aria-hidden="true" className="rcard">
                <span className="sk" style={{ height: 14, width: '55%' }} />
                <span className="sk" style={{ height: 12, width: '35%' }} />
                <span className="sk" style={{ height: 12, width: '80%' }} />
              </div>
            ))
          ) : list.length === 0 && base.length > 0 && hasFilters ? (
            <Empty
              icon={<SearchX className="i" />}
              title="Ninguna reserva coincide con los filtros"
              action={<button type="button" className="btn" onClick={clearFilters}>Limpiar filtros</button>}
            >
              Probá con otra búsqueda, otro estado u otro período.
            </Empty>
          ) : list.length === 0 ? (
            <Empty
              icon={<Calendar className="i" />}
              title={tab === 'active' ? 'No tenés reservas activas' : 'Sin reservas en el historial'}
              action={
                tab === 'active' && (
                  <button
                    type="button"
                    className="btn"
                    onClick={() => {
                      onClose();
                      onExploreParkings();
                    }}
                  >
                    Explorar estacionamientos
                  </button>
                )
              }
            >
              {tab === 'active'
                ? 'Buscá un estacionamiento en el mapa y reservá tu lugar por horas.'
                : 'Acá vas a ver tus reservas pasadas una vez completadas.'}
            </Empty>
          ) : (
            list.map(card)
          )}
        </div>
      </Drawer>

      <Presence open={!!confirming}>
        {shown.current && (
        <ConfirmModal
          title="¿Dar de baja esta reserva?"
          body={confirmBody(shown.current)}
          ok="Confirmar baja"
          back="Volver"
          danger
          busy={cancelling}
          onConfirm={confirmCancel}
          onClose={() => setConfirming(null)}
        />
        )}
      </Presence>
    </>
  );
}
