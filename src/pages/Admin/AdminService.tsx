import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShineBorder } from '../../components/ui/shine-border';
import ConfirmDialog from '../../components/shared/ConfirmDialog/ConfirmDialog.js';
import { getServices, createService, updateService, removeService } from '../../services/Service.js';
import type { Service, ServiceInput } from '../../types/Service.js';
import '../Vehicle/Vehicle.scss';

export default function AdminService() {
  const navigate = useNavigate();

  const [service, setService] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newName, setNewName] = useState('');
  const [newDescription, setnewDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingDescription, setEditingDescription] = useState('');


  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);

  const loadService = () => {
    setLoading(true);
    getServices()
      .then((res) => setService(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Error al cargar los servicios'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadService();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    if (!newDescription.trim()) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await createService({ name: newName.trim(), description: newDescription.trim() });
      setNewName('');
      setnewDescription('');
      loadService();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al crear el servicio');
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditing = (s: Service) => {
    setEditingId(s.id);
    setEditingName(s.name);
    setEditingDescription(s.description);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingName('');
    setEditingDescription('');
  };

  const saveEditing = async (id: string) => {
    if (!editingName.trim() || !editingDescription.trim()) return;
    try {
      await updateService(id, { name: editingName.trim(), description: editingDescription.trim() });
      cancelEditing();
      loadService();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al actualizar el servicio');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await removeService(deleteTarget.id);
      setService((prev) => prev.filter((s) => s.id !== deleteTarget.id));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al eliminar el servicio');
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
            <h1 className="text-white">Servicios</h1>
            <p className="text-zinc-400">Administrá los Servicios disponibles en el sistema</p>
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
            placeholder="Nombre del Servicio"
            className="flex-1 px-4 py-2 rounded-lg border border-zinc-700 bg-zinc-950 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
            required
          />
          <input
            type="text"
            value={newDescription}
            onChange={(e) => setnewDescription(e.target.value)}
            placeholder="Descripcion del Servicio"
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
          <div className="state-container"><p className="text-zinc-400">Cargando servicios...</p></div>
        ) : service.length === 0 ? (
          <div className="state-container"><p className="text-zinc-400">Todavía no hay servicios cargados.</p></div>
        ) : (
          <div className="table-wrapper">
            <table className="modern-table">
              <thead>
                <tr>
                  <th className="text-zinc-400">Nombre</th>
                  <th className="text-zinc-400">Estado</th>
                  <th className="text-zinc-400">Descripcion</th>
                  <th className="text-zinc-400">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {service.map((s) => (
                  <tr key={s.id}>
                    <td className="text-zinc-200">
                      {editingId === s.id ? (
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-950 text-white focus:outline-none focus:border-blue-500"
                          autoFocus
                        />
                      ) : (
                        s.name
                      )}
                    </td>
                    <td className="text-zinc-200">
                      {editingId === s.id ? (
                        <input
                          type="text"
                          value={editingDescription}
                          onChange={(e) => setEditingDescription(e.target.value)}
                          className="px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-950 text-white focus:outline-none focus:border-blue-500"
                          autoFocus
                        />
                      ) : (
                        s.description
                      )}
                    </td>
                    <td className="text-zinc-200">{s.isActive === false ? 'Inactivo' : 'Activo'}</td>
                    <td>
                      <div className="table-actions">
                        {editingId === s.id ? (
                          <>
                            <button type="button" onClick={() => saveEditing(s.id)} className="btn-primary">
                              Guardar
                            </button>
                            <button type="button" onClick={cancelEditing} className="btn-ghost">
                              Cancelar
                            </button>
                          </>
                        ) : (
                          <>
                            <button type="button" onClick={() => startEditing(s)} className="btn-primary">
                              Editar
                            </button>
                            <button type="button" onClick={() => setDeleteTarget(s)} className="btn-danger">
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
        title="Eliminar Servicio"
        message={`¿Confirmás que querés eliminar "${deleteTarget?.name}"? Esta acción no se puede deshacer.`}
        confirmLabel="Sí, eliminar"
        cancelLabel="Cancelar"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
