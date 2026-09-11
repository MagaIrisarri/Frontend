import React from 'react';
import {
  X,
  Car,
  Bike,
  Truck,
  CheckCircle2,
  Clock,
  User,
  AlertTriangle,
  Loader2,
  Trash2,
  ShieldAlert,
} from 'lucide-react';
import type { ParkingSpaceEditProps } from '../../hooks/useParkingSpaceEdit';

export const ParkingSpaceDrawer: React.FC<ParkingSpaceEditProps> = ({
  selectedSpace,
  setSelectedSpaceId,
  activeReservationForSelected,
  isUpdatingState,
  drawerError,
  drawerSuccess,
  handleUpdateSpaceState,
  requestDeleteSpace,
}) => {
  if (!selectedSpace) return null;

  const state = selectedSpace.state || 'LIBRE';
  const isLibre = state === 'LIBRE';
  const isOcupado = state === 'OCUPADO';
  const isMantenimiento = state === 'MANTENIMIENTO';
  const vType = selectedSpace.vehicleType || (selectedSpace as any).vehicle_type || 'Auto';
  const vTypeNormalized = vType.toUpperCase();
  const isMoto = vTypeNormalized.includes('MOTO');
  const isCamioneta = vTypeNormalized.includes('CAMION') || vTypeNormalized.includes('UTIL');
  const VehicleIcon = isMoto ? Bike : isCamioneta ? Truck : Car;
  const vehicleLabel = isMoto ? 'Moto' : isCamioneta ? 'Camioneta / Utilitario' : 'Auto / Sedán';

  return (
    <aside className="w-full lg:w-80 shrink-0 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-5 h-fit sticky top-24">
      {/* Header del Drawer */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <VehicleIcon className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-mono font-bold text-base text-slate-900 dark:text-white">
              Plaza {selectedSpace.spaceCode || (selectedSpace as any).id_parking_space || `#${selectedSpace.id}`}
            </h3>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 border ${
                isLibre
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                  : isOcupado
                  ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20'
                  : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isLibre ? 'bg-emerald-500' : isOcupado ? 'bg-blue-600' : 'bg-amber-500'
                }`}
              />
              {isLibre ? 'Libre' : isOcupado ? 'Ocupada' : 'Mantenimiento'}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setSelectedSpaceId(null)}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Alertas de Feedback */}
      {drawerError && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-start gap-2 animate-in fade-in">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span className="leading-snug">{drawerError}</span>
        </div>
      )}
      {drawerSuccess && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{drawerSuccess}</span>
        </div>
      )}

      {/* Tipo de Vehículo Permitido (Badge Fijo de solo lectura) */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          Tipo de Vehículo Permitido
        </label>
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-white text-xs font-medium">
          <VehicleIcon className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <span>{vehicleLabel}</span>
        </div>
      </div>

      {/* Si la plaza está OCUPADA -> Solo lectura informativa + Banner de Bloqueo */}
      {isOcupado && (
        <div className="space-y-3">
          {/* Banner de Aviso Informativo */}
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2">
            <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <p className="leading-relaxed text-[11px]">
              Vehículo en estancia. Esta plaza no puede pasar a mantenimiento ni eliminarse mientras esté ocupada.
            </p>
          </div>

          {/* Tarjeta de Datos de la Estancia */}
          <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/40 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                <Car className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                <span>Ocupada por cliente</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-600 text-white font-extrabold uppercase">
                En curso
              </span>
            </div>

            {activeReservationForSelected ? (
              <>
                <p className="font-mono font-bold text-sm text-slate-900 dark:text-white pl-5">
                  {activeReservationForSelected.vehiclePlate || 'PATENTE'}
                </p>
                {activeReservationForSelected.clientName && (
                  <p className="text-slate-600 dark:text-zinc-400 flex items-center gap-1.5 pl-5">
                    <User className="h-3 w-3 text-slate-400" />
                    <span>Cliente: {activeReservationForSelected.clientName}</span>
                  </p>
                )}
                <p className="text-slate-500 dark:text-zinc-400 flex items-center gap-1.5 pl-5">
                  <Clock className="h-3 w-3 text-slate-400" />
                  <span>Ingreso: {activeReservationForSelected.startTime || 'En curso'}</span>
                </p>
              </>
            ) : (
              <p className="text-slate-600 dark:text-zinc-400 pl-5 text-[11px]">
                Plaza ocupada en tiempo real.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Acciones de Mantenimiento e Inventario (Solo cuando NO está ocupada) */}
      {!isOcupado && (
        <>
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Acciones de Mantenimiento
            </p>

            {/* Si la plaza está en Mantenimiento -> Botón Primario: Reactivar plaza */}
            {isMantenimiento && (
              <button
                type="button"
                disabled={isUpdatingState}
                onClick={() => handleUpdateSpaceState('LIBRE')}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
              >
                {isUpdatingState ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                <span>Reactivar plaza</span>
              </button>
            )}

            {/* Si la plaza está Libre -> Botón Secundario: Pasar a mantenimiento */}
            {isLibre && (
              <button
                type="button"
                disabled={isUpdatingState}
                onClick={() => handleUpdateSpaceState('MANTENIMIENTO')}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-400 border border-amber-500/30 text-xs font-semibold transition cursor-pointer active:scale-98 disabled:opacity-50"
              >
                {isUpdatingState ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                <span>Pasar a mantenimiento</span>
              </button>
            )}
          </div>

          {/* Botón de Eliminación Física del Inventario */}
          <div className="pt-3 border-t border-slate-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => requestDeleteSpace(selectedSpace)}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white text-xs font-semibold transition cursor-pointer active:scale-98"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Eliminar Plaza</span>
            </button>
          </div>
        </>
      )}
    </aside>
  );
};

