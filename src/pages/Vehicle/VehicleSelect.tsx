import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserVehicle } from '../../services/vehicle.service';
import { useAuthStore } from '../../stores/authStore';
import { Vehicle } from '../../types/vehicle.types';
import { ArrowLeft, Plus, Car } from 'lucide-react';

const normalizeVehicleType = (rawType: any): string => {
  const typeName = String(rawType?.name || rawType || '').trim().toUpperCase();
  if (typeName.includes('AUTO') || typeName.includes('COCHE') || typeName.includes('CAR')) return 'AUTO';
  if (typeName.includes('MOTO')) return 'MOTOCICLETA';
  if (typeName.includes('UTIL')) return 'UTILITARIO';
  return typeName || 'AUTO';
};

export default function VehicleSelect() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVehicles();
  }, [user]);

  const loadVehicles = async () => {
    try {
      const userId = user?.id || user?._id;
      if (!userId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const data = await getUserVehicle(userId);
      const list = Array.isArray(data) ? data : (data?.data || []);
      setVehicles(list);
    } catch (error) {
      console.error("Error al cargar vehículos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (v: Vehicle) => {
    const backendType = normalizeVehicleType(v.vehicleType);
    navigate('/', {
      state: { vehicleId: v.id, vehicleType: backendType },
    });
  };

  return (
    <div className="min-h-screen bg-[#faf9f5] dark:bg-[#0B0F17] text-slate-900 dark:text-white p-6 md:p-10 transition-colors">
      <div className="max-w-5xl mx-auto space-y-6">
        <button
          type="button"
          onClick={() => navigate('/profile')}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver a Mi Perfil</span>
        </button>

        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 md:p-8 shadow-sm">
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-100 dark:border-zinc-800">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Selección de Vehículo</h1>
              <p className="text-sm text-slate-600 dark:text-zinc-400 mt-1">Seleccioná el vehículo con el que vas a buscar o reservar cochera</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 hidden sm:flex items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 text-blue-600 dark:text-blue-400 shadow-sm transition-transform hover:scale-105">
                <Car className="h-6 w-6 animate-pulse" />
              </div>
              <button
                type="button"
                onClick={() => navigate('/vehicles/new')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Registrar Vehículo</span>
              </button>
            </div>
          </header>

          {loading ? (
            <div className="py-12 text-center text-sm text-slate-500 dark:text-zinc-400">Cargando vehículos...</div>
          ) : vehicles.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500 dark:text-zinc-400">No hay vehículos registrados todavía.</div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-zinc-800">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-zinc-800/50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 border-b border-slate-200 dark:border-zinc-800">
                  <tr>
                    <th className="px-5 py-3">Patente</th>
                    <th className="px-5 py-3">Tipo</th>
                    <th className="px-5 py-3">Marca</th>
                    <th className="px-5 py-3">Modelo</th>
                    <th className="px-5 py-3">Año</th>
                    <th className="px-5 py-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                  {vehicles.map((v: any) => {
                    const typeDisplay = v.vehicleType?.name || (typeof v.vehicleType === 'string' ? v.vehicleType : 'Auto');
                    const currentId = v.id || v._id;

                    return (
                      <tr key={currentId} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white font-mono font-bold text-xs tracking-wider border border-slate-200 dark:border-zinc-700">
                            {v.plate}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-900 dark:text-zinc-200 font-medium">{typeDisplay}</td>
                        <td className="px-5 py-3.5 text-slate-600 dark:text-zinc-300">{v.brand?.name || v.brand || '-'}</td>
                        <td className="px-5 py-3.5 text-slate-600 dark:text-zinc-300">{v.model?.name || v.model || '-'}</td>
                        <td className="px-5 py-3.5 text-slate-600 dark:text-zinc-300">{v.year}</td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => handleSelect(v)}
                            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all shadow-md shadow-blue-600/20 cursor-pointer"
                          >
                            Elegir
                          </button>
                        </td>    
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export { VehicleSelect };
  