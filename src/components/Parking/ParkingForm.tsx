import React, { useState } from 'react';
import {
  Building2,
  MapPin,
  Car,
  Bike,
  Truck,
  Clock,
  Hourglass,
  ImageIcon,
  PlusCircle,
  Hash,
} from 'lucide-react';
import { formInitialState } from './ParkingForm.data.js';
import { LocationPicker } from './LocationPicker';

type ParkingFormProps = {
  onSubmit: (form: typeof formInitialState) => void;
  initialData?: typeof formInitialState;
  submitLabel?: string;
  isSubmitting?: boolean;
};

export const ParkingForm: React.FC<ParkingFormProps> = ({
  onSubmit,
  initialData,
  submitLabel = 'Guardar Estacionamiento',
  isSubmitting = false,
}) => {
  const [form, setForm] = useState(initialData ?? formInitialState);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    attr: keyof typeof formInitialState
  ) => {
    setForm((prev) => ({ ...prev, [attr]: e.target.value }));
  };

  const handleLocationChange = (locationData: {
    lat: number;
    lng: number;
    address?: string;
    locality?: string;
    postalCode?: string;
  }) => {
    setForm((prev) => ({
      ...prev,
      latitude: String(locationData.lat),
      longitude: String(locationData.lng),
      address: locationData.address || prev.address,
      locality: locationData.locality || prev.locality,
      postalCode: locationData.postalCode || prev.postalCode,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* SECCIÓN 1: DATOS GENERALES */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2 border-b border-zinc-800 pb-2">
          <Building2 className="h-4 w-4" />
          Información General
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Nombre de la Cochera / Playa
            </label>
            <div className="relative">
              <Building2 className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleChange(e, 'name')}
                placeholder="Ej. Estacionamiento Central"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950/70 pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-blue-500 focus:outline-none transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              URL de la Imagen
            </label>
            <div className="relative">
              <ImageIcon className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500" />
              <input
                type="url"
                value={form.image}
                onChange={(e) => handleChange(e, 'image')}
                placeholder="https://ejemplo.com/foto.jpg"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950/70 pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-blue-500 focus:outline-none transition-colors"
                required
              />
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: UBICACIÓN Y MAPA */}
      <div className="space-y-4 pt-2">
        <h3 className="text-sm font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2 border-b border-zinc-800 pb-2">
          <MapPin className="h-4 w-4" />
          Ubicación Geográfica
        </h3>

        {/* Mapa interactivo MapTiler */}
        <LocationPicker
          lat={Number(form.latitude)}
          lng={Number(form.longitude)}
          onChangeLocation={handleLocationChange}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Dirección (Calle y Altura)
            </label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                value={form.address}
                onChange={(e) => handleChange(e, 'address')}
                placeholder="Ej. Av. Pellegrini 1500"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950/70 pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-blue-500 focus:outline-none transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Localidad / Ciudad
            </label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                value={form.locality}
                onChange={(e) => handleChange(e, 'locality')}
                placeholder="Ej. Rosario"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950/70 pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-blue-500 focus:outline-none transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Código Postal
            </label>
            <div className="relative">
              <Hash className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500" />
              <input
                type="number"
                value={form.postalCode}
                onChange={(e) => handleChange(e, 'postalCode')}
                placeholder="2000"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950/70 pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-blue-500 focus:outline-none transition-colors"
                required
              />
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN 3: CAPACIDADES (PLAZAS) */}
      <div className="space-y-4 pt-2">
        <h3 className="text-sm font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2 border-b border-zinc-800 pb-2">
          <Car className="h-4 w-4" />
          Capacidad de Plazas
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Plazas para Autos
            </label>
            <div className="relative">
              <Car className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500" />
              <input
                type="number"
                min="0"
                value={form.carCapacity}
                onChange={(e) => handleChange(e, 'carCapacity')}
                placeholder="0"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950/70 pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-blue-500 focus:outline-none transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Plazas para Motos
            </label>
            <div className="relative">
              <Bike className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500" />
              <input
                type="number"
                min="0"
                value={form.motorcycleCapacity}
                onChange={(e) => handleChange(e, 'motorcycleCapacity')}
                placeholder="0"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950/70 pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-blue-500 focus:outline-none transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Plazas para Camiones / Otros
            </label>
            <div className="relative">
              <Truck className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500" />
              <input
                type="number"
                min="0"
                value={form.truckCapacity}
                onChange={(e) => handleChange(e, 'truckCapacity')}
                placeholder="0"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950/70 pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-blue-500 focus:outline-none transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN 4: HORARIOS Y RESERVAS */}
      <div className="space-y-4 pt-2">
        <h3 className="text-sm font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2 border-b border-zinc-800 pb-2">
          <Clock className="h-4 w-4" />
          Horarios y Políticas de Reserva
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Hora de Apertura
            </label>
            <div className="relative">
              <Clock className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500" />
              <input
                type="time"
                value={form.openingTime}
                onChange={(e) => handleChange(e, 'openingTime')}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950/70 pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-blue-500 focus:outline-none transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Hora de Cierre
            </label>
            <div className="relative">
              <Clock className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500" />
              <input
                type="time"
                value={form.closingTime}
                onChange={(e) => handleChange(e, 'closingTime')}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950/70 pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-blue-500 focus:outline-none transition-colors"
                required
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Mínimo de Horas
            </label>
            <div className="relative">
              <Hourglass className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500" />
              <input
                type="number"
                min="1"
                value={form.minReservationHours}
                onChange={(e) => handleChange(e, 'minReservationHours')}
                placeholder="1"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950/70 pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-blue-500 focus:outline-none transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Máximo de Horas
            </label>
            <div className="relative">
              <Hourglass className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500" />
              <input
                type="number"
                min="1"
                value={form.maxReservationHours}
                onChange={(e) => handleChange(e, 'maxReservationHours')}
                placeholder="24"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950/70 pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-blue-500 focus:outline-none transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Margen de Reserva (Horas)
            </label>
            <div className="relative">
              <Hourglass className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500" />
              <input
                type="number"
                min="0"
                value={form.reservationMargin}
                onChange={(e) => handleChange(e, 'reservationMargin')}
                placeholder="1"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950/70 pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-blue-500 focus:outline-none transition-colors"
                required
              />
            </div>
          </div>
        </div>
      </div>

      {/* BOTÓN DE GUARDAR */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full mt-8 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/20 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
      >
        <PlusCircle className="h-4 w-4" />
        <span>{submitLabel}</span>
      </button>
    </form>
  );
};

export default ParkingForm;