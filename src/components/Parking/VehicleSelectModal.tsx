import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, Plus, X, Loader2, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { getUserVehicle } from '../../services/vehicleService';
import { Vehicle } from '../../types/vehicle.types';
import type { Parking } from '../../types/Parking';

interface VehicleSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  parking: Parking | null;
}

const normalizeVehicleType = (rawType: any): string => {
  const typeName = String(rawType?.name || rawType || '').trim().toUpperCase();
  if (typeName.includes('AUTO') || typeName.includes('COCHE') || typeName.includes('CAR')) return 'AUTO';
  if (typeName.includes('MOTO')) return 'MOTOCICLETA';
  if (typeName.includes('UTIL')) return 'UTILITARIO';
  return typeName || 'AUTO';
};

export const VehicleSelectModal: React.FC<VehicleSelectModalProps> = ({
  isOpen,
  onClose,
  parking,
}) => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchVehicles = async () => {
      try {
        setLoading(true);
        setError(null);
        const userId =
          localStorage.getItem('parkflow_user_id') ||
          JSON.parse(localStorage.getItem('user') || '{}')?.id;

        if (!userId) {
          setError('No se encontró la sesión del usuario.');
          return;
        }

        const data = await getUserVehicle(userId);
        const list = Array.isArray(data) ? data : data?.data || [];
        setVehicles(list);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Error al cargar tus vehículos');
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, [isOpen]);

  if (!isOpen || !parking) return null;

  const handleSelectVehicle = (vehicle: Vehicle) => {
    const backendType = normalizeVehicleType(vehicle.vehicleType);
    onClose();
    navigate(`/parkings/${parking.id}/reservar`, {
      state: {
        vehicleId: vehicle.id,
        vehicleType: backendType,
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Cabecera del modal */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Car className="h-5 w-5 text-blue-400" />
              Seleccioná tu Vehículo
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Para reservar en <span className="text-white font-medium">{parking.name}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Contenido del modal */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-zinc-400">
              <Loader2 className="h-7 w-7 animate-spin text-blue-500" />
              <p className="text-xs">Cargando tus vehículos...</p>
            </div>
          ) : vehicles.length === 0 ? (
            <div className="text-center py-8 px-4 bg-zinc-950/50 rounded-2xl border border-zinc-800/80">
              <div className="w-12 h-12 mx-auto rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center mb-3">
                <Car className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-bold text-white">No tenés vehículos registrados</h4>
              <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
                Registrá tu vehículo una sola vez para poder reservar en cualquier cochera.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate('/vehicles/new');
                }}
                className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Registrar Mi Primer Vehículo
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Tus vehículos guardados ({vehicles.length})
              </p>
              <div className="grid gap-2.5">
                {vehicles.map((v) => {
                  const typeName =
                    v.vehicleType?.name ||
                    (typeof v.vehicleType === 'string' ? v.vehicleType : 'Auto');
                  const brandName = typeof v.brand === 'object' ? v.brand?.name : (v.brand || '');
                  const modelName = typeof v.model === 'object' ? v.model?.name : (v.model || '');

                  return (
                    <div
                      key={v.id}
                      onClick={() => handleSelectVehicle(v)}
                      className="group flex items-center justify-between p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800 hover:border-blue-500 hover:bg-zinc-850 cursor-pointer transition-all duration-200"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2.5 rounded-xl bg-zinc-800 group-hover:bg-blue-600/20 text-zinc-400 group-hover:text-blue-400 transition-colors shrink-0">
                          <Car className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 font-mono font-bold text-xs text-white">
                              {v.plate}
                            </span>
                            <span className="text-xs font-medium text-zinc-300 truncate">
                              {brandName} {modelName}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-500 mt-1">
                            Tipo: <span className="text-zinc-400">{typeName}</span>
                            {v.year ? ` • Año ${v.year}` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-semibold text-blue-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                          Elegir
                          <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                <span className="text-xs text-zinc-400">¿Vas a usar otro vehículo?</span>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate('/vehicles/new');
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Registrar otro vehículo
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VehicleSelectModal;
