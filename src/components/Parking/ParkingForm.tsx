import React, { useState, useEffect } from 'react';
import {
  Building2,
  MapPin,
  Car,
  Bike,
  Truck,
  Clock,
  Hourglass,
  PlusCircle,
  Hash,
  Plus,
  Minus,
  X,
  Image as ImageIcon,
  Link as LinkIcon,
  Info,
  Layers,
} from 'lucide-react';
import { formInitialState } from './ParkingForm.data.js';
import { LocationPicker, type LocationData } from './LocationPicker';

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
  const [imageLoadError, setImageLoadError] = useState(false);
  const [is24Hours, setIs24Hours] = useState(() => {
    const init = initialData ?? formInitialState;
    return init.openingTime === '00:00' && (init.closingTime === '23:59' || init.closingTime === '24:00');
  });

  useEffect(() => {
    if (initialData) {
      setForm(initialData);
      setImageLoadError(false);
      if (initialData.openingTime === '00:00' && (initialData.closingTime === '23:59' || initialData.closingTime === '24:00')) {
        setIs24Hours(true);
      }
    }
  }, [initialData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    attr: keyof typeof formInitialState
  ) => {
    const val = e.target.value;
    if (attr === 'image') {
      setImageLoadError(false);
    }
    setForm((prev) => ({ ...prev, [attr]: val }));
  };

  const handleCapacityStep = (field: 'carCapacity' | 'motorcycleCapacity' | 'truckCapacity', delta: number) => {
    setForm((prev) => {
      const current = Number(prev[field] || 0);
      const min = field === 'carCapacity' ? 1 : 0;
      const next = Math.max(min, current + delta);
      return { ...prev, [field]: String(next) };
    });
  };

  const handle24HoursToggle = (checked: boolean) => {
    setIs24Hours(checked);
    if (checked) {
      setForm((prev) => ({
        ...prev,
        openingTime: '00:00',
        closingTime: '23:59',
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        openingTime: prev.openingTime === '00:00' ? '08:00' : prev.openingTime,
        closingTime: prev.closingTime === '23:59' ? '22:00' : prev.closingTime,
      }));
    }
  };

  const handleClearImage = () => {
    setImageLoadError(false);
    setForm((prev) => ({ ...prev, image: '' }));
  };

  const handleLocationChange = (loc: LocationData) => {
    setForm((prev) => ({
      ...prev,
      latitude: String(loc.lat),
      longitude: String(loc.lng),
      address: loc.address || prev.address,
      locality: loc.locality || prev.locality,
      postalCode: loc.postalCode || prev.postalCode,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  const inputClass =
    'w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 py-2.5 text-sm focus:border-blue-500 focus:outline-none transition-colors';

  const carCap = Math.max(0, parseInt(form.carCapacity || '0', 10) || 0);
  const motoCap = Math.max(0, parseInt(form.motorcycleCapacity || '0', 10) || 0);
  const truckCap = Math.max(0, parseInt(form.truckCapacity || '0', 10) || 0);
  const totalSpaces = carCap + motoCap + truckCap;

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* COLUMNA IZQUIERDA: Formulario Principal (7 columnas en desktop) */}
        <div className="lg:col-span-7 space-y-6">
          {/* SECCIÓN 1: DATOS GENERALES Y FOTO */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-7 shadow-sm space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-zinc-800">
              <div className="p-2 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Información General
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">Nombre comercial y foto representativa</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1.5">
                Nombre de la Cochera / Sucursal
              </label>
              <div className="relative">
                <Building2 className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 dark:text-zinc-500" />
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleChange(e, 'name')}
                  placeholder="Ej. Estacionamiento Central Pellegrini"
                  className={`${inputClass} pl-10 pr-4`}
                  required
                />
              </div>
            </div>

            {/* Input URL de Imagen con preview en vivo */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1.5">
                  URL de la Foto de Portada / Fachada
                </label>
                <div className="relative">
                  <LinkIcon className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 dark:text-zinc-500" />
                  <input
                    type="url"
                    value={form.image}
                    onChange={(e) => handleChange(e, 'image')}
                    placeholder="https://images.unsplash.com/... o enlace directo a imagen"
                    className={`${inputClass} pl-10 pr-10`}
                  />
                  {form.image && (
                    <button
                      type="button"
                      onClick={handleClearImage}
                      className="absolute right-3 top-3 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition cursor-pointer"
                      title="Limpiar URL"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <p className="mt-1.5 text-[11px] text-slate-400 dark:text-zinc-500">
                  Ingresá el enlace directo a una imagen pública (Unsplash, Imgur, Cloudinary, etc.)
                </p>
              </div>

              {/* Preview de la imagen si hay URL */}
              {form.image && (
                <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 p-2 overflow-hidden">
                  {!imageLoadError ? (
                    <div className="relative h-44 rounded-xl overflow-hidden group bg-slate-100 dark:bg-zinc-900">
                      <img
                        src={form.image}
                        alt="Vista previa de la cochera"
                        className="w-full h-full object-cover"
                        onError={() => setImageLoadError(true)}
                      />
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={handleClearImage}
                          className="p-1.5 rounded-xl bg-black/60 hover:bg-red-600 text-white shadow-lg transition cursor-pointer"
                          title="Eliminar imagen"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="h-28 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center gap-2 p-3 text-amber-600 dark:text-amber-400 text-xs text-center">
                      <ImageIcon className="h-5 w-5 shrink-0" />
                      <span>No se pudo cargar la imagen desde la URL ingresada. Verificá que el enlace sea directo y público.</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* SECCIÓN 2: DIRECCIÓN Y LOCALIDAD */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-7 shadow-sm space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-zinc-800">
              <div className="p-2 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Dirección y Domicilio
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">Datos postales del establecimiento</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1.5">
                  Dirección (Calle y Altura)
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 dark:text-zinc-500" />
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => handleChange(e, 'address')}
                    placeholder="Ej. Av. Pellegrini 1540"
                    className={`${inputClass} pl-10 pr-4`}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1.5">
                  Ciudad / Localidad
                </label>
                <input
                  type="text"
                  value={form.locality}
                  onChange={(e) => handleChange(e, 'locality')}
                  placeholder="Ej. Rosario"
                  className={`${inputClass} px-4`}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1.5">
                  Código Postal
                </label>
                <div className="relative">
                  <Hash className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 dark:text-zinc-500" />
                  <input
                    type="text"
                    value={form.postalCode}
                    onChange={(e) => handleChange(e, 'postalCode')}
                    placeholder="2000"
                    className={`${inputClass} pl-10 pr-4`}
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN 3: ASIGNACIÓN INICIAL DE PLAZAS */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-7 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-600/10 text-emerald-600 dark:text-emerald-400">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Asignación Inicial de Plazas
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Definí la cantidad de plazas físicas con las que empezará tu cochera
                  </p>
                </div>
              </div>

              {/* Badge Contador Total */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 self-start sm:self-auto">
                <span className="text-xs font-semibold">Total a generar:</span>
                <span className="text-xs font-black bg-emerald-600 text-white px-2 py-0.5 rounded-lg">
                  {totalSpaces} {totalSpaces === 1 ? 'plaza' : 'plazas'}
                </span>
              </div>
            </div>

            {/* Banner explicativo de asignación automática */}
            <div className="p-3.5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 flex items-start gap-2.5">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                El sistema creará automáticamente cada plaza individual con su código correlativo (ej: <span className="font-mono font-bold text-slate-800 dark:text-zinc-200">A-01, M-01, C-01</span>). Desde el panel de administración podrás sumar más plazas o modificar su estado cuando lo desees.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Plazas Autos */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                    <Car className="h-4 w-4 text-blue-500" /> Autos / Sedanes
                  </span>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold bg-blue-500/10 px-2 py-0.5 rounded-md">
                    Mín. 1
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCapacityStep('carCapacity', -1)}
                    className="p-2 rounded-xl bg-white dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 transition cursor-pointer"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={form.carCapacity}
                    onChange={(e) => handleChange(e, 'carCapacity')}
                    placeholder="1"
                    className="w-full text-center font-bold text-sm bg-transparent border-0 text-slate-900 dark:text-white focus:outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => handleCapacityStep('carCapacity', 1)}
                    className="p-2 rounded-xl bg-white dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 transition cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="text-[11px] text-center text-slate-500 dark:text-zinc-400 font-mono">
                  {carCap > 0 ? `A-01 a A-${String(carCap).padStart(2, '0')}` : 'Sin plazas'}
                </div>
              </div>

              {/* Plazas Motos */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                    <Bike className="h-4 w-4 text-emerald-500" /> Motos
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium bg-slate-200/60 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                    Opcional
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCapacityStep('motorcycleCapacity', -1)}
                    className="p-2 rounded-xl bg-white dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 transition cursor-pointer"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <input
                    type="number"
                    min="0"
                    value={form.motorcycleCapacity}
                    onChange={(e) => handleChange(e, 'motorcycleCapacity')}
                    placeholder="0"
                    className="w-full text-center font-bold text-sm bg-transparent border-0 text-slate-900 dark:text-white focus:outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => handleCapacityStep('motorcycleCapacity', 1)}
                    className="p-2 rounded-xl bg-white dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 transition cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="text-[11px] text-center text-slate-500 dark:text-zinc-400 font-mono">
                  {motoCap > 0 ? `M-01 a M-${String(motoCap).padStart(2, '0')}` : 'Sin plazas'}
                </div>
              </div>

              {/* Plazas Utilitarios */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                    <Truck className="h-4 w-4 text-purple-500" /> Utilitarios / SUVs
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium bg-slate-200/60 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                    Opcional
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCapacityStep('truckCapacity', -1)}
                    className="p-2 rounded-xl bg-white dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 transition cursor-pointer"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <input
                    type="number"
                    min="0"
                    value={form.truckCapacity}
                    onChange={(e) => handleChange(e, 'truckCapacity')}
                    placeholder="0"
                    className="w-full text-center font-bold text-sm bg-transparent border-0 text-slate-900 dark:text-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleCapacityStep('truckCapacity', 1)}
                    className="p-2 rounded-xl bg-white dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 transition cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="text-[11px] text-center text-slate-500 dark:text-zinc-400 font-mono">
                  {truckCap > 0 ? `C-01 a C-${String(truckCap).padStart(2, '0')}` : 'Sin plazas'}
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN 4: HORARIOS Y POLÍTICAS DE RESERVA */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-7 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-600/10 text-purple-600 dark:text-purple-400">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Horarios y Reservas
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">Turnos de operación y límites</p>
                </div>
              </div>

              {/* Switch Abierto 24 Horas */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={is24Hours}
                  onChange={(e) => handle24HoursToggle(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                  Abierto 24 horas
                </span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1.5">
                  Hora de Apertura {is24Hours && <span className="text-blue-500 font-normal">(24h)</span>}
                </label>
                <div className="relative">
                  <Clock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 dark:text-zinc-500" />
                  <input
                    type="time"
                    value={form.openingTime}
                    disabled={is24Hours}
                    onChange={(e) => handleChange(e, 'openingTime')}
                    className={`${inputClass} pl-10 pr-4 disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-zinc-800`}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1.5">
                  Hora de Cierre {is24Hours && <span className="text-blue-500 font-normal">(24h)</span>}
                </label>
                <div className="relative">
                  <Clock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 dark:text-zinc-500" />
                  <input
                    type="time"
                    value={form.closingTime}
                    disabled={is24Hours}
                    onChange={(e) => handleChange(e, 'closingTime')}
                    className={`${inputClass} pl-10 pr-4 disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-zinc-800`}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1.5">
                  Mínimo (Horas)
                </label>
                <div className="relative">
                  <Hourglass className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 dark:text-zinc-500" />
                  <input
                    type="number"
                    min="1"
                    value={form.minReservationHours}
                    onChange={(e) => handleChange(e, 'minReservationHours')}
                    placeholder="1"
                    className={`${inputClass} pl-10 pr-3`}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1.5">
                  Máximo (Horas)
                </label>
                <div className="relative">
                  <Hourglass className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 dark:text-zinc-500" />
                  <input
                    type="number"
                    min="1"
                    value={form.maxReservationHours}
                    onChange={(e) => handleChange(e, 'maxReservationHours')}
                    placeholder="24"
                    className={`${inputClass} pl-10 pr-3`}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-zinc-300 mb-1.5">
                  Margen Tolerancia (hs)
                </label>
                <div className="relative">
                  <Hourglass className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 dark:text-zinc-500" />
                  <input
                    type="number"
                    min="0"
                    value={form.reservationMargin}
                    onChange={(e) => handleChange(e, 'reservationMargin')}
                    placeholder="1"
                    className={`${inputClass} pl-10 pr-3`}
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: Mapa Sticky y Botón de Acción (5 columnas en desktop) */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-6">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-zinc-800">
              <div className="p-2 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Ubicación Exacta
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">Fijá el pin en la entrada del local</p>
              </div>
            </div>

            <LocationPicker
              lat={Number(form.latitude)}
              lng={Number(form.longitude)}
              defaultLocality={form.locality}
              defaultPostalCode={form.postalCode}
              onChangeLocation={handleLocationChange}
            />
          </div>

          {/* Botón de Envío Principal */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-xl shadow-blue-600/20 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
          >
            <PlusCircle className="h-5 w-5" />
            <span>{submitLabel}</span>
          </button>
        </div>
      </div>
    </form>
  );
};

export default ParkingForm;