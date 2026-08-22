import React, { useState, useEffect } from 'react';
import { vehicleService } from '../../services/vehicleService';
import { Vehicle } from '../../types/vehicle.types';
import { useNavigate } from 'react-router-dom';
import { ShineBorder } from '../../components/ui/shine-border';
import { Lottie } from 'lottie-react';
import carAnimation from '../../assets/carAnimation.json';
import './Vehicle.scss';

export default function VehicleManagement() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const data = await vehicleService.getVehicles();
      const list = Array.isArray(data) ? data : (data?.data || []);
      setVehicles(list);
    } catch (error) {
      console.error("Error al cargar vehículos:", error);
    } finally {
      setLoading(false);
    }
  };

  // Extrae exclusivamente el propietario vinculado al vehículo
  const getOwnerName = (v: any) => {
    // 1. Buscar en objetos relacionados comunes
    const owner = v.client || v.user || v.owner || v.customer;
    if (owner) {
      const name = owner.name || owner.first_name || '';
      const lastName = owner.last_name || owner.surname || '';
      const fullName = `${name} ${lastName}`.trim();
      if (fullName) return fullName;
    }

    // 2. Buscar propiedades directas de texto en el vehículo
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
            <h1 className="text-white">Gestión de Vehículos</h1>
            <p className="text-zinc-400">Listado y control de flota de vehículos registrados</p>
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
          <div className="state-container"><p className="text-zinc-400">No hay vehículos registrados todavía.</p></div>
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
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v: any) => {
                  const ownerDisplay = getOwnerName(v);
                  return (
                    <tr key={v.id || v._id}>
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
