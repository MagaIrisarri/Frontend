import AdminCatalog from './AdminCatalog';
import { VICON } from '../../components/Owner/ui/vehicles';
import { VT } from '../Owner/owner.lib';
import type { VehicleType } from '../../types/vehicle.types';
import { createVehicleType, getVehicleTypes, removeVehicleType, updateVehicleType } from '../../services/vehicleType.service';

const Icon = VICON.AUTO;
const label = (t: VehicleType) => VT.find(v => v.k === t.category)?.n ?? 'Auto';

// La categoría (con la que se cobra y estaciona) y si es un tipo base las decide el backend; acá solo se muestran.
// Fuera del componente para que no cambie en cada render (AdminCatalog lo usa como dependencia de la carga).
const API = {
  list: () => getVehicleTypes().then(res => res.data.map(t => ({
    id: t.id, name: t.name, locked: t.isBase,
    description: t.isBase ? `Tipo base del sistema: no se edita ni se elimina` : `Se cobra y estaciona como ${label(t)}`,
  }))),
  create: (v: { name: string }) => createVehicleType({ name: v.name }),
  update: (id: string, v: { name: string }) => updateVehicleType(id, { name: v.name }),
  remove: removeVehicleType,
};

export default function AdminVehicleTypes() {
  return (
    <AdminCatalog title="Tipos de vehículo" sub="Cada tipo se cobra y estaciona como auto, moto o camioneta, según su nombre."
      noun={{ one: 'tipo de vehículo', many: 'tipos de vehículo', nuevo: 'Nuevo tipo' }} icon={<Icon className="i" />} api={API} />
  );
}
