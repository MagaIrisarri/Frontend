import { ShieldCheck } from 'lucide-react';
import AdminCatalog from './AdminCatalog';
import { createInsurance, getInsurances } from '../../services/vehicle.service';

// Solo listar y agregar: una aseguradora ya elegida por clientes no se edita ni se borra desde acá.
// Fuera del componente para que no cambie en cada render (AdminCatalog lo usa como dependencia de la carga).
const API = { list: getInsurances, create: (v: { name: string }) => createInsurance({ name: v.name }) };

export default function AdminInsurances() {
  return (
    <AdminCatalog title="Seguros" sub="Aseguradoras que los clientes pueden elegir al registrar un vehículo."
      noun={{ one: 'aseguradora', many: 'aseguradoras', nuevo: 'Nueva aseguradora' }} icon={<ShieldCheck className="i" />} api={API} />
  );
}
