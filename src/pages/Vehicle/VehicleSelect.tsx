import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { vehicleService } from '../../services/vehicleService';
import { Vehicle } from '../../types/vehicle.types';
import { ShineBorder } from '../../components/ui/shine-border';
import { Lottie } from 'lottie-react';
import carAnimation from '../../assets/carAnimation.json';
import './Vehicle.scss';

const VEHICLE_TYPE_MAP: Record<string, string> = {
  Auto: 'AUTO',
  Moto: 'MOTOCICLETA',
};

export default function VehicleSelect() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      const userId = localStorage.getItem('parkflow_user_id') || JSON.parse(localStorage.getItem('user') || '{}')?.id;
      setLoading(true);
      const data = await vehicleService.getVehicles(userId);
      const list = Array.isArray(data) ? data : (data?.data || []);
      setVehicles(list);
    } catch (error) {
      console.error("Error al cargar vehículos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (v: Vehicle) => {
  const backendType = VEHICLE_TYPE_MAP[v.vehicleType?.name ?? ''];
  if (!backendType) return; // Utilitario u otro tipo sin mapeo — no navega

  navigate('/parking', {
    state: { vehicleId: v.id, vehicleType: backendType },
  });
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
              <h1 className="text-white">Seleccion de Vehículo</h1>
              <p className="text-zinc-400">Seleccione el vehiculo que va a utilizar</p>
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
                    <th className="text-zinc-400">Tipo</th>
                    <th className="text-zinc-400">Marca</th>
                    <th className="text-zinc-400">Modelo</th>
                    <th className="text-zinc-400">Año</th>
                    <th></th>
                    
                  </tr>
                </thead>
                <tbody>
                  {vehicles.map((v: any) => {
                    const backendType = VEHICLE_TYPE_MAP[v.vehicleType?.name ?? ''];
                    const isSelectable = Boolean(backendType);
                    return (
                      <tr key={v.id || v._id} className={!isSelectable ? 'opacity-50' : undefined}>
                        <td><span className="plate-badge">{v.plate}</span></td>
                        <td className="text-zinc-200">{v.vehicleType?.name}</td>
                        <td className="text-zinc-200">{v.brand?.name || v.brand || '-'}</td>
                        <td className="text-zinc-200">{v.model?.name || v.model || '-'}</td>
                        <td className="text-zinc-200">{v.year}</td>
                        <td>
                        <button
                          type="button"
                          onClick={() => handleSelect(v)}
                          disabled={!isSelectable}
                          className={isSelectable ? 'btn-primary' : 'btn-primary opacity-50 cursor-not-allowed'}
                        >
                          {isSelectable ? 'Elegir' : 'Sin tarifas'}
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
  
  export { VehicleSelect };
  