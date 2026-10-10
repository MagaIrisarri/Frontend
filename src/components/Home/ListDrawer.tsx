import React, { useEffect, useState } from 'react';
import { X, Star, MapPin, ArrowLeft, Clock, ChevronRight, Car, Bike, Truck, RefreshCw, SearchX, AlertCircle } from 'lucide-react';
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

const DEFAULT_PARKING_IMAGE =
  'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=600&q=80';

const CATEGORY_LABEL: Record<VehicleFilterType, string> = { AUTO: 'auto', MOTO: 'moto', CAMIONETA: 'camioneta' };

const vehicleMeta = (type?: string) => {
  const t = (type || '').toUpperCase();
  if (t.includes('MOTO')) return { label: 'Moto', Icon: Bike };
  if (t.includes('CAMION') || t.includes('UTIL')) return { label: 'Camioneta', Icon: Truck };
  return { label: 'Auto', Icon: Car };
};

const SECTION_TITLE = 'text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5';

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
    setVehicleFilter,
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
  if (!isOpen) return null;

  const category: VehicleFilterType | null = filters.vehicleType;
  const categoryName = category ? CATEGORY_LABEL[category] : '';
  const available = category
    ? filteredParkings.filter((p: Parking) => getUnavailableReason(p, category) === null)
    : filteredParkings;
  const unavailable = category
    ? filteredParkings.filter((p: Parking) => getUnavailableReason(p, category) !== null)
    : [];

  const renderCard = (p: Parking) => {
    const isSelected = p.id === selectedParkingId;
    const isFav = favoriteIds.includes(p.id);
    const reason = category ? getUnavailableReason(p, category) : null;
    const imgUrl = p.imageUrl || p.image || DEFAULT_PARKING_IMAGE;
    const counts = [
      { Icon: Car, n: p.availableCarSpaces ?? p.carCapacity ?? 0, label: 'auto' },
      { Icon: Bike, n: p.availableMotorcycleSpaces ?? p.motorcycleCapacity ?? 0, label: 'moto' },
      { Icon: Truck, n: p.availableTruckSpaces ?? p.truckCapacity ?? 0, label: 'camioneta' },
    ];

    return (
      <article
        key={p.id}
        onClick={() => setSelectedParkingId(p.id)}
        className={`p-3 rounded-2xl border transition-all cursor-pointer flex gap-3 ${
          reason ? 'opacity-70 ' : ''
        }${
          isSelected
            ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-500 ring-1 ring-blue-500/40'
            : 'bg-white dark:bg-zinc-950/60 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
        }`}
      >
        <img
          src={imgUrl}
          alt=""
          className="w-18 h-18 rounded-xl object-cover shrink-0 bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800"
          onError={(e) => {
            (e.target as HTMLImageElement).src = DEFAULT_PARKING_IMAGE;
          }}
        />
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          <div className="flex items-start justify-between gap-1">
            <button
              type="button"
              onClick={() => setSelectedParkingId(p.id)}
              className="min-w-0 text-left cursor-pointer"
            >
              <span className="block text-sm font-bold text-zinc-900 dark:text-white truncate">{p.name}</span>
              <span className="flex items-center gap-1 text-xs text-zinc-600 dark:text-zinc-400 truncate">
                <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate">{p.address}</span>
              </span>
            </button>
            <button
              type="button"
              aria-pressed={isFav}
              aria-label={isFav ? 'Quitar de favoritos' : 'Guardar en favoritos'}
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(p.id);
              }}
              className="-mt-2.5 -mr-2.5 h-11 w-11 shrink-0 flex items-center justify-center rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
            >
              <Star className={`h-4 w-4 ${isFav ? 'fill-amber-400 text-amber-500' : ''}`} />
            </button>
          </div>

          {reason ? (
            <span className="self-start px-2 py-0.5 rounded-lg bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-bold">
              {reason === 'NO_SPACE' ? `Sin lugar para ${categoryName}` : `Sin tarifa para ${categoryName}`}
            </span>
          ) : (
            <div className="flex items-center gap-1.5 flex-wrap">
              {counts.map(({ Icon, n, label }) => (
                <span
                  key={label}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300"
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  {n}
                  <span className="sr-only"> lugares para {label}</span>
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-extrabold text-zinc-900 dark:text-white truncate">
              {p.prices && p.prices.length > 0 ? formatSpotPrice(p, category).text : `${p.openingTime} - ${p.closingTime} hs`}
            </span>
            <button
              type="button"
              disabled={!!reason}
              onClick={(e) => {
                e.stopPropagation();
                handleOpenReservation(p);
              }}
              className={`h-11 px-4 rounded-xl border text-sm font-bold transition-colors ${
                reason
                  ? 'border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  : isSelected
                  ? 'border-blue-600 bg-blue-600 hover:bg-blue-500 text-white cursor-pointer'
                  : 'border-blue-600 bg-white dark:bg-transparent text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-500/10 cursor-pointer'
              }`}
            >
              Reservar
            </button>
          </div>
        </div>
      </article>
    );
  };

  const stateBlock = (
    Icon: React.ComponentType<{ className?: string }>,
    tone: string,
    title: string,
    text: string,
    actions: React.ReactNode,
    role?: 'alert'
  ) => (
    <div role={role} className="flex flex-col items-center justify-center gap-3 text-center px-6 py-12">
      <span aria-hidden="true" className={`h-16 w-16 rounded-2xl flex items-center justify-center ${tone}`}>
        <Icon className="h-7 w-7" />
      </span>
      <h4 className="text-base font-bold text-zinc-900 dark:text-white">{title}</h4>
      <p className="max-w-64 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{text}</p>
      <div className="flex flex-wrap justify-center gap-2 mt-1">{actions}</div>
    </div>
  );
  const stateBtn =
    'h-11 px-4 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-sm font-bold text-zinc-900 dark:text-white cursor-pointer';

  const subtitle = loading
    ? 'Buscando cocheras…'
    : category
    ? `${available.length} de ${filteredParkings.length} con lugar para ${categoryName}`
    : `${filteredParkings.length} ${filteredParkings.length === 1 ? 'resultado' : 'resultados'}`;

  return (
    <aside
      aria-label={selectedParking ? 'Detalle de la cochera' : 'Listado de estacionamientos'}
      className="absolute z-30 inset-x-0 bottom-0 h-[62vh] rounded-t-3xl sm:inset-x-auto sm:top-20 sm:right-4 sm:bottom-6 sm:h-auto sm:w-96 sm:rounded-3xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col overflow-hidden will-change-transform transform-gpu animate-in slide-in-from-bottom sm:slide-in-from-right duration-200 ease-out"
    >
      <span aria-hidden="true" className="sm:hidden mx-auto mt-2 mb-1 h-1.5 w-10 rounded-full bg-zinc-300 dark:bg-zinc-700 shrink-0" />

      {selectedParking ? (
        <div className="flex flex-col flex-1 min-h-0 animate-in fade-in duration-200">
          <div className="p-2 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={() => setSelectedParkingId(null)}
              className="flex items-center gap-2 h-11 px-3 rounded-xl text-sm font-semibold text-blue-700 dark:text-blue-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Volver al listado</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedParkingId(null);
                setIsListDrawerOpen(false);
              }}
              aria-label="Cerrar panel"
              className="h-11 w-11 flex items-center justify-center rounded-xl text-zinc-600 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            <img
              src={selectedParking.imageUrl || selectedParking.image || DEFAULT_PARKING_IMAGE}
              alt={selectedParking.name}
              className="w-full h-44 rounded-2xl object-cover bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800"
              onError={(e) => {
                (e.target as HTMLImageElement).src = DEFAULT_PARKING_IMAGE;
              }}
            />

            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white leading-snug">{selectedParking.name}</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5 mt-1.5">
                  <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{selectedParking.address}, {selectedParking.locality}</span>
                </p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5 mt-1.5">
                  <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{selectedParking.openingTime} - {selectedParking.closingTime} hs</span>
                </p>
              </div>
              <button
                type="button"
                aria-pressed={favoriteIds.includes(selectedParking.id)}
                aria-label={favoriteIds.includes(selectedParking.id) ? 'Quitar de favoritos' : 'Guardar en favoritos'}
                onClick={() => toggleFavorite(selectedParking.id)}
                className="h-11 w-11 shrink-0 flex items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <Star className={`h-4 w-4 ${favoriteIds.includes(selectedParking.id) ? 'fill-amber-400 text-amber-500' : ''}`} />
              </button>
            </div>

            <section aria-labelledby="dr-disp">
              <h4 id="dr-disp" className={SECTION_TITLE}>Lugares disponibles</h4>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { Icon: Car, label: 'Auto', free: selectedParking.availableCarSpaces ?? selectedParking.carCapacity ?? 0, total: selectedParking.carCapacity ?? 0 },
                    { Icon: Bike, label: 'Moto', free: selectedParking.availableMotorcycleSpaces ?? selectedParking.motorcycleCapacity ?? 0, total: selectedParking.motorcycleCapacity ?? 0 },
                    { Icon: Truck, label: 'Camioneta', free: selectedParking.availableTruckSpaces ?? selectedParking.truckCapacity ?? 0, total: selectedParking.truckCapacity ?? 0 },
                  ] as const
                ).map(({ Icon, label, free, total }) => (
                  <div key={label} className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <span className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                      {label}
                    </span>
                    <span className="text-lg font-extrabold text-zinc-900 dark:text-white">{free}</span>
                    <span className="text-xs text-zinc-600 dark:text-zinc-400"> / {total}</span>
                  </div>
                ))}
              </div>
            </section>

            {selectedParking.prices && selectedParking.prices.length > 0 && (
              <section aria-labelledby="dr-tar">
                <h4 id="dr-tar" className={SECTION_TITLE}>Tarifa por hora</h4>
                <ul className="rounded-xl border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-200 dark:divide-zinc-800 overflow-hidden">
                  {selectedParking.prices.map((pr: any) => {
                    const { label, Icon } = vehicleMeta(pr.vehicleType);
                    const mine = matchesVehicleCategory(pr.vehicleType, category);
                    return (
                      <li
                        key={pr.id || pr.vehicleType}
                        className={`flex items-center justify-between gap-2 px-3.5 py-3 text-sm ${
                          mine ? 'bg-blue-50 dark:bg-blue-500/10' : ''
                        }`}
                      >
                        <span className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
                          <Icon className="h-4 w-4" aria-hidden="true" />
                          {label}
                          {mine && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-600 text-white font-bold uppercase tracking-wide">
                              Tu selección
                            </span>
                          )}
                        </span>
                        <strong className="text-zinc-900 dark:text-white">${Number(pr.price).toLocaleString('es-AR')}/h</strong>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            {services.length > 0 && (
              <section aria-labelledby="dr-serv">
                <h4 id="dr-serv" className={SECTION_TITLE}>Servicios adicionales</h4>
                <ul className="rounded-xl border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-200 dark:divide-zinc-800 overflow-hidden">
                  {services.map((s) => (
                    <li key={s.id} className="flex items-center justify-between gap-2 px-3.5 py-3 text-sm">
                      <span className="text-zinc-800 dark:text-zinc-200">{s.serviceCatalog?.name || 'Servicio'}</span>
                      <strong className="text-zinc-900 dark:text-white">${Number(s.price).toLocaleString('es-AR')}</strong>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section aria-labelledby="dr-reg">
              <h4 id="dr-reg" className={SECTION_TITLE}>Reglas de reserva</h4>
              <dl className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-2 text-sm">
                <dt className="text-zinc-600 dark:text-zinc-400">Duración mínima</dt>
                <dd className="font-bold text-zinc-900 dark:text-white">{selectedParking.minReservationHours} hs</dd>
                <dt className="text-zinc-600 dark:text-zinc-400">Duración máxima</dt>
                <dd className="font-bold text-zinc-900 dark:text-white">{selectedParking.maxReservationHours} hs</dd>
                <dt className="text-zinc-600 dark:text-zinc-400">Tolerancia de llegada</dt>
                <dd className="font-bold text-zinc-900 dark:text-white">{selectedParking.reservationMargin} min</dd>
              </dl>
            </section>
          </div>

          <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 shrink-0">
            <button
              type="button"
              disabled={!!category && getCategorySpaces(selectedParking, category) <= 0}
              onClick={() => handleOpenReservation(selectedParking)}
              className="w-full flex items-center justify-center gap-2 h-12 px-4 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-300 disabled:dark:bg-zinc-700 disabled:cursor-not-allowed text-white text-sm font-bold transition-colors cursor-pointer"
            >
              <span>Reservar en esta cochera</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col flex-1 min-h-0 animate-in fade-in duration-200">
          <div className="pl-5 pr-2 py-2 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">Estacionamientos</h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">{subtitle}</p>
            </div>
            <button
              type="button"
              onClick={() => setIsListDrawerOpen(false)}
              aria-label="Cerrar listado"
              className="h-11 w-11 flex items-center justify-center rounded-xl text-zinc-600 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2.5" aria-busy={loading}>
            {loading ? (
              [0, 1, 2].map((i) => (
                <div key={i} aria-hidden="true" className="p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex gap-3 animate-pulse">
                  <div className="w-18 h-18 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-3 w-3/5 rounded bg-zinc-200 dark:bg-zinc-800" />
                    <div className="h-2.5 w-2/5 rounded bg-zinc-100 dark:bg-zinc-800/60" />
                    <div className="h-2.5 w-4/5 rounded bg-zinc-100 dark:bg-zinc-800/60" />
                  </div>
                </div>
              ))
            ) : loadError ? (
              stateBlock(
                AlertCircle,
                'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300',
                'No pudimos cargar las cocheras',
                'Revisá tu conexión e intentá de nuevo.',
                <button type="button" onClick={fetchParkings} className="h-11 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold flex items-center gap-2 cursor-pointer">
                  <RefreshCw className="h-4 w-4" />
                  Reintentar
                </button>,
                'alert'
              )
            ) : filteredParkings.length === 0 ? (
              stateBlock(
                SearchX,
                'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400',
                'No encontramos cocheras',
                searchQuery || category
                  ? 'Probá con otra zona o nombre, o quitá el filtro de vehículo.'
                  : 'Todavía no hay cocheras publicadas.',
                <>
                  {searchQuery && (
                    <button type="button" onClick={() => setSearchQuery('')} className={stateBtn}>
                      Limpiar búsqueda
                    </button>
                  )}
                  {category && (
                    <button type="button" onClick={() => setVehicleFilter(null)} className={stateBtn}>
                      Quitar filtro
                    </button>
                  )}
                </>
              )
            ) : (
              <>
                {available.map(renderCard)}
                {unavailable.length > 0 && (
                  <>
                    <h4 className={`${SECTION_TITLE} pt-2 px-1`}>No disponibles para {categoryName}</h4>
                    {unavailable.map(renderCard)}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </aside>
  );
};
