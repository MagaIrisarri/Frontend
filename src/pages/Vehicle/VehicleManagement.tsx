import React, { useState, useEffect } from 'react';
import { vehicleService } from '../../services/vehicleService';
import { Vehicle } from '../../types/vehicle.types';
import { useNavigate } from 'react-router-dom';
import { ShineBorder } from '../../components/ui/shine-border';
import { Lottie } from 'lottie-react';
import { Trash2 } from 'lucide-react';
import carAnimation from '../../assets/carAnimation.json';
import './Vehicle.scss';

export default function VehicleManagement() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // 1. Obtener ID del cliente logueado
    const rawUser = localStorage.getItem('user');
    let currentId = localStorage.getItem('parkflow_user_id');
    
    if (!currentId && rawUser) {
      try {
        const parsed = JSON.parse(rawUser);
        currentId = parsed?.data?.id ?? parsed?.user?.id ?? parsed?.id;
      } catch (e) {
        console.error("Error al leer sesión");
      }
    }

    if (!currentId) {
      navigate('/login');
      return;
    }

    setUserId(currentId);
    loadVehicles(currentId);
  }, [navigate]);

  const loadVehicles = async (id: string) => {
    try {
      setLoading(true);
      // 2. Traer SOLO los vehículos activos del usuario actual
      const data = await vehicleService.getUserVehicles(id);
      const list = Array.isArray(data) ? data : (data?.data || []);
      setVehicles(list);
    } catch (error) {
      console.error("Error al cargar vehículos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (vehicleId: string) => {
    // 3. Confirmación y baja lógica
    if (!window.confirm("¿Estás seguro de que querés dar de baja este vehículo?")) return;
    
    try {
      await vehicleService.deleteVehicle(vehicleId);
      // Filtramos visualmente el vehículo dado de baja para no recargar la página entera
      setVehicles(prev => prev.filter((v: any) => (v.id || v._id) !== vehicleId));
    } catch (error) {
      console.error("Error al dar de baja el vehículo:", error);
      alert("Ocurrió un error al dar de baja el vehículo.");
    }
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
            <h1 className="text-white">Mis Vehículos</h1>
            <p className="text-zinc-400">Listado y control de tu flota de vehículos registrados</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 hidden sm:block">
              <Lottie src={carAnimation} autoplay loop={true} />
            </div>
            <button
              type="button"
              onClick={() => navigate('/vehicles/new')}
              className="btn-primary"
            >
              + Registrar Vehículo
            </button>
          </div>
        </header>

        {loading ? (
          <div className="state-container"><p className="text-zinc-400">Cargando vehículos...</p></div>
        ) : vehicles.length === 0 ? (
          <div className="state-container"><p className="text-zinc-400">No tenés vehículos registrados todavía.</p></div>
        ) : (
          <div className="table-wrapper">
            <table className="modern-table">
              <thead>
                <tr>
                  <th className="text-zinc-400">Patente</th>
                  <th className="text-zinc-400">Marca</th>
                  <th className="text-zinc-400">Modelo</th>
                  <th className="text-zinc-400">Año</th>
                  <th className="text-zinc-400">Propietario</th>
                  <th className="text-zinc-400 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v: any) => {
                  const ownerDisplay = getOwnerName(v);
                  const currentId = v.id || v._id;
                  
                  return (
                    <tr key={currentId}>
                      <td><span className="plate-badge">{v.plate}</span></td>
                      <td className="text-zinc-200">{v.brand?.name || v.brand || '-'}</td>
                      <td className="text-zinc-200">{v.model?.name || v.model || '-'}</td>
                      <td className="text-zinc-200">{v.year}</td>
                      <td className="text-zinc-200">
                        {ownerDisplay ? (
                          <span className="font-medium text-blue-400">{ownerDisplay}</span>
                        ) : (
                          <span className="text-zinc-500 italic">Sin asignar</span>
                        )}
                      </td>
                      <td className="text-center">
                        <button
                          onClick={() => handleDelete(currentId)}
                          className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors inline-flex items-center justify-center"
                          title="Dar de baja"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
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
    </div>
  );
}

export { VehicleManagement };
