import { useEffect, useState } from 'react';
import { vehicleService } from '../../services/vehicleService';
import { Vehicle } from '../../types/vehicle.types';
import { useNavigate } from 'react-router-dom';
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
    setLoading(true); //
    const data = await vehicleService.getVehicles(); //
    const list = Array.isArray(data) ? data : (data?.data || []);
    setVehicles(list); //
  } catch (error) {
    console.error("Error al cargar vehículos:", error); //
  } finally {
    setLoading(false); //
  }
};

  return (
    <div className="vehicle-management-container">
      <div className="vehicle-management-card">
        
        <header className="management-header">
          <div className="header-info">
            <h1>Gestión de Vehículos</h1>
            <p>Listado y control de flota de vehículos registrados</p>
          </div>
          
          <button
            type="button"
            onClick={() => navigate('/vehicles/new')} //[cite: 3]
            className="btn-primary"
          >
            + Registrar Vehículo
          </button>
        </header>

        {loading ? (
          <div className="state-container">
            <p>Cargando vehículos registrados...</p>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="state-container">
            <p>No hay vehículos registrados todavía.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Patente</th>
                  <th>Marca</th>
                  <th>Modelo</th>
                  <th>Año</th>
                  <th>Propietario</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v) => (
                  <tr key={v.id}>
                    <td>
                      <span className="plate-badge">{v.plate}</span>
                    </td>
                    <td>{v.brand?.name || '-'}</td>
                    <td>{v.model?.name || '-'}</td>
                    <td>{v.year}</td>
                    <td>
                      {v.client ? (
                        <span>{v.client.name} {v.client.last_name}</span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>Sin asignar</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <button 
          type="button"
          onClick={() => navigate('/')} //[cite: 3]
          className="btn-ghost"
        >
          ← Volver al inicio
        </button>

      </div>
    </div>
  );
}