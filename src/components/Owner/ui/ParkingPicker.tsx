// Selector de la sucursal activa: el mismo control, en el mismo lugar (acciones del encabezado), en Plazas, Servicios y Turnos.
export function ParkingPicker({ parkings, value, onChange }: {
  parkings: { id: string; name: string }[]; value: string; onChange: (id: string) => void;
}) {
  return (
    <select className="sel picker" aria-label="Sucursal" value={value} onChange={e => onChange(e.target.value)}>
      {parkings.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
    </select>
  );
}
