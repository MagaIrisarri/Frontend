import { Tag } from 'lucide-react';
import AdminCatalog from './AdminCatalog';
import { getBrands } from '../../services/vehicle.service';

// Solo lectura: las marcas vienen precargadas con sus modelos.
const API = { list: getBrands };

export default function AdminBrands() {
  return (
    <AdminCatalog title="Marcas" sub="Marcas de vehículos disponibles al registrar un vehículo."
      noun={{ one: 'marca', many: 'marcas', nuevo: 'Nueva marca' }} icon={<Tag className="i" />} api={API} />
  );
}
