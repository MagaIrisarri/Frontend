import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ConfirmDialog from '../../components/Shared/ConfirmDialog/ConfirmDialog';
import { Pencil, Trash2, ArrowLeft } from 'lucide-react';
import { getVehicleTypes, createVehicleType, updateVehicleType, removeVehicleType } from '../../services/vehicleType.service';
import type { VehicleType } from '../../types/vehicle.types.js';

export default function AdminVehicleTypes() {
  const navigate = useNavigate();

  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newName, setNewName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<VehicleType | null>(null);

  const loadVehicleTypes = () => {
    setLoading(true);
    getVehicleTypes()
      .then((res) => setVehicleTypes(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Error al cargar los tipos de vehículo'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadVehicleTypes();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await createVehicleType({ name: newName.trim() });
      setNewName('');
      loadVehicleTypes();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al crear el tipo de vehículo');
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditing = (vt: VehicleType) => {
    setEditingId(vt.id);
    setEditingName(vt.name);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingName('');
  };

  const saveEditing = async (id: string) => {
    if (!editingName.trim()) return;
    try {
      await updateVehicleType(id, { name: editingName.trim() });
      cancelEditing();
      loadVehicleTypes();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al actualizar el tipo de vehículo');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await removeVehicleType(deleteTarget.id);
      setVehicleTypes((prev) => prev.filter((vt) => vt.id !== deleteTarget.id));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al eliminar el tipo de vehículo');
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f5] dark:bg-[#0B0F17] text-slate-900 dark:text-white p-6 md:p-10 transition-colors">
      <div className="max-w-5xl mx-auto space-y-6">
        <button
          type="button"
          onClick={() => navigate('/admin')}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver al Panel de Administrador</span>
        </button>

        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 md:p-8 shadow-sm">
          <div className="mb-6">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Tipos de Vehículo</h1>
            <p className="text-sm text-slate-600 dark:text-zinc-400 mt-1">
              Administrá los tipos de vehículo disponibles en el sistema
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleCreate} className="flex gap-3 mb-8">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nombre del tipo de vehículo (ej: Auto, Moto, Utilitario)"
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              required
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50 cursor-pointer shrink-0"
            >
              {isSubmitting ? 'Agregando...' : '+ Agregar'}
            </button>
          </form>

          {loading ? (
            <div className="py-12 text-center text-sm text-slate-500 dark:text-zinc-400">Cargando tipos de vehículo...</div>
          ) : vehicleTypes.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500 dark:text-zinc-400">Todavía no hay tipos de vehículo cargados.</div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-zinc-800">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-zinc-800/50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 border-b border-slate-200 dark:border-zinc-800">
                  <tr>
                    <th className="px-5 py-3">Nombre</th>
                    <th className="px-5 py-3">Estado</th>
                    <th className="px-5 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                  {vehicleTypes.map((vt) => (
                    <tr key={vt.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                      <td className="px-5 py-3.5 font-medium text-slate-900 dark:text-white">
                        {editingId === vt.id ? (
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 text-sm"
                            autoFocus
                          />
                        ) : (
                          vt.name
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          vt.isActive === false
                            ? 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {vt.isActive === false ? 'Inactivo' : 'Activo'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {editingId === vt.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => saveEditing(vt.id)}
                              className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer"
                            >
                              Guardar
                            </button>
                            <button
                              type="button"
                              onClick={cancelEditing}
                              className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-semibold cursor-pointer"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => startEditing(vt)}
                              className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors cursor-pointer"
                              title="Editar"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(vt)}
                              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                              title="Eliminar"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
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
        title="Eliminar tipo de vehículo"
        message={`¿Confirmás que querés eliminar "${deleteTarget?.name}"? Esta acción no se puede deshacer.`}
        confirmLabel="Sí, eliminar"
        cancelLabel="Cancelar"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
