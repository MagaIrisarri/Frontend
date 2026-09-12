import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, LogOut, Pencil, Plus, ArrowLeft } from 'lucide-react';
import { getUserVehicle, removeVehicle } from '../../services/vehicle.service';
import { useAuthStore } from '../../stores/authStore';
import { Vehicle } from '../../types/vehicle.types';
import ConfirmDialog from '../../components/Shared/ConfirmDialog/ConfirmDialog';
import './Vehicle.scss';

export default function VehicleManagement() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);

  const userId = user?.id || user?._id;

  const loadVehicles = async (id: string) => {
    try {
      const data = await getUserVehicle(id);
      const list = Array.isArray(data) ? data : (data?.data || []);
      setVehicles(list);
    } catch (error) {
      console.error('Error al cargar vehículos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userId) {
      navigate('/');
      return;
    }

    loadVehicles(userId);
  }, [userId, navigate]);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const vehicleId = deleteTarget.id || deleteTarget._id;

    try {
      await removeVehicle(vehicleId);
      setVehicles((prev) => prev.filter((v: any) => (v.id || v._id) !== vehicleId));
    } catch (error) {
      console.error('Error al dar de baja el vehículo:', error);
      alert('Ocurrió un error al dar de baja el vehículo.');
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('parkflow_user_id');
    logout();
    navigate('/login');
  };

  const getOwnerName = (v: any) => {
    const owner = v.client || v.user || v.owner || v.customer;
    if (owner) {
      const name = owner.name || owner.first_name || '';
      const lastName = owner.last_name || owner.surname || '';
      const fullName = `${name} ${lastName}`.trim();
      if (fullName) return fullName;
    }
    if (v.clientName) return v.clientName;
    if (v.ownerName) return v.ownerName;
    return null;
  };

  return (
    <div className="min-h-screen bg-[#faf9f5] dark:bg-[#0B0F17] text-slate-900 dark:text-white p-6 md:p-10 transition-colors">
      <div className="max-w-6xl mx-auto space-y-6">
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
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Mis Vehículos
              </h1>
              <p className="text-sm text-slate-600 dark:text-zinc-400 mt-1">
                Listado y control de tu flota de vehículos registrados
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/vehicles/new')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Registrar Vehículo</span>
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="p-2.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors cursor-pointer"
                title="Cerrar Sesión"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </header>

          {loading ? (
            <div className="py-12 text-center text-sm text-slate-500 dark:text-zinc-400">
              Cargando vehículos...
            </div>
          ) : vehicles.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500 dark:text-zinc-400">
              No tenés vehículos registrados todavía.
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-zinc-800">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-zinc-800/50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 border-b border-slate-200 dark:border-zinc-800">
                  <tr>
                    <th className="px-5 py-3">Patente</th>
                    <th className="px-5 py-3">Marca</th>
                    <th className="px-5 py-3">Modelo</th>
                    <th className="px-5 py-3">Año</th>
                    <th className="px-5 py-3">Propietario</th>
                    <th className="px-5 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                  {vehicles.map((v: any) => {
                    const ownerDisplay = getOwnerName(v);
                    const currentId = v.id || v._id;

                    return (
                      <tr
                        key={currentId}
                        className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                      >
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white font-mono font-bold text-xs tracking-wider border border-slate-200 dark:border-zinc-700">
                            {v.plate}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-900 dark:text-zinc-200 font-medium">
                          {v.brand?.name || v.brand || '-'}
                        </td>
                        <td className="px-5 py-3.5 text-slate-600 dark:text-zinc-300">
                          {v.model?.name || v.model || '-'}
                        </td>
                        <td className="px-5 py-3.5 text-slate-600 dark:text-zinc-300">{v.year}</td>
                        <td className="px-5 py-3.5">
                          {ownerDisplay ? (
                            <span className="font-medium text-blue-600 dark:text-blue-400">
                              {ownerDisplay}
                            </span>
                          ) : (
                            <span className="text-slate-400 dark:text-zinc-500 italic">
                              Sin asignar
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => navigate(`/vehicles/${currentId}/edit`)}
                              className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors cursor-pointer"
                              title="Editar"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(v)}
                              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                              title="Dar de baja"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
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

      <ConfirmDialog
        open={!!deleteTarget}
        title="Dar de baja vehículo"
        message={`¿Confirmás que querés dar de baja la patente "${deleteTarget?.plate}"? Esta acción no se puede deshacer.`}
        confirmLabel="Sí, dar de baja"
        cancelLabel="Cancelar"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

export { VehicleManagement };