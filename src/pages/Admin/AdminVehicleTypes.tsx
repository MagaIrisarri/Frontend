import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShineBorder } from '../../components/ui/shine-border';
import ConfirmDialog from '../../components/shared/ConfirmDialog/ConfirmDialog.js';
import { getVehicleTypes, createVehicleType, updateVehicleType, removeVehicleType } from '../../services/VehicleType.js';
import type { VehicleType } from '../../types/vehicle.types.js';
import '../Vehicle/Vehicle.scss';

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
    <div className="vehicle-management-container bg-zinc-950">
      <ShineBorder
        className="vehicle-management-card bg-zinc-900/90 border border-zinc-800 shadow-2xl backdrop-blur-md text-white"
        color={['#2563EB', '#38BDF8', '#818CF8']}
        borderRadius={16}
        borderWidth={1.5}
        duration={10}
      >
        <header className="management-header">
          <div className="header-info">
            <h1 className="text-white">Tipos de Vehículo</h1>
            <p className="text-zinc-400">Administrá los tipos de vehículo disponibles en el sistema</p>
          </div>
        </header>

        {error && (
          <div className="state-container">
            <p className="text-destructive">{error}</p>
          </div>
        )}

        <form onSubmit={handleCreate} className="flex gap-3 mb-6">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nombre del tipo de vehículo"
            className="flex-1 px-4 py-2 rounded-lg border border-zinc-700 bg-zinc-950 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
            required
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? 'Agregando...' : '+ Agregar'}
          </button>
        </form>

        {loading ? (
          <div className="state-container"><p className="text-zinc-400">Cargando tipos de vehículo...</p></div>
        ) : vehicleTypes.length === 0 ? (
          <div className="state-container"><p className="text-zinc-400">Todavía no hay tipos de vehículo cargados.</p></div>
        ) : (
          <div className="table-wrapper">
            <table className="modern-table">
              <thead>
                <tr>
                  <th className="text-zinc-400">Nombre</th>
                  <th className="text-zinc-400">Estado</th>
                  <th className="text-zinc-400">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {vehicleTypes.map((vt) => (
                  <tr key={vt.id}>
                    <td className="text-zinc-200">
                      {editingId === vt.id ? (
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-950 text-white focus:outline-none focus:border-blue-500"
                          autoFocus
                        />
                      ) : (
                        vt.name
                      )}
                    </td>
                    <td className="text-zinc-200">{vt.isActive === false ? 'Inactivo' : 'Activo'}</td>
                    <td>
                      <div className="table-actions">
                        {editingId === vt.id ? (
                          <>
                            <button type="button" onClick={() => saveEditing(vt.id)} className="btn-primary">
                              Guardar
                            </button>
                            <button type="button" onClick={cancelEditing} className="btn-ghost">
                              Cancelar
                            </button>
                          </>
                        ) : (
                          <>
                            <button type="button" onClick={() => startEditing(vt)} className="btn-primary">
                              Editar
                            </button>
                            <button type="button" onClick={() => setDeleteTarget(vt)} className="btn-danger">
                              Eliminar
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <button type="button" onClick={() => navigate('/admin')} className="btn-ghost">
          ← Volver al Panel de Administrador
        </button>
      </ShineBorder>

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
