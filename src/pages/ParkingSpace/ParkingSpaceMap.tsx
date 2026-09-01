import { useParams } from 'react-router-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getParkingSpace, getSpaceAvailability } from '../../services/ParkingSpace.js';
import { getOneParking } from '../../services/Parking.js';
import type { Parking } from '../../types/Parking.js';
import type { ParkingSpace } from '@/types/ParkingSpace.js';
import { cn } from '@/lib/utils.js';
import type { ServicePrice } from '@/types/ServicePrice.js';
import { getParkingServices } from '@/services/ServicePrice.js';
import { createReservation } from '../../services/Reservation.js';

interface ReservarState {
  vehicleId: string;
  vehicleType: string;
}

function generateHourOptions(openingTime: string, closingTime: string): string[] {
  const [openHour] = openingTime.split(':').map(Number);
  const [closeHour] = closingTime.split(':').map(Number);
  const hours: string[] = [];
  for (let h = openHour; h <= closeHour; h++) {
    hours.push(`${String(h).padStart(2, '0')}:00`);
  }
  return hours;
}

export function ParkingSpaceMap() {
  const { id } = useParams<{ id: string }>();
  const { state } = useLocation() as { state: ReservarState | null };
  const navigate = useNavigate();
  const [parking, setParking] = useState<Parking | null>(null);
  const [spaces, setSpaces] = useState<ParkingSpace[]>([]);
  const [date, setDate] = useState('');
  const [entryTime, setEntryTime] = useState('');
  const [exitTime, setExitTime] = useState('');
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);
  const [services, setServices] = useState<ServicePrice[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [spacesWithAvailability, setSpacesWithAvailability] = useState<(ParkingSpace & { available: boolean })[] | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [reservationSuccess, setReservationSuccess] = useState(false);

  const startTime = date && entryTime ? new Date(`${date}T${entryTime}:00`) : null;
  const endTime = date && exitTime ? new Date(`${date}T${exitTime}:00`) : null;

  const hourOptions = parking ? generateHourOptions(parking.openingTime, parking.closingTime) : [];

  const isHorarioValid = Boolean(
    parking &&
    startTime &&
    endTime &&
    startTime < endTime &&
    startTime >= new Date() &&
    startTime.getMinutes() === 0 &&
    endTime.getMinutes() === 0 &&
    entryTime >= parking!.openingTime &&
    exitTime <= parking!.closingTime &&
    (endTime.getTime() - startTime.getTime()) >= parking!.minReservationHours * 60 * 60 * 1000 &&
    (endTime.getTime() - startTime.getTime()) <= parking!.maxReservationHours * 60 * 60 * 1000
  );

  const canReserve = isHorarioValid && !!selectedSpaceId && !!state?.vehicleId && !isSubmitting;

  const toggleService = (serviceId: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(serviceId)
        ? prev.filter((sid) => sid !== serviceId)
        : [...prev, serviceId]
    );
  };

  useEffect(() => {
    if (!state?.vehicleId || !state?.vehicleType) {
      navigate('/parking');
      return;
    }
  }, [state]);

  useEffect(() => {
    if (!id) return;

    Promise.all([
      getOneParking(id),
      getParkingSpace(id),
      getParkingServices(id),
    ]).then(([parkingRes, spacesRes, servicesRes]) => {
      setParking(parkingRes.data);
      setSpaces(spacesRes.data);
      setServices(servicesRes.data.filter((s: ServicePrice) => s.expirationDate === null));
    });
  }, [id]);

  const displaySpaces = spaces.map((space) => {
    const availability = spacesWithAvailability?.find((s) => s.id === space.id);
    return {
      ...space,
      available: availability ? availability.available : false,
    };
  });

  useEffect(() => {
    if (!isHorarioValid || !id || !state?.vehicleType || !startTime || !endTime) {
      setSpacesWithAvailability(null);
      setSelectedSpaceId(null);
      return;
    }
    getSpaceAvailability(id, state.vehicleType, startTime, endTime).then((res) => {
      setSpacesWithAvailability(res.data);
      setSelectedSpaceId(null);
    });
  }, [isHorarioValid, startTime?.getTime(), endTime?.getTime()]);

  const columns = displaySpaces.reduce<Record<string, typeof displaySpaces>>((acc, space) => {
    const prefix = space.spaceCode.split('-')[0];
    if (!acc[prefix]) acc[prefix] = [];
    acc[prefix].push(space);
    return acc;
  }, {});

  const handleReservar = async () => {
    if (!canReserve || !id || !state?.vehicleId || !selectedSpaceId || !startTime || !endTime) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await createReservation({
        vehicleId: state.vehicleId,
        parkingId: id,
        parkingSpaceId: selectedSpaceId,
        startTime,
        endTime,
      });
      setReservationSuccess(true);
    } catch (err: any) {
      setSubmitError(err.response?.data?.error ?? 'No se pudo crear la reserva. Intentá de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-8">
      <aside className="w-full md:w-1/3 flex flex-col gap-3">
        <div className="bg-card p-4 rounded-xl shadow-sm border border-border">
          <h2 className="text-lg font-semibold mb-4 text-foreground">Horario</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Fecha de Ingreso</label>
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-sm focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all outline-none"
              />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs text-muted-foreground mb-1">Entrada</label>
                <select
                  value={entryTime}
                  onChange={(e) => setEntryTime(e.target.value)}
                  className="w-full px-2 py-2 bg-background border border-border rounded-lg text-sm focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all outline-none"
                >
                  <option value="">Seleccionar</option>
                  {hourOptions.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs text-muted-foreground mb-1">Salida</label>
                <select
                  value={exitTime}
                  onChange={(e) => setExitTime(e.target.value)}
                  className="w-full px-2 py-2 bg-background border border-border rounded-lg text-sm focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all outline-none"
                >
                  <option value="">Seleccionar</option>
                  {hourOptions.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            </div>
            {date && entryTime && exitTime && !isHorarioValid && (
              <p className="text-xs text-destructive">
                El horario elegido no es válido para esta cochera.
              </p>
            )}
          </div>
        </div>

        <div className="bg-card p-4 rounded-xl shadow-sm border border-border">
          <h2 className="text-lg font-semibold mb-4 text-foreground">Servicios Adicionales</h2>
          <div className="space-y-3">
            {services.map((service) => (
              <label
                key={service.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded border-input text-primary focus:ring-primary"
                  checked={selectedServiceIds.includes(service.serviceCatalog.id)}
                  onChange={() => toggleService(service.serviceCatalog.id)}
                />
                <div className="flex-1">
                  <span className="block text-sm font-medium text-foreground">
                    {service.serviceCatalog.name}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {service.serviceCatalog.description}
                  </span>
                </div>
                <span className="text-sm font-semibold text-primary">+${service.price}</span>
              </label>
            ))}
          </div>
        </div>

        {reservationSuccess ? (
          <div className="p-4 bg-secondary rounded-lg text-secondary-foreground text-center">
            ¡Reserva confirmada!
          </div>
        ) : (
          <>
            {submitError && (
              <p className="text-xs text-destructive mb-2">{submitError}</p>
            )}
            <button
              disabled={!canReserve}
              onClick={handleReservar}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-full text-base font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Reservando...' : 'Continuar a Reserva'}
            </button>
          </>
        )}
      </aside>

      <section className="w-full md:w-2/3 bg-card p-4 rounded-xl shadow-sm border border-border flex flex-col">
        <div className="grid grid-cols-6 gap-x-4 gap-y-6">
          {Object.entries(columns).map(([prefix, columnSpaces]) => (
            <div key={prefix} className="flex flex-col gap-2">
              <div className="text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">{prefix}</div>
              {columnSpaces.map((space) => {
                const isSelected = space.id === selectedSpaceId;
                const canSelect = isHorarioValid && space.available;
                return (
                  <button
                    key={space.id}
                    disabled={!canSelect}
                    onClick={() => setSelectedSpaceId(space.id)}
                    className={cn(
                      'w-12 h-16 rounded-md border flex items-center justify-center text-xs transition-colors',
                      isSelected
                        ? 'bg-primary border-primary text-primary-foreground'
                        : canSelect
                        ? 'bg-green-100 border-green-400 text-green-800 hover:bg-green-200 cursor-pointer dark:bg-green-900 dark:border-green-700 dark:text-green-100 dark:hover:bg-green-800'
                        : 'bg-muted border-border text-muted-foreground/50 cursor-not-allowed'
                    )}
                  >
                    {space.spaceCode}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
