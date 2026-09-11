import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  X,
  Car,
  Calendar,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Building2,
  MapPin,
  Check,
} from 'lucide-react';
import { getUserVehicle } from '../../services/vehicleService';
import { getPriceParking } from '../../services/Parking';
import { getParkingServices } from '../../services/ServicePrice';
import { createReservation } from '../../services/Reservation';
import type { Parking } from '../../types/Parking';
import type { Vehicle } from '../../types/vehicle.types';
import type { ServicePrice } from '../../types/ServicePrice';
import type { VehicleFilterType } from '../../types/MapFilters';
import { matchesVehicleCategory } from '../../utils/parkingPriceUtils';

interface ReservationBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  parking: Parking | null;
  initialVehicleCategory?: VehicleFilterType | null;
  onOpenVehicleRegister?: () => void;
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

const normalizeVehicleType = (rawType: any): string => {
  const typeName = String(rawType?.name || rawType || '').trim().toUpperCase();
  if (typeName.includes('MOTO')) return 'MOTOCICLETA';
  if (typeName.includes('CAMIONETA') || typeName.includes('VAN') || typeName.includes('UTIL')) return 'CAMIONETA';
  return 'AUTO';
};

const getVehicleDisplayInfo = (v: Vehicle | null) => {
  if (!v) return { icon: '🚗', label: 'Auto' };
  const type = normalizeVehicleType(v.vehicleType);
  if (type === 'MOTOCICLETA') return { icon: '🛵', label: 'Moto' };
  if (type === 'CAMIONETA') return { icon: '🛻', label: 'Camioneta' };
  return { icon: '🚗', label: 'Auto' };
};

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

export function ReservationBookingModal({
  isOpen,
  onClose,
  parking,
  initialVehicleCategory,
  onOpenVehicleRegister,
  onViewMyReservations,
  onReservationSuccess,
}: ReservationBookingModalProps) {
  const [step, setStep] = useState<'vehicle' | 'details' | 'success'>('vehicle');
  const [subTab, setSubTab] = useState<'schedule' | 'services'>('schedule');

  // Vehículos del usuario
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  // Fechas base
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);

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
      const now = new Date();
      const currentH = now.getHours();
      const currentM = now.getMinutes();
      const nextH = currentM > 0 ? currentH + 1 : currentH;
      startH = Math.max(openH, nextH);
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
  const prevOpenRef = React.useRef(false);
  const prevParkingIdRef = React.useRef<string | null>(null);

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
      const userId =
        localStorage.getItem('user_id') ||
        JSON.parse(localStorage.getItem('user') || '{}')?.id;

      if (userId) {
        getUserVehicle(userId)
          .then((data) => {
            const list = Array.isArray(data) ? data : data?.data || [];
            setVehicles(list);

            if (initialVehicleCategory && list.length > 0) {
              const matching = list.find((v: Vehicle) => {
                const typeName = typeof v.vehicleType === 'object' ? (v.vehicleType as any)?.name : String(v.vehicleType || '');
                return matchesVehicleCategory(typeName, initialVehicleCategory);
              });
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

  // Cargar servicios y precios cuando se selecciona vehículo
  useEffect(() => {
    if (!parking || !selectedVehicle) return;

    const vType = normalizeVehicleType(selectedVehicle.vehicleType);

    Promise.all([
      getParkingServices(parking.id).catch(() => ({ data: [] })),
      getPriceParking(parking.id, vType).catch(() => null),
    ]).then(([servicesRes, priceRes]) => {
      const sList = servicesRes.data || [];
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

  const startTime = date && entryTime ? new Date(`${date}T${entryTime}:00`) : null;
  const endTime = date && exitTime ? new Date(`${date}T${exitTime}:00`) : null;

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

  const toggleService = (serviceCatalogId: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(serviceCatalogId)
        ? prev.filter((id) => id !== serviceCatalogId)
        : [...prev, serviceCatalogId]
    );
  };

  const totalParkingPrice = hourlyRate && durationHours > 0 ? durationHours * hourlyRate : 0;
  const totalServicesPrice = services
    .filter((s) => selectedServiceIds.includes(s.serviceCatalog.id))
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

  const vehicleInfo = getVehicleDisplayInfo(selectedVehicle);

  if (!isOpen || !parking) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70  animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-xl w-full max-h-[90vh] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* 1. ENCABEZADO */}
        <div className="p-4 sm:p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-950/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-600/20">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white leading-tight">
                {step === 'success' ? 'Â¡Reserva Confirmada!' : `Reservar en ${parking.name}`}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3 text-blue-500 shrink-0" />
                {parking.address}, {parking.locality}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* STEPPER INDICATOR */}
        {step !== 'success' && (
          <div className="px-6 py-2 bg-zinc-50 dark:bg-zinc-950/20 border-b border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[11px] ${
                  step === 'vehicle'
                    ? 'bg-blue-600 text-white'
                    : 'bg-emerald-500 text-white'
                }`}
              >
                {step === 'vehicle' ? '1' : <Check className="h-3 w-3" />}
              </span>
              <span className={step === 'vehicle' ? 'font-bold text-zinc-900 dark:text-white' : 'text-zinc-500'}>
                1. Vehículo
              </span>
            </div>

            <div className="w-8 h-[1px] bg-zinc-200 dark:bg-zinc-800" />

            <div className="flex items-center gap-2">
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[11px] ${
                  step === 'details'
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'
                }`}
              >
                2
              </span>
              <span className={step === 'details' ? 'font-bold text-zinc-900 dark:text-white' : 'text-zinc-500'}>
                2. Estadía & Servicios
              </span>
            </div>
          </div>
        )}

        {/* CUERPO DEL MODAL */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          
          {/* ========================================================= */}
          {/* PASO 1: SELECCIONAR VEHÃCULO */}
          {/* ========================================================= */}
          {step === 'vehicle' && (
            <div className="space-y-3.5 animate-in fade-in">
              <div>
                <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
                  Seleccioná tu vehículo
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Asignaremos automáticamente la plaza según la categoría.
                </p>
              </div>

              {/* Resumen de disponibilidad de la cochera */}
              <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                  Disponibilidad en {parking.name}:
                </span>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800">
                    <span className="text-[10px] text-zinc-400 font-medium block">🚗 Autos</span>
                    <span className="font-extrabold text-blue-600 dark:text-blue-400">
                      {parking.availableCarSpaces ?? parking.carCapacity ?? 0}
                    </span>
                    <span className="text-[10px] text-zinc-400"> / {parking.carCapacity ?? 0}</span>
                  </div>
                  <div className="p-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800">
                    <span className="text-[10px] text-zinc-400 font-medium block">🛵 Motos</span>
                    <span className="font-extrabold text-purple-600 dark:text-purple-400">
                      {parking.availableMotorcycleSpaces ?? parking.motorcycleCapacity ?? 0}
                    </span>
                    <span className="text-[10px] text-zinc-400"> / {parking.motorcycleCapacity ?? 0}</span>
                  </div>
                  <div className="p-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800">
                    <span className="text-[10px] text-zinc-400 font-medium block">🛻 Camionetas</span>
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                      {parking.availableTruckSpaces ?? parking.truckCapacity ?? 0}
                    </span>
                    <span className="text-[10px] text-zinc-400"> / {parking.truckCapacity ?? 0}</span>
                  </div>
                </div>
              </div>

              {loadingVehicles ? (
                <div className="py-8 flex flex-col items-center justify-center gap-2 text-zinc-400">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs">Cargando tus vehículos...</span>
                </div>
              ) : vehicles.length === 0 ? (
                <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 text-center space-y-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto">
                    <Car className="h-5 w-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-zinc-900 dark:text-white">No tenés vehículos registrados</h5>
                    <p className="text-[11px] text-zinc-500 mt-0.5 max-w-xs mx-auto">
                      Registrá tu vehículo para poder reservar plazas en cualquier cochera.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      if (onOpenVehicleRegister) onOpenVehicleRegister();
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-blue-600/25"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Registrar Vehículo</span>
                  </button>
                </div>
              ) : (
                <div className="grid gap-2">
                  {vehicles.map((v) => {
                    const isSelected = selectedVehicle?.id === v.id;
                    const typeName = normalizeVehicleType(v.vehicleType);
                    const brandName = typeof v.brand === 'object' ? v.brand?.name : v.brand || '';
                    const modelName = typeof v.model === 'object' ? v.model?.name : v.model || '';

                    const availableCount =
                      typeName === 'MOTOCICLETA'
                        ? parking.availableMotorcycleSpaces ?? parking.motorcycleCapacity ?? 0
                        : typeName === 'CAMIONETA'
                        ? parking.availableTruckSpaces ?? parking.truckCapacity ?? 0
                        : parking.availableCarSpaces ?? parking.carCapacity ?? 0;

                    return (
                      <div
                        key={v.id}
                        onClick={() => setSelectedVehicle(v)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-blue-50/50 dark:bg-blue-950/30 border-blue-500 ring-2 ring-blue-500/30 shadow-sm'
                            : 'bg-zinc-50 dark:bg-zinc-950/60 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`p-2 rounded-xl shrink-0 ${
                              isSelected
                                ? 'bg-blue-600 text-white'
                                : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                            }`}
                          >
                            <Car className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="px-1.5 py-0.5 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-mono font-extrabold text-xs text-zinc-900 dark:text-white">
                                {v.plate}
                              </span>
                              <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                                {brandName} {modelName}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <span className="text-[11px] text-zinc-500 font-medium">
                                Categoría: {typeName}
                              </span>
                              <span className="text-zinc-300 dark:text-zinc-700">•</span>
                              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                {availableCount} plaza(s) libres
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0">
                          {isSelected ? (
                            <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                              <Check className="h-3 w-3" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full border border-zinc-300 dark:border-zinc-700" />
                          )}
                        </div>
                      </div>
                    );
                  })}

                  <div className="pt-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        if (onOpenVehicleRegister) onOpenVehicleRegister();
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Registrar otro vehículo</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* PASO 2: HORARIOS, SERVICIOS Y COSTOS */}
          {/* ========================================================= */}
          {step === 'details' && (
            <div className="space-y-3.5 animate-in fade-in">
              {/* 2. VEHÃCULO SELECCIONADO */}
              <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-medium">
                  <span className="text-sm">{vehicleInfo.icon}</span>
                  <span className="font-mono font-bold tracking-wide uppercase">{selectedVehicle?.plate}</span>
                  <span className="text-zinc-400 dark:text-zinc-500">Â·</span>
                  <span className="text-zinc-600 dark:text-zinc-400">{vehicleInfo.label}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setStep('vehicle')}
                  className="text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer transition-colors"
                >
                  Cambiar
                </button>
              </div>

              {/* 3. TABS */}
              <div className="flex p-1 bg-zinc-100 dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setSubTab('schedule')}
                  className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    subTab === 'schedule'
                      ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  <Clock className="h-3.5 w-3.5 text-blue-500" />
                  <span>Horario & Estadía</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSubTab('services')}
                  className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    subTab === 'services'
                      ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                  <span>
                    Servicios adicionales {selectedServiceIds.length > 0 ? `(${selectedServiceIds.length})` : '(opcional)'}
                  </span>
                </button>
              </div>

              {/* PESTAÑA A: HORARIO */}
              {subTab === 'schedule' && (
                <div className="space-y-3.5 animate-in fade-in">
                  {/* 4. FECHA */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200">
                      1. Fecha
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setDate(todayStr)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          date === todayStr
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                        }`}
                      >
                        Hoy
                      </button>
                      <button
                        type="button"
                        onClick={() => setDate(tomorrowStr)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          date === tomorrowStr
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                        }`}
                      >
                        Mañana
                      </button>
                      <input
                        type="date"
                        min={todayStr}
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="flex-1 min-w-[140px] px-3.5 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-medium text-zinc-900 dark:text-white outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* 5. HORARIO DE ESTADÃA */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200">
                        2. Horario de estadía
                      </label>
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        Disponible de {parking.openingTime} a {parking.closingTime}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block mb-1 font-medium">
                          Entrada
                        </span>
                        <select
                          value={entryTime}
                          onChange={(e) => {
                            const newEntry = e.target.value;
                            setEntryTime(newEntry);
                            if (exitTime) {
                              const [newH] = newEntry.split(':').map(Number);
                              const [exitH] = exitTime.split(':').map(Number);
                              if (exitH <= newH) {
                                setExitTime('');
                              }
                            }
                          }}
                          className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-zinc-900 dark:text-white outline-none focus:border-blue-500 cursor-pointer"
                        >
                          {availableEntryHours.map((h) => (
                            <option key={h} value={h}>
                              {h} hs
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block mb-1 font-medium">
                          Salida
                        </span>
                        <select
                          value={exitTime}
                          onChange={(e) => setExitTime(e.target.value)}
                          className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-zinc-900 dark:text-white outline-none focus:border-blue-500 cursor-pointer"
                        >
                          <option value="">Seleccionar</option>
                          {availableExitHours.map((h) => (
                            <option key={h} value={h}>
                              {h} hs
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* 6. DURACIÃ“N RÃPIDA */}
                    <div className="space-y-1 pt-0.5">
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium block">
                        Duración rápida
                      </span>
                      <div className="flex items-center gap-2">
                        {[1, 2, 4, 8].map((h) => {
                          const isActive = durationHours === h && isHorarioValid;
                          return (
                            <button
                              key={h}
                              type="button"
                              onClick={() => handleQuickDuration(h)}
                              className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                isActive
                                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25 ring-2 ring-blue-500/40'
                                  : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700'
                              }`}
                            >
                              {h}h
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* PESTAÑA B: SERVICIOS ADICIONALES */}
              {subTab === 'services' && (
                <div className="space-y-3 animate-in fade-in">
                  <div>
                    <h5 className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                      <span>Servicios Extras en {parking.name}</span>
                    </h5>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Seleccioná los servicios que deseás incluir durante tu estadía.
                    </p>
                  </div>

                  {services.length === 0 ? (
                    <div className="py-6 text-center p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500">
                      Esta cochera no posee servicios adicionales configurados actualmente.
                    </div>
                  ) : (
                    <div className="grid gap-2">
                      {services.map((s) => {
                        const isChecked = selectedServiceIds.includes(s.serviceCatalog.id);
                        return (
                          <label
                            key={s.id}
                            className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                              isChecked
                                ? 'bg-purple-50/50 dark:bg-purple-950/30 border-purple-500 ring-1 ring-purple-500/30'
                                : 'bg-zinc-50 dark:bg-zinc-950/60 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleService(s.serviceCatalog.id)}
                                className="rounded border-zinc-300 text-purple-600 focus:ring-purple-500 h-4 w-4 cursor-pointer"
                              />
                              <div className="min-w-0">
                                <span className="text-xs font-bold text-zinc-900 dark:text-white block truncate">
                                  {s.serviceCatalog?.name || 'Servicio'}
                                </span>
                                {s.serviceCatalog?.description && (
                                  <span className="text-[11px] text-zinc-500 truncate block mt-0.5">
                                    {s.serviceCatalog.description}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 shrink-0">
                              +${Number(s.price).toLocaleString('es-AR')}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  <div className="pt-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setSubTab('schedule')}
                      className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      &larr; Volver a configurar Horarios
                    </button>
                  </div>
                </div>
              )}

              {/* 7. PRECIO / RESUMEN ESTIMADO */}
              <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 space-y-1.5 text-xs">
                <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                  <span>Tarifa por hora</span>
                  <span className="font-semibold text-zinc-900 dark:text-white">
                    {hourlyRate !== null ? `$${hourlyRate.toLocaleString('es-AR')}` : 'A consultar'}
                  </span>
                </div>
                <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                  <span>Estadía</span>
                  <span className="font-semibold text-zinc-900 dark:text-white">
                    {durationHours > 0 ? `${durationHours} ${durationHours === 1 ? 'hora' : 'horas'}` : '-'}
                  </span>
                </div>

                <div className="h-[1px] bg-zinc-200/80 dark:bg-zinc-800 my-1" />

                <div className="flex justify-between text-zinc-700 dark:text-zinc-300">
                  <span>Subtotal</span>
                  <span className="font-semibold text-zinc-900 dark:text-white">
                    ${totalParkingPrice.toLocaleString('es-AR')}
                  </span>
                </div>

                {totalServicesPrice > 0 && (
                  <div className="flex justify-between text-purple-600 dark:text-purple-400">
                    <span>Servicios</span>
                    <span className="font-semibold">+${totalServicesPrice.toLocaleString('es-AR')}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center text-xs sm:text-sm font-bold text-zinc-900 dark:text-white">
                  <span>Total estimado</span>
                  <span className="text-base font-extrabold text-blue-600 dark:text-blue-400">
                    ${grandTotal.toLocaleString('es-AR')}
                  </span>
                </div>
              </div>

              {submitError && (
                <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold">
                  {submitError}
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* PASO 3: Ã‰XITO Y TICKET DE CONFIRMACIÃ“N */}
          {/* ========================================================= */}
          {step === 'success' && (
            <div className="py-4 flex flex-col items-center justify-center text-center space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-14 h-14 rounded-3xl bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 flex items-center justify-center shadow-xl shadow-emerald-500/10">
                <CheckCircle2 className="h-8 w-8" />
              </div>

              <div className="max-w-md space-y-1">
                <h4 className="text-lg font-extrabold text-zinc-900 dark:text-white">
                  Â¡Reserva Exitosa!
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Tu plaza fue asignada automáticamente y está garantizada para tu llegada.
                </p>
              </div>

              <div className="w-full p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-left space-y-2 text-xs">
                {createdReservation?.parkingSpace && (
                  <div className="flex justify-between items-center pb-2 border-b border-zinc-200/60 dark:border-zinc-800">
                    <span className="text-zinc-500">Plaza Asignada:</span>
                    <span className="px-2.5 py-0.5 rounded-lg bg-blue-600 text-white font-mono font-black text-sm">
                      #{createdReservation.parkingSpace.spaceCode}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-zinc-700 dark:text-zinc-300">
                  <span className="text-zinc-500">Estacionamiento:</span>
                  <span className="font-bold">{parking.name}</span>
                </div>
                <div className="flex justify-between text-zinc-700 dark:text-zinc-300">
                  <span className="text-zinc-500">Fecha y Horario:</span>
                  <span className="font-semibold">
                    {date} • {entryTime} a {exitTime} hs
                  </span>
                </div>
                <div className="flex justify-between text-zinc-700 dark:text-zinc-300">
                  <span className="text-zinc-500">Vehículo:</span>
                  <span className="font-mono font-bold uppercase">{selectedVehicle?.plate}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-zinc-200/60 dark:border-zinc-800 font-bold text-zinc-900 dark:text-white">
                  <span>Total Abonado/Estimado:</span>
                  <span className="text-blue-600 dark:text-blue-400 font-black">
                    ${grandTotal.toLocaleString('es-AR')}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 w-full pt-1">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onViewMyReservations) onViewMyReservations();
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-bold transition-colors cursor-pointer"
                >
                  Ver en Mis Reservas
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/25 transition-all cursor-pointer"
                >
                  Volver al Mapa
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 8 & 9. PIE DE ACCIONES: BOTÃ“N VOLVER Y CONFIRMACIÃ“N */}
        {step !== 'success' && (
          <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 flex items-center justify-between shrink-0">
            {step === 'details' ? (
              <button
                type="button"
                onClick={() => setStep('vehicle')}
                className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Volver</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            )}

            {step === 'vehicle' ? (
              <button
                type="button"
                disabled={!selectedVehicle}
                onClick={() => setStep('details')}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5"
              >
                <span>Siguiente</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={!isHorarioValid || isSubmitting}
                onClick={handleConfirmReservation}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>
                  {isSubmitting
                    ? 'Confirmando...'
                    : isHorarioValid
                    ? `Confirmar reserva Â· $${grandTotal.toLocaleString('es-AR')}`
                    : 'Confirmar reserva'}
                </span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ReservationBookingModal;


