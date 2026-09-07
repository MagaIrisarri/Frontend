import type { Parking } from '@/types/Parking.js';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {getParkingsByOwner, deleteParking} from '../../services/Parking.js';
import { ShineBorder } from '../../components/ui/shine-border.js';
import ConfirmDialog from '../../components/shared/ConfirmDialog/ConfirmDialog.js';
import '../Vehicle/Vehicle.scss';



export default function MyParkings() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  const [parkings, setParkings] = useState<Parking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem('user');
    const parsedUser = raw ? JSON.parse(raw) : null;

    if (!parsedUser) {
      navigate('/login');
      return;
    }
    if (parsedUser.type !== 'DUEÑO') {
      navigate('/profile');
      return;
    }
    setUser(parsedUser);
  }, []);

useEffect(() => {
  if (!user) return;

  setLoading(true);
  getParkingsByOwner(user.id)
    .then((res) => setParkings(res.data))
    .catch((err) => console.error(err))
    .finally(() => setLoading(false));
}, [user]);  

const [deleteTarget, setDeleteTarget] = useState<Parking | null>(null);

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

if (!user) return null;

return (
    <div className="vehicle-management-container bg-zinc-950">
      <ShineBorder
        className="vehicle-management-card bg-zinc-900/90 border border-zinc-800 shadow-2xl backdrop-blur-md text-white"
        color={['#2563EB', '#38BDF8', '#818CF8']}
        borderRadius={16}
        borderWidth={1.5}
        duration={10}
      >
        <header className="management-header flex items-center justify-between">
          <div className="header-info">
            <h1 className="text-white">Listado de Estacionamientos</h1>
            <p className="text-zinc-400">Listado y control de los estacionamientos registrados</p>
            <button
              type="button"
              onClick={() => navigate('/my-parkings/create')}
              className="btn-primary"
            >
              + Registrar Estacionamiento
            </button>
          </div>
        </header>

        {loading ? (
          <div className="state-container"><p className="text-zinc-400">Cargando estacionamientos...</p></div>
        ) : parkings.length === 0 ? (
          <div className="state-container"><p className="text-zinc-400">No hay estacionamientos registrados todavía.</p></div>
        ) : (
          <div className="table-wrapper">
            <table className="modern-table">
              <thead>
                <tr>
                  <th className="text-zinc-400">Localidad</th>
                  <th className="text-zinc-400">Direccion</th>
                  <th className="text-zinc-400">Hora de inicio</th>
                  <th className="text-zinc-400">Hora de cierre</th>
                  <th className="text-zinc-400">Nombre</th>
                  <th className="text-zinc-400">Acciones</th>
                </tr>
              </thead>
               <tbody>
                {parkings.map((p) => {
                  return (
                    <tr key={p.id}>
                      <td className="text-zinc-200">{p.locality}</td>
                      <td className="text-zinc-200">{p.address}</td>
                      <td className="text-zinc-200">{p.openingTime}</td>
                      <td className="text-zinc-200">{p.closingTime}</td>
                      <td className="text-zinc-200">{p.name}</td>
                      <td>
                        <div className="table-actions">
                          <button
                            type="button"
                            onClick={() => navigate(`/my-parkings/update/${p.id}`)}
                            className="btn-primary"
                          >
                            Editar datos
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(p)}
                            className="btn-danger"
                          >
                            Eliminar estacionamiento
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
        <button type="button" onClick={() => navigate('/profile')} className="btn-ghost">
          ← Volver al Panel de Perfil
        </button>
      </ShineBorder>

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


