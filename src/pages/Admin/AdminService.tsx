import { Layers } from 'lucide-react';
import AdminCatalog from './AdminCatalog';
import { getServices, createService, updateService, removeService } from '../../services/service.service';

// Fuera del componente para que no cambie en cada render (AdminCatalog lo usa como dependencia de la carga).
const API = { list: getServices, create: createService, update: updateService, remove: removeService };

export default function AdminService() {
  return (
    <AdminCatalog title="Servicios" sub="Catálogo general: cada dueño elige cuáles ofrece en sus sucursales y les pone precio."
      noun={{ one: 'servicio', many: 'servicios', nuevo: 'Nuevo servicio' }} icon={<Layers className="i" />} withDescription api={API} />
  );
}
