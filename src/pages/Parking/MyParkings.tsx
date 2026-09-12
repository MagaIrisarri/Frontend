import type { Parking } from '@/types/parking.types';
import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getParkingsByOwner, deleteParking } from '../../services/parking.service';
import ConfirmDialog from '../../components/Shared/ConfirmDialog/ConfirmDialog';
import { useAuthStore } from '../../stores/authStore.js';
import { Pencil, Trash2, LayoutGrid, Plus, Building2, ArrowLeft, Loader2 } from 'lucide-react';

export default function MyParkings() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const [parkings, setParkings] = useState<Parking[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Parking | null>(null);

  const userId = user?.id || user?._id;

  useEffect(() => {
    if (!userId) return;

    setLoading(true);
    getParkingsByOwner(userId)
      .then((res) => {
        const list = Array.isArray(res) ? res : res?.data || [];
        setParkings(list);
      })
      .catch((err) => console.error('Error al cargar estacionamientos:', err))
      .finally(() => setLoading(false));
  }, [userId]);

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deleteParking(deleteTarget.id);
      setParkings((prev) => prev.filter((p) => p.id !== deleteTarget.id));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al eliminar el estacionamiento');
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F17] text-slate-900 dark:text-white px-4 sm:px-6 lg:px-8 py-8 transition-colors">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <Link
              to="/owner"
              className="p-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 shadow-sm transition-all active:scale-95 cursor-pointer"
              title="Volver al Panel de Dueño"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Mis Estacionamientos
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
                Listado y control de todas tus sucursales registradas
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/my-parkings/create')}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-blue-600/20 active:scale-98 transition-all cursor-pointer shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>+ Registrar Estacionamiento</span>
          </button>
        </div>

        {/* Contenido */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-7 shadow-sm">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <p className="text-sm text-slate-500 dark:text-zinc-400 font-medium">
                Cargando estacionamientos...
              </p>
            </div>
          ) : parkings.length === 0 ? (
            <div className="text-center py-16 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-base font-bold text-slate-900 dark:text-white">
                  No tenés estacionamientos registrados todavía
                </p>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                  Comenzá registrando tu primera sucursal para empezar a recibir reservas
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/my-parkings/create')}
                className="inline-flex items-center gap-2 py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/20 transition cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Registrar Primer Estacionamiento</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-800/40 text-slate-600 dark:text-zinc-400 font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4">Nombre</th>
                    <th className="py-3.5 px-4">Localidad</th>
                    <th className="py-3.5 px-4">Dirección</th>
                    <th className="py-3.5 px-4">Horario</th>
                    <th className="py-3.5 px-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                  {parkings.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-zinc-800/30 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                          <span>{p.name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-zinc-300 font-medium">
                        {p.locality}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-zinc-300 font-medium">
                        {p.address}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-zinc-300 font-medium">
                        {p.openingTime} - {p.closingTime}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => navigate(`/my-parkings/edit/${p.id}`)}
                            className="p-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/60 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-white transition cursor-pointer"
                            title="Editar Datos"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate(`/parking-space/${p.id}`)}
                            className="p-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/60 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:text-emerald-500 transition cursor-pointer"
                            title="Gestionar Plazas"
                          >
                            <LayoutGrid className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(p)}
                            className="p-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/60 hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition cursor-pointer"
                            title="Dar de baja"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Dar de baja estacionamiento"
        message={`¿Confirmás que querés dar de baja "${deleteTarget?.name}"? Esta acción no se puede deshacer.`}
        confirmLabel="Sí, dar de baja"
        cancelLabel="Cancelar"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

export { MyParkings };
