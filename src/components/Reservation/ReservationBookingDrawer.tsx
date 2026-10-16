import { useState, useEffect, useMemo, useRef } from 'react';
import { Check, ChevronRight, CheckCircle2, Clock, Plus, Sparkles } from 'lucide-react';
import { getUserVehicle } from '../../services/vehicle.service';
import { getPriceParking } from '../../services/parking.service';
import { getParkingServices } from '../../services/servicePrice.service';
import { createReservation } from '../../services/reservation.service';
import type { Parking } from '../../types/parking.types';
import type { Vehicle } from '../../types/vehicle.types';
import type { ServicePrice } from '../../types/servicePrice.types';
import type { VehicleFilterType } from '../../types/mapFilters.types';
import { getTypeSpaces, getUnavailableReason } from '../../utils/parkingPriceUtils';
import { useAuthStore } from '../../stores/authStore';
import { Drawer } from '../Owner/ui/Layer';
import OwnerShell from '../Owner/ui/OwnerShell';
import { Presence } from '../Owner/ui/Presence';
import { Empty } from '../Owner/ui/Page';
import { Field } from '../Owner/ui/Field';
import { addD, fmtD, money, nowMin, plural, today, typeLabel, typePlural } from '../../pages/Owner/owner.lib';
import { atAR } from '../../utils/date';
import { VICON, iconOf } from '../Owner/ui/vehicles';

interface ReservationBookingDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  parking: Parking | null;
  initialVehicleCategory?: VehicleFilterType | null;
  onOpenVehicleRegister?: () => void;
  vehiclesRev?: number; // cambia al volver de Mis vehículos: recarga la lista sin perder la reserva en curso
  onViewMyReservations?: () => void;
  onReservationSuccess?: () => void;
}

const normalizeTimeHHMM = (timeStr?: string): string => {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  if (parts.length >= 2) {
    return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
  }
  return timeStr;
};

// R-30: el vehículo usa las plazas y la tarifa de su tipo (por id); el ícono es solo visual.
const typeOfVehicle = (v: any): { id: string; name: string } => {
  const t = v?.vehicleType;
  return typeof t === 'object' && t ? { id: t.id, name: t.name } : { id: String(t ?? ''), name: '' };
};
const vehicleUi = (v: any) => { const t = typeOfVehicle(v); return { label: typeLabel(t.name) || 'Vehículo', Icon: t.name ? iconOf(t.name) : VICON.AUTO }; };

// Por qué no se reserva con ese vehículo en esta cochera (la misma regla que el listado); null si se puede.
// Sin tarifa el backend responde 409; sin plazas libres ahora, igual que el listado, se marca no disponible.
const blockedFor = (parking: any, v: any) => getUnavailableReason(parking, typeOfVehicle(v).id);
const BLOCKED = { NO_PRICE: 'Sin tarifa en esta cochera', NO_SPACE: 'Sin plazas libres' };

function generateAllHours(openingTime?: string, closingTime?: string): string[] {
  if (!openingTime || !closingTime) return [];
  const [openHour] = openingTime.split(':').map(Number);
  const [closeHour] = closingTime.split(':').map(Number);
  const hours: string[] = [];
  for (let h = openHour; h <= closeHour; h++) {
    hours.push(`${String(h).padStart(2, '0')}:00`);
  }
  return hours;
}

// Reserva en pasos (vehículo → estadía y servicios → confirmación) dentro de un panel del estándar. La lógica es la del modal anterior.
export function ReservationBookingDrawer({
  isOpen,
  onClose,
  parking,
  initialVehicleCategory,
  onOpenVehicleRegister,
  vehiclesRev = 0,
  onViewMyReservations,
  onReservationSuccess,
}: ReservationBookingDrawerProps) {
  const [step, setStep] = useState<'vehicle' | 'details' | 'success'>('vehicle');
  const [subTab, setSubTab] = useState<'schedule' | 'services'>('schedule');

  // Vehículos del usuario
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  // Fechas base
  // L-04: con toISOString el día salía en UTC (después de las 21 h daba mañana).
  const todayStr = useMemo(() => today(), []);
  const tomorrowStr = useMemo(() => addD(todayStr, 1), [todayStr]);

  const [date, setDate] = useState<string>(todayStr);
  const [entryTime, setEntryTime] = useState<string>('');
  const [exitTime, setExitTime] = useState<string>('');

  // Servicios y Precios
  const [services, setServices] = useState<ServicePrice[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [hourlyRate, setHourlyRate] = useState<number | null>(null);

  // Estado de Envío
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdReservation, setCreatedReservation] = useState<any>(null);

  // Calcular horarios disponibles según fecha (para HOY filtra horas pasadas y auto-selecciona la primera disponible)
  const availableEntryHours = useMemo(() => {
    if (!parking?.openingTime || !parking?.closingTime) return [];
    const [openH] = parking.openingTime.split(':').map(Number);
    const [closeH] = parking.closingTime.split(':').map(Number);

    let startH = openH;
    if (date === todayStr) {
      startH = Math.max(openH, Math.ceil(nowMin() / 60)); // L-04: la hora de ahora en Argentina
    }

    const hours: string[] = [];
    for (let h = startH; h < closeH; h++) {
      hours.push(`${String(h).padStart(2, '0')}:00`);
    }
    return hours;
  }, [parking, date, todayStr]);

  const allClosingHours = useMemo(() => {
    if (!parking?.openingTime || !parking?.closingTime) return [];
    return generateAllHours(parking.openingTime, parking.closingTime);
  }, [parking]);

  // Horas de salida disponibles (posteriores a entryTime)
  const availableExitHours = useMemo(() => {
    if (!entryTime || allClosingHours.length === 0) return [];
    const [entryH] = entryTime.split(':').map(Number);
    return allClosingHours.filter((h) => {
      const [hour] = h.split(':').map(Number);
      return hour > entryH;
    });
  }, [entryTime, allClosingHours]);

  // Auto-ajuste de horas cuando cambia la fecha o se abre el modal
  useEffect(() => {
    if (!parking || step === 'success') return;

    if (date === todayStr && availableEntryHours.length === 0) {
      // La cochera ya cerró por hoy, cambiamos automáticamente a mañana
      setDate(tomorrowStr);
      return;
    }

    if (availableEntryHours.length > 0) {
      if (!entryTime || !availableEntryHours.includes(entryTime)) {
        setEntryTime(availableEntryHours[0]);
        setExitTime('');
      }
    }
  }, [date, todayStr, tomorrowStr, availableEntryHours, parking, entryTime, step]);

  // Reset al abrir (evita resetear el ticket de éxito cuando se refrescan las cocheras)
  const prevOpenRef = useRef(false);
  const prevParkingIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isOpen || !parking) {
      prevOpenRef.current = false;
      return;
    }

    const isNewlyOpened = !prevOpenRef.current && isOpen;
    const isDifferentParking = prevParkingIdRef.current !== parking.id;

    if (isNewlyOpened || isDifferentParking) {
      prevOpenRef.current = true;
      prevParkingIdRef.current = parking.id;

      setStep('vehicle');
      setSubTab('schedule');
      setSelectedVehicle(null);
      setDate(todayStr);
      setEntryTime('');
      setExitTime('');
      setSelectedServiceIds([]);
      setSubmitError(null);
      setCreatedReservation(null);

      // Cargar vehículos
      setLoadingVehicles(true);
      const currentUser = useAuthStore.getState().user;
      const userId = currentUser?.id || currentUser?._id;

      if (userId) {
        getUserVehicle(userId)
          .then((data) => {
            const list = Array.isArray(data) ? data : data?.data || [];
            setVehicles(list);

            if (initialVehicleCategory && list.length > 0) {
              const matching = list.find((v: Vehicle) => typeOfVehicle(v).id === initialVehicleCategory.id);
              if (matching) {
                setSelectedVehicle(matching);
                return;
              }
            }

            if (list.length === 1) {
              setSelectedVehicle(list[0]);
            }
          })
          .catch((err) => console.error('Error cargando vehículos:', err))
          .finally(() => setLoadingVehicles(false));
      } else {
        setLoadingVehicles(false);
      }
    }
  }, [isOpen, parking?.id, todayStr, initialVehicleCategory]);

  // Al volver de Mis vehículos aparecen los recién registrados
  useEffect(() => {
    const currentUser = useAuthStore.getState().user;
    const userId = currentUser?.id || currentUser?._id;
    if (!vehiclesRev || !isOpen || !userId) return;
    getUserVehicle(userId)
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.data || [];
        setVehicles(list);
        setSelectedVehicle((cur) => cur ?? (list.length === 1 ? list[0] : null));
      })
      .catch((err) => console.error('Error cargando vehículos:', err));
  }, [vehiclesRev]);

  // Cargar servicios y precios cuando se selecciona vehículo
  useEffect(() => {
    if (!parking || !selectedVehicle) return;

    const vType = typeOfVehicle(selectedVehicle).id;

    Promise.all([
      getParkingServices(parking.id).catch(() => []),
      getPriceParking(parking.id, vType).catch(() => null),
    ]).then(([servicesRes, priceRes]) => {
      // getParkingServices ya devuelve el arreglo; antes se leía .data y los servicios nunca aparecían
      const sList: ServicePrice[] = Array.isArray(servicesRes) ? servicesRes : servicesRes?.data || [];
      setServices(sList.filter((s: ServicePrice) => s.expirationDate === null));

      if (priceRes?.data?.price !== undefined) {
        setHourlyRate(priceRes.data.price);
      } else if (priceRes?.price !== undefined) {
        setHourlyRate(priceRes.price);
      } else {
        setHourlyRate(null);
      }
    });
  }, [parking, selectedVehicle]);

  const startTime = date && entryTime ? atAR(date, entryTime) : null; // L-04: la hora elegida es de Argentina
  const endTime = date && exitTime ? atAR(date, exitTime) : null;

  const durationHours =
    startTime && endTime && startTime < endTime
      ? Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60))
      : 0;

  const openTimeHHMM = normalizeTimeHHMM(parking?.openingTime);
  const closeTimeHHMM = normalizeTimeHHMM(parking?.closingTime);

  const isHorarioValid = Boolean(
    parking &&
      startTime &&
      endTime &&
      startTime < endTime &&
      (date !== todayStr || startTime.getTime() >= Date.now() - 10 * 60 * 1000) &&
      entryTime >= openTimeHHMM &&
      exitTime <= closeTimeHHMM &&
      durationHours >= (parking.minReservationHours || 1) &&
      durationHours <= (parking.maxReservationHours || 24)
  );

  // Atajos rápidos de duración
  const handleQuickDuration = (hoursCount: number) => {
    if (!entryTime || allClosingHours.length === 0) return;
    const [entryH] = entryTime.split(':').map(Number);
    const targetH = entryH + hoursCount;
    const targetTime = `${String(targetH).padStart(2, '0')}:00`;
    if (allClosingHours.includes(targetTime)) {
      setExitTime(targetTime);
    } else {
      setExitTime(allClosingHours[allClosingHours.length - 1]);
    }
  };

  // Se elige por la tarifa del servicio en esta cochera (ServicePrice.id): es lo que el backend asocia a la reserva y cobra.
  const toggleService = (servicePriceId: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(servicePriceId)
        ? prev.filter((id) => id !== servicePriceId)
        : [...prev, servicePriceId]
    );
  };

  const totalParkingPrice = hourlyRate && durationHours > 0 ? durationHours * hourlyRate : 0;
  const totalServicesPrice = services
    .filter((s) => selectedServiceIds.includes(s.id))
    .reduce((acc, s) => acc + Number(s.price), 0);
  const grandTotal = totalParkingPrice + totalServicesPrice;

  const handleConfirmReservation = async () => {
    if (!parking || !selectedVehicle || !startTime || !endTime || !isHorarioValid) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await createReservation({
        vehicleId: selectedVehicle.id,
        parkingId: parking.id,
        startTime,
        endTime,
        serviceIds: selectedServiceIds,
      });

      setCreatedReservation(res.data || res);
      setStep('success');
      if (onReservationSuccess) onReservationSuccess();
    } catch (err: any) {
      setSubmitError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          'No se pudo confirmar la reserva. Verificá los horarios y disponibilidad.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Al cambiar de paso el foco pasa al primer control del panel (el botón que lo abrió ya no existe).
  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => document.querySelector<HTMLElement>('.owner .layer.on .dbody [role="radio"], .owner .layer.on .dbody select, .owner .layer.on .dbody button')?.focus(), 30);
    return () => clearTimeout(t);
  }, [step, isOpen]);

  if (!parking) return null;

  const vUi = selectedVehicle ? vehicleUi(selectedVehicle) : { label: 'Vehículo', Icon: VICON.AUTO };
  const min = parking.minReservationHours || 1;
  const max = parking.maxReservationHours || 24;
  // El panel de vehículos se abre encima: al cerrarlo (X, fuera o Esc) se vuelve a esta reserva tal como estaba.
  const goRegister = () => onOpenVehicleRegister?.();

  const footer =
    step === 'success' ? (
      <div className="dfoot">
        <button type="button" className="btn" onClick={() => { onClose(); onViewMyReservations?.(); }}>Ver en mis reservas</button>
        <button type="button" className="btn pri" onClick={onClose}>Volver al mapa</button>
      </div>
    ) : (
      <div className="dfoot">
        <button type="button" className="btn" onClick={onClose}>Cancelar</button>
        {step === 'vehicle' ? (
          <button type="button" className="btn pri" disabled={!selectedVehicle || !!blockedFor(parking, selectedVehicle)} onClick={() => setStep('details')}>
            Siguiente<ChevronRight className="i sm" />
          </button>
        ) : (
          <button type="button" className="btn pri" disabled={!isHorarioValid || isSubmitting} aria-busy={isSubmitting || undefined} onClick={handleConfirmReservation}>
            {isSubmitting ? 'Confirmando…' : isHorarioValid ? `Confirmar reserva · ${money(grandTotal)}` : 'Confirmar reserva'}
          </button>
        )}
      </div>
    );

  const spaces = (parking.spaceTypes ?? []).map((t: any) => ({ Icon: iconOf(t.name), label: typePlural(t.name), free: t.available ?? t.capacity, total: t.capacity }));

  return (
    <Presence open={isOpen}>
    <OwnerShell bare>
      <Drawer
        title={step === 'success' ? 'Reserva confirmada' : `Reservar en ${parking.name}`}
        sub={[parking.address, parking.neighborhood, parking.locality].filter(Boolean).join(', ')}
        onClose={onClose}
        onBack={step === 'details' ? () => setStep('vehicle') : undefined}
        focusSel=".dfoot .btn.pri"
        footer={footer}
      >
        <div className="dbody stack">
          {step !== 'success' && <p className="eyebrow">Paso {step === 'vehicle' ? '1' : '2'} de 2 · {step === 'vehicle' ? 'Vehículo' : 'Estadía y servicios'}</p>}

          {/* PASO 1: VEHÍCULO */}
          {step === 'vehicle' && (
            <>
              <section aria-labelledby="bk-disp">
                <h3 id="bk-disp" className="eyebrow">Disponibilidad en {parking.name}</h3>
                <div className="acells">
                  {spaces.map(({ Icon, label, free, total }: any) => (
                    <div key={label} className="acell">
                      <span className="lab"><Icon className="i sm" aria-hidden="true" />{label}</span>
                      <b>{free}</b><span className="of"> / {total}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section aria-labelledby="bk-veh">
                <h3 id="bk-veh" className="eyebrow">Seleccioná tu vehículo</h3>
                {loadingVehicles ? (
                  <div aria-hidden="true" className="rcard"><span className="sk" style={{ height: 14, width: '40%' }} /><span className="sk" style={{ height: 12, width: '65%' }} /></div>
                ) : vehicles.length === 0 ? (
                  <Empty
                    icon={<VICON.AUTO className="i" />}
                    title="No tenés vehículos registrados"
                    action={<button type="button" className="btn pri" onClick={goRegister}><Plus className="i sm" />Registrar vehículo</button>}
                  >
                    Registrá tu vehículo para reservar plazas en cualquier cochera.
                  </Empty>
                ) : (
                  <div className="optlist" role="radiogroup" aria-labelledby="bk-veh">
                    {[...vehicles].sort((a, b) => Number(!!blockedFor(parking, a)) - Number(!!blockedFor(parking, b))).map((v) => {
                      const isSelected = selectedVehicle?.id === v.id;
                      const brandName = typeof v.brand === 'object' ? v.brand?.name : v.brand || '';
                      const modelName = typeof v.model === 'object' ? v.model?.name : v.model || '';
                      const free = getTypeSpaces(parking, typeOfVehicle(v).id);
                      const { Icon, label } = vehicleUi(v);
                      const blocked = blockedFor(parking, v);
                      return (
                        <button key={v.id} type="button" role="radio" aria-checked={isSelected} className="opt" disabled={!!blocked} onClick={() => setSelectedVehicle(v)}>
                          <Icon className="i" aria-hidden="true" />
                          <span className="grow">
                            <span className="plate">{v.plate}</span>
                            <small>{[brandName, modelName].filter(Boolean).join(' ')} · {label} · {blocked ? BLOCKED[blocked] : plural(free, 'plaza libre', 'plazas libres')}</small>
                          </span>
                          {isSelected && <Check className="i" aria-hidden="true" />}
                        </button>
                      );
                    })}
                    <button type="button" className="btn ghost sm" onClick={goRegister}><Plus className="i sm" />Registrar otro vehículo</button>
                  </div>
                )}
              </section>
            </>
          )}

          {/* PASO 2: ESTADÍA, SERVICIOS Y COSTO */}
          {step === 'details' && (
            <>
              <div className="rcard">
                <div className="rtop">
                  <div className="rn nt"><vUi.Icon className="i" aria-hidden="true" /><span className="plate">{selectedVehicle?.plate}</span> · {vUi.label}</div>
                  <button type="button" className="btn ghost sm" onClick={() => setStep('vehicle')}>Cambiar</button>
                </div>
              </div>

              <div className="seg" role="group" aria-label="Sección de la reserva">
                <button type="button" aria-pressed={subTab === 'schedule'} onClick={() => setSubTab('schedule')}>Horario y estadía</button>
                <button type="button" aria-pressed={subTab === 'services'} onClick={() => setSubTab('services')}>
                  Servicios{selectedServiceIds.length > 0 && <b>{selectedServiceIds.length}</b>}
                </button>
              </div>

              {subTab === 'schedule' && (
                <>
                  <Field label="Fecha">
                    {(id, aria) => (
                      <div className="drow">
                        <div className="seg" role="group" aria-label="Atajos de fecha">
                          <button type="button" aria-pressed={date === todayStr} onClick={() => setDate(todayStr)}>Hoy</button>
                          <button type="button" aria-pressed={date === tomorrowStr} onClick={() => setDate(tomorrowStr)}>Mañana</button>
                        </div>
                        <input id={id} {...aria} type="date" className="inp" min={todayStr} value={date} onChange={(e) => setDate(e.target.value)} />
                      </div>
                    )}
                  </Field>
                  <p className="sub">{fmtD(date)} · disponible de {parking.openingTime} a {parking.closingTime} hs</p>

                  <div className="grid2">
                    <Field label="Entrada">
                      {(id, aria) => (
                        <select
                          id={id} {...aria} className="sel" value={entryTime}
                          onChange={(e) => {
                            const newEntry = e.target.value;
                            setEntryTime(newEntry);
                            if (exitTime && Number(exitTime.split(':')[0]) <= Number(newEntry.split(':')[0])) setExitTime('');
                          }}
                        >
                          {availableEntryHours.map((h) => <option key={h} value={h}>{h} hs</option>)}
                        </select>
                      )}
                    </Field>
                    <Field label="Salida">
                      {(id, aria) => (
                        <select id={id} {...aria} className="sel" value={exitTime} onChange={(e) => setExitTime(e.target.value)}>
                          <option value="">Seleccionar</option>
                          {availableExitHours.map((h) => <option key={h} value={h}>{h} hs</option>)}
                        </select>
                      )}
                    </Field>
                  </div>

                  <Field label="Duración rápida" hint={`Estadía de ${plural(min, 'hora', 'horas')} a ${plural(max, 'hora', 'horas')}.`}>
                    {() => (
                      <div className="seg" role="group" aria-label="Duración rápida">
                        {[1, 2, 4, 8].map((h) => (
                          <button key={h} type="button" aria-pressed={durationHours === h && isHorarioValid} onClick={() => handleQuickDuration(h)}>{h} h</button>
                        ))}
                      </div>
                    )}
                  </Field>
                </>
              )}

              {subTab === 'services' && (
                services.length === 0 ? (
                  <Empty icon={<Sparkles className="i" />} title="Sin servicios adicionales">Esta cochera no tiene servicios adicionales configurados.</Empty>
                ) : (
                  <div className="optlist" role="group" aria-label={`Servicios extra en ${parking.name}`}>
                    {services.map((s) => {
                      const checked = selectedServiceIds.includes(s.id);
                      return (
                        <button key={s.id} type="button" role="checkbox" aria-checked={checked} className="opt" onClick={() => toggleService(s.id)}>
                          <span className="grow">
                            {s.serviceCatalog?.name || 'Servicio'}
                            {s.serviceCatalog?.description && <small>{s.serviceCatalog.description}</small>}
                          </span>
                          <span className="tag">+{money(Number(s.price))}</span>
                          {checked && <Check className="i" aria-hidden="true" />}
                        </button>
                      );
                    })}
                  </div>
                )
              )}

              <div className="rcard">
                <dl className="dl sum">
                  <dt>Tarifa por hora</dt><dd>{hourlyRate !== null ? money(hourlyRate) : 'A consultar'}</dd>
                  <dt>Estadía</dt><dd>{durationHours > 0 ? plural(durationHours, 'hora', 'horas') : '—'}</dd>
                  <dt>Subtotal</dt><dd>{money(totalParkingPrice)}</dd>
                  {totalServicesPrice > 0 && (<><dt>Servicios</dt><dd>+{money(totalServicesPrice)}</dd></>)}
                </dl>
                <div className="tot"><span>Total estimado</span><b>{money(grandTotal)}</b></div>
              </div>

              {submitError && <div className="ferr" role="alert"><Clock className="i sm" />{submitError}</div>}
            </>
          )}

          {/* PASO 3: CONFIRMACIÓN */}
          {step === 'success' && (
            <>
              <div className="st ok"><CheckCircle2 className="i" />Tu plaza fue asignada y está garantizada para tu llegada.</div>
              <div className="rcard">
                <dl className="dl sum">
                  {createdReservation?.parkingSpace && (<><dt>Plaza asignada</dt><dd><span className="tag">#{createdReservation.parkingSpace.spaceCode}</span></dd></>)}
                  <dt>Estacionamiento</dt><dd>{parking.name}</dd>
                  <dt>Fecha y horario</dt><dd>{fmtD(date)} · {entryTime} a {exitTime} hs</dd>
                  <dt>Vehículo</dt><dd><span className="plate">{selectedVehicle?.plate}</span></dd>
                </dl>
                <div className="tot"><span>Total estimado</span><b>{money(grandTotal)}</b></div>
              </div>
            </>
          )}
        </div>
      </Drawer>
    </OwnerShell>
    </Presence>
  );
}
