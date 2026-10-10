import { Car } from 'lucide-react';
import AdminCatalog from './AdminCatalog';
import { getVehicleTypes, createVehicleType, updateVehicleType, removeVehicleType } from '../../services/vehicleType.service';

// Fuera del componente para que no cambie en cada render (AdminCatalog lo usa como dependencia de la carga).
const API = {
  list: getVehicleTypes,
  create: (v: { name: string }) => createVehicleType({ name: v.name }),
  update: (id: string, v: { name: string }) => updateVehicleType(id, { name: v.name }),
  remove: removeVehicleType,
};

export default function AdminVehicleTypes() {
  return (
    <AdminCatalog title="Tipos de vehículo" sub="Los tipos que pueden elegir los clientes al registrar un vehículo."
      noun={{ one: 'tipo de vehículo', many: 'tipos de vehículo', nuevo: 'Nuevo tipo' }} icon={<Car className="i" />} api={API} />
  );
}
