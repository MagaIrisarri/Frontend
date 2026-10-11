import React, { useEffect, useRef, useState } from 'react';
import { X, Star, MapPin, ArrowLeft, Clock, ChevronRight, SearchX } from 'lucide-react';
import type { Parking } from '../../types/parking.types';
import type { VehicleFilterType } from '../../types/mapFilters.types';
import type { ServicePrice } from '../../types/servicePrice.types';
import { getParkingServices } from '../../services/servicePrice.service';
import {
  formatSpotPrice,
  getCategorySpaces,
  getUnavailableReason,
  matchesVehicleCategory,
} from '../../utils/parkingPriceUtils';
import { Empty, ErrorBox } from '../Owner/ui/Page';
import { Presence } from '../Owner/ui/Presence';
import { useSwipeClose } from '../../hooks/useSwipeClose';
import { FilterBar } from '../Owner/ui/FilterBar';
import { Field } from '../Owner/ui/Field';
import { localityKey } from '../../utils/search';
import { VICON, vehicleKey } from '../Owner/ui/vehicles';
import { VT } from '../../pages/Owner/owner.lib';

const DEFAULT_PARKING_IMAGE =
  'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=600&q=80';

const CATEGORY_LABEL: Record<VehicleFilterType, string> = { AUTO: 'auto', MOTO: 'moto', CAMIONETA: 'camioneta' };

const vehicleMeta = (type?: string) => {
  const k = vehicleKey(type);
  return { label: VT.find((v) => v.k === k)!.n, Icon: VICON[k] };
};

export const ListDrawer: React.FC<any> = (props: any) => {
  const {
    isListDrawerOpen,
    selectedParking,
    setIsListDrawerOpen,
    filteredParkings = [],
    selectedParkingId,
    setSelectedParkingId,
    favoriteIds = [],
    toggleFavorite,
    filters = { vehicleType: null },
    handleOpenReservation,
    loading = false,
    loadError = false,
    fetchParkings,
    searchQuery = '',
    setSearchQuery,
    mapArea = null,
    setFilters,
    setLocality,
    resetFilters,
    parkings = [],
  } = props;

  const [services, setServices] = useState<ServicePrice[]>([]);
  const selectedId = selectedParking?.id;

  // Servicios vigentes de la cochera abierta en el detalle
  useEffect(() => {
    setServices([]);
    if (!selectedId) return;
    let cancelled = false;
    getParkingServices(selectedId)
      .then((res: any) => {
        const list: ServicePrice[] = res?.data ?? res ?? [];
        if (!cancelled) setServices(Array.isArray(list) ? list.filter((s) => s.expirationDate === null) : []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const isOpen = isListDrawerOpen || !!selectedParking;
  // Mientras el panel se va conserva la vista que tenía (detalle o listado) para que la salida no cambie de contenido.
  const snap = useRef<any>(null);
  if (isOpen) snap.current = selectedParking;
  const sp = isOpen ? selectedParking : snap.current;

  const category: VehicleFilterType | null = filters.vehicleType;
  const hasFilters = !!(searchQuery || mapArea || category || filters.maxPrice || filters.sort || filters.locality);
  // Localidades de las cocheras; la provincia se agrega solo si el nombre se repite.
  const places = new Map<string, Parking>();
  for (const p of parkings as Parking[]) if (p.locality) places.set(localityKey(p), p);
  const localities = [...places].map(([key, p]) => {
    const twin = [...places.values()].some((o) => o !== p && o.locality === p.locality);
    return { key, label: twin && p.province ? `${p.locality} (${p.province})` : p.locality };
  }).sort((a, b) => a.label.localeCompare(b.label, 'es'));
  const clearAll = () => {
    resetFilters();
    setSearchQuery('');
  };
  const categoryName = category ? CATEGORY_LABEL[category] : '';
  const available = category
    ? filteredParkings.filter((p: Parking) => getUnavailableReason(p, category) === null)
    : filteredParkings;
  const unavailable = category
    ? filteredParkings.filter((p: Parking) => getUnavailableReason(p, category) !== null)
    : [];

  const favButton = (id: string, onClick: (e: React.MouseEvent) => void) => {
    const isFav = favoriteIds.includes(id);
    return (
      <button
        type="button"
        className="icon-btn fav"
        aria-pressed={isFav}
        aria-label={isFav ? 'Quitar de favoritos' : 'Guardar en favoritos'}
        onClick={onClick}
      >
        <Star className="i" />
      </button>
    );
  };

  const renderCard = (p: Parking) => {
    const isSelected = p.id === selectedParkingId;
    const reason = category ? getUnavailableReason(p, category) : null;
    const imgUrl = p.imageUrl || p.image || DEFAULT_PARKING_IMAGE;
    const counts = VT.map((t) => ({ Icon: VICON[t.k], n: p[t.free] ?? p[t.cap] ?? 0, label: t.n.toLowerCase() }));

    return (
      <article
        key={p.id}
        onClick={() => setSelectedParkingId(p.id)}
        aria-current={isSelected || undefined}
        className={`pcard${reason ? ' dis' : ''}`}
      >
        <img
          src={imgUrl}
          alt=""
          onError={(e) => {
            (e.target as HTMLImageElement).src = DEFAULT_PARKING_IMAGE;
          }}
        />
        <div className="pb">
          <div className="row top">
            <button type="button" className="nmb" onClick={() => setSelectedParkingId(p.id)}>
              <span className="nm">{p.name}</span>
              <span className="ad">
                <MapPin className="i sm" aria-hidden="true" />
                <span>{[p.address, p.neighborhood, p.locality].filter(Boolean).join(' · ')}</span>
              </span>
            </button>
            {favButton(p.id, (e) => {
              e.stopPropagation();
              toggleFavorite(p.id);
            })}
          </div>

          {reason ? (
            <span className="tag mute">
              {reason === 'NO_SPACE' ? `Sin lugar para ${categoryName}` : `Sin tarifa para ${categoryName}`}
            </span>
          ) : (
            <div className="tags">
              {counts.map(({ Icon, n, label }) => (
                <span key={label} className="tag mute">
                  <Icon className="i sm" aria-hidden="true" />
                  {n}
                  <span className="sr"> lugares para {label}</span>
                </span>
              ))}
            </div>
          )}

          <div className="row">
            <span className="pr">
              {p.prices && p.prices.length > 0 ? formatSpotPrice(p, category).text : `${p.openingTime} - ${p.closingTime} hs`}
            </span>
            <button
              type="button"
              className={`btn sm${isSelected ? ' pri' : ''}`}
              disabled={!!reason}
              onClick={(e) => {
                e.stopPropagation();
                handleOpenReservation(p);
              }}
            >
              Reservar
            </button>
          </div>
        </div>
      </article>
    );
  };

  const swipe = useSwipeClose(() => { setSelectedParkingId(null); setIsListDrawerOpen(false); }, 'down');

  const subtitle = loading
    ? 'Buscando cocheras…'
    : category
    ? `${available.length} de ${filteredParkings.length} con lugar para ${categoryName}`
    : `${filteredParkings.length} ${filteredParkings.length === 1 ? 'resultado' : 'resultados'}`;
  const subtitleWhere = !loading && mapArea ? `${subtitle} en esta zona` : subtitle;

  return (
    <Presence open={isOpen}>
      {(closing) => (
    <aside
      ref={swipe}
      aria-label={sp ? 'Detalle de la cochera' : 'Listado de estacionamientos'}
      className={`hpanel${closing ? ' out' : ''}`}
    >
      {sp ? (
        <>
          <div className="dhead">
            <button type="button" className="btn ghost sm" onClick={() => setSelectedParkingId(null)}>
              <ArrowLeft className="i sm" />
              Volver al listado
            </button>
            <button
              type="button"
              className="icon-btn"
              aria-label="Cerrar panel"
              onClick={() => {
                setSelectedParkingId(null);
                setIsListDrawerOpen(false);
              }}
            >
              <X className="i" />
            </button>
          </div>

          <div className="dbody det">
            <img
              className="pimg"
              src={sp.imageUrl || sp.image || DEFAULT_PARKING_IMAGE}
              alt={sp.name}
              onError={(e) => {
                (e.target as HTMLImageElement).src = DEFAULT_PARKING_IMAGE;
              }}
            />

            <div className="ptop">
              <div>
                <h2>{sp.name}</h2>
                <p className="pmeta">
                  <MapPin className="i sm" aria-hidden="true" />
                  <span>{[sp.address, sp.neighborhood, sp.locality].filter(Boolean).join(', ')}</span>
                </p>
                <p className="pmeta">
                  <Clock className="i sm" aria-hidden="true" />
                  <span>{sp.openingTime} - {sp.closingTime} hs</span>
                </p>
              </div>
              {favButton(sp.id, () => toggleFavorite(sp.id))}
            </div>

            <section aria-labelledby="dr-disp">
              <h3 id="dr-disp" className="eyebrow">Lugares disponibles</h3>
              <div className="acells">
                {VT.map((t) => ({ Icon: VICON[t.k], label: t.n, free: sp[t.free] ?? sp[t.cap] ?? 0, total: sp[t.cap] ?? 0 })).map(({ Icon, label, free, total }) => (
                  <div key={label} className="acell">
                    <span className="lab">
                      <Icon className="i sm" aria-hidden="true" />
                      {label}
                    </span>
                    <b>{free}</b>
                    <span className="of"> / {total}</span>
                  </div>
                ))}
              </div>
            </section>

            {sp.prices && sp.prices.length > 0 && (
              <section aria-labelledby="dr-tar">
                <h3 id="dr-tar" className="eyebrow">Tarifa por hora</h3>
                <ul className="list">
                  {sp.prices.map((pr: any) => {
                    const { label, Icon } = vehicleMeta(pr.vehicleType);
                    const mine = matchesVehicleCategory(pr.vehicleType, category);
                    return (
                      <li key={pr.id || pr.vehicleType} className={`li${mine ? ' mine' : ''}`}>
                        <span className="nm2">
                          <Icon className="i" aria-hidden="true" />
                          {label}
                          {mine && <span className="tag">Tu selección</span>}
                        </span>
                        <strong>${Number(pr.price).toLocaleString('es-AR')}/h</strong>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            {services.length > 0 && (
              <section aria-labelledby="dr-serv">
                <h3 id="dr-serv" className="eyebrow">Servicios adicionales</h3>
                <ul className="list">
                  {services.map((s) => (
                    <li key={s.id} className="li">
                      <span>{s.serviceCatalog?.name || 'Servicio'}</span>
                      <strong>${Number(s.price).toLocaleString('es-AR')}</strong>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section aria-labelledby="dr-reg">
              <h3 id="dr-reg" className="eyebrow">Reglas de reserva</h3>
              <dl className="dl">
                <dt>Duración mínima</dt>
                <dd>{sp.minReservationHours} hs</dd>
                <dt>Duración máxima</dt>
                <dd>{sp.maxReservationHours} hs</dd>
                <dt>Tolerancia de llegada</dt>
                <dd>{sp.reservationMargin} min</dd>
              </dl>
            </section>
          </div>

          <div className="dfoot">
            <button
              type="button"
              className="btn pri"
              disabled={!!category && getCategorySpaces(sp, category) <= 0}
              onClick={() => handleOpenReservation(sp)}
            >
              Reservar en esta cochera
              <ChevronRight className="i sm" />
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="dhead">
            <div>
              <h2>Estacionamientos</h2>
              <p>{subtitleWhere}</p>
            </div>
            <button type="button" className="icon-btn" aria-label="Cerrar listado" onClick={() => setIsListDrawerOpen(false)}>
              <X className="i" />
            </button>
          </div>

          <div className="dbody" aria-busy={loading}>
            {!loading && !loadError && parkings.length > 0 && (
              <FilterBar active={hasFilters && filteredParkings.length > 0} onClear={clearAll}>
                <div className="seg" role="group" aria-label="Ordenar por precio">
                  {([[null, 'Sin orden'], ['price-asc', 'Menor precio'], ['price-desc', 'Mayor precio']] as const).map(([k, l]) => (
                    <button key={l} type="button" aria-pressed={(filters.sort ?? null) === k} onClick={() => setFilters((f: any) => ({ ...f, sort: k }))}>{l}</button>
                  ))}
                </div>
                {localities.length > 1 && (
                  <Field label="Localidad">
                    {(id, aria) => (
                      <select id={id} {...aria} className="sel" value={filters.locality ?? ''}
                        onChange={(e) => setLocality(e.target.value || null)}>
                        <option value="">Todas</option>
                        {localities.map((l) => <option key={l.key} value={l.key}>{l.label}</option>)}
                      </select>
                    )}
                  </Field>
                )}
                <Field label="Precio máximo por hora">
                  {(id, aria) => (
                    <input id={id} {...aria} className="inp" inputMode="numeric" placeholder="Sin límite" value={filters.maxPrice ?? ''}
                      onChange={(e) => setFilters((f: any) => ({ ...f, maxPrice: Number(e.target.value.replace(/\D/g, '')) || null }))} />
                  )}
                </Field>
              </FilterBar>
            )}
            {loading ? (
              [0, 1, 2].map((i) => (
                <div key={i} aria-hidden="true" className="pcard ld">
                  <span className="sk" style={{ width: 72, height: 72, borderRadius: 8, flex: 'none' }} />
                  <div className="pb">
                    <span className="sk" style={{ height: 14, width: '60%' }} />
                    <span className="sk" style={{ height: 12, width: '40%' }} />
                    <span className="sk" style={{ height: 12, width: '80%' }} />
                  </div>
                </div>
              ))
            ) : loadError ? (
              <ErrorBox what="las cocheras" onRetry={fetchParkings} />
            ) : filteredParkings.length === 0 ? (
              <Empty
                icon={<SearchX className="i" />}
                title="No encontramos cocheras"
                action={hasFilters && <button type="button" className="btn" onClick={clearAll}>Limpiar filtros</button>}
              >
                {hasFilters
                  ? 'Probá con otra zona o nombre, o quitá los filtros de vehículo y precio.'
                  : 'Todavía no hay cocheras publicadas.'}
              </Empty>
            ) : (
              <>
                {available.map(renderCard)}
                {unavailable.length > 0 && (
                  <>
                    <h3 className="eyebrow pgroup">No disponibles para {categoryName}</h3>
                    {unavailable.map(renderCard)}
                  </>
                )}
              </>
            )}
          </div>
        </>
      )}
    </aside>
      )}
    </Presence>
  );
};
