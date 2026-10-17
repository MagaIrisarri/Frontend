import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Minus, Plus } from 'lucide-react';
import { Drawer } from '../../components/Owner/ui/Layer';
import { Shown } from '../../components/Owner/ui/Presence';
import { Field, Input, apiError } from '../../components/Owner/ui/Field';
import { useToast } from '../../components/Owner/ui/Toasts';
import { LocationPicker, type PlaceValue } from '../../components/Parking/LocationPicker';
import { DEFAULT_MAP_CENTER } from '../../config/map';
import { createParking, putParking } from '../../services/parking.service';
import type { Parking } from '../../types/parking.types';
import { useOwner } from './OwnerContext';
import { iconOf } from '../../components/Owner/ui/vehicles';
import { useVehicleTypes } from '../../hooks/useVehicleTypes';
import { plural, spacePrefix, typePlural } from './owner.lib';

const hm = (t?: string) => (t ?? '').slice(0, 5);

// Alta y edición de sucursal en un panel lateral.
// `parking`: la sucursal a editar, 'new' para el alta o null con el panel cerrado (el cierre se anima).
export default function ParkingDrawer({ parking, onClose }: { parking: Parking | 'new' | null; onClose: () => void }) {
  return <Shown when={parking}>{p => <ParkingForm parking={p === 'new' ? null : p} onClose={onClose} />}</Shown>;
}

function ParkingForm({ parking, onClose }: { parking: Parking | null; onClose: () => void }) {
  const { ownerId, refresh } = useOwner();
  const toast = useToast();
  const navigate = useNavigate();
  const edit = !!parking;
  const [v, setV] = useState(() => parking ? {
    name: parking.name, image: parking.imageUrl || parking.image || '', address: parking.address, province: parking.province || 'Santa Fe' /* las previas a la provincia eran todas de Rosario */, locality: parking.locality, neighborhood: parking.neighborhood ?? '', postalCode: parking.postalCode,
    is24: hm(parking.openingTime) === '00:00' && hm(parking.closingTime) === '23:59', open: hm(parking.openingTime), close: hm(parking.closingTime),
    min: String(parking.minReservationHours), max: String(parking.maxReservationHours), margin: String(parking.reservationMargin),
    lat: parking.latitude, lng: parking.longitude,
  } : {
    name: '', image: '', address: '', province: 'Santa Fe', locality: 'Rosario', neighborhood: '', postalCode: '',
    is24: false, open: '08:00', close: '22:00', min: '1', max: '24', margin: '30', lat: DEFAULT_MAP_CENTER[1], lng: DEFAULT_MAP_CENTER[0],
  });
  const [err, setErr] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const set = (k: string) => (e: { target: { value: string } }) => {
    const value = e.target.value; // con el estado anterior de cada paso: dos campos cambiados seguidos no se pisan
    setV(s => ({ ...s, [k]: value })); setErr(x => ({ ...x, [k]: '' }));
  };
  const num = (k: string) => parseInt((v as any)[k], 10);
  // R-30: plazas iniciales por tipo de vehículo, con los tipos activos del catálogo del administrador.
  const { types } = useVehicleTypes();
  const [counts, setCounts] = useState<Record<string, string>>({});
  const n = (id: string) => Math.max(0, parseInt(counts[id] ?? '0', 10) || 0);
  const total = edit ? parking!.totalCapacity ?? 0 : types.reduce((a, t) => a + n(t.id), 0);
  const setCount = (id: string, value: string) => { setCounts(c => ({ ...c, [id]: value })); setErr(e => ({ ...e, [id]: '', spaces: '' })); };
  const step = (id: string, d: number) => setCount(id, String(Math.max(0, n(id) + d)));

  // Provincia, localidad, calle, barrio, código postal y punto: los edita el selector, que los completa desde la búsqueda y el pin.
  const onPlace = (patch: Partial<PlaceValue>) => {
    setErr(e => ({ ...e, ...Object.fromEntries(Object.keys(patch).map(k => [k, ''])) }));
    setV(s => ({ ...s, ...patch }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (v.name.trim().length < 3) e.name = 'Ingresá el nombre de la sucursal (mínimo 3 letras).';
    if (v.image && !/^https?:\/\//i.test(v.image)) e.image = 'La URL debe empezar con http:// o https://';
    if (v.address.trim().length < 5) e.address = 'Buscá la dirección o marcá el punto en el mapa.';
    if (v.locality.trim().length < 3) e.locality = 'Elegí la ciudad o localidad.';
    if (!/^(\d{4}|[A-Z]\d{4}[A-Z]{3})$/.test(v.postalCode.trim().toUpperCase())) e.postalCode = 'Usá 4 dígitos o formato CPA (S2000ABC).';
    if (!edit) { // las plazas solo se cargan al crear; después se gestionan en Plazas (R-18)
      types.forEach(t => { if (counts[t.id] && !(parseInt(counts[t.id], 10) >= 0)) e[t.id] = 'Número inválido.'; });
      // Sin plazas quedaría operativa en el mapa sin nada para reservar.
      if (!total) e.spaces = 'Agregá al menos una plaza para poder recibir reservas.';
    }
    if (!v.is24 && !(v.open && v.close && v.open < v.close)) e.close = 'El cierre debe ser posterior a la apertura.';
    if (!(num('min') >= 1)) e.min = 'Mínimo 1 h.';
    if (!(num('max') >= num('min'))) e.max = 'Debe ser ≥ al mínimo.';
    if (!(Number.isInteger(num('margin')) && num('margin') >= 0 && num('margin') <= 240)) e.margin = 'De 0 a 240 min.';
    return e;
  };

  const save = async (ev: FormEvent) => {
    ev.preventDefault();
    if (busy) return; // Enter en un campo vuelve a enviar el formulario
    const e = validate();
    setErr(e);
    if (Object.keys(e).length) return toast('Revisá los campos marcados.', 'err');
    setBusy(true);
    const data = {
      name: v.name.trim(), address: v.address.trim(), province: v.province, locality: v.locality.trim(), neighborhood: v.neighborhood.trim() || null, postalCode: v.postalCode.trim().toUpperCase(),
      openingTime: v.is24 ? '00:00' : v.open, closingTime: v.is24 ? '23:59' : v.close,
      minReservationHours: num('min'), maxReservationHours: num('max'), reservationMargin: num('margin'),
      latitude: Number(v.lat), longitude: Number(v.lng), imageUrl: v.image.trim(),
    };
    try {
      if (parking) { await putParking(data, parking.id); toast(`Cambios guardados en “${data.name}”.`); }
      else {
        const res = await createParking({ ...data, spaces: types.filter(t => n(t.id) > 0).map(t => ({ vehicleTypeId: t.id, quantity: n(t.id) })), ownerId });
        const id = res?.data?.id;
        toast(`Sucursal “${data.name}” creada con ${plural(total, 'plaza', 'plazas')}. Falta cargar sus tarifas.`, 'ok',
          id ? { label: 'Cargar tarifas', fn: () => navigate(`/owner/tariffs?p=${id}`) } : undefined);
      }
      await refresh();
      onClose();
    } catch (x) { toast(apiError(x), 'err'); } finally { setBusy(false); }
  };

  return (
    <Drawer size="mid" title={edit ? 'Editar sucursal' : 'Nueva sucursal'} sub={edit ? parking!.name : 'Completá los datos para publicar tu cochera.'} onClose={onClose}
      footer={<div className="dfoot"><button type="button" className="btn" onClick={onClose}>Cancelar</button><button className="btn pri" type="submit" form="pform" disabled={busy} aria-busy={busy}>{edit ? 'Guardar cambios' : 'Crear sucursal'}</button></div>}>
      <form id="pform" noValidate className="dbody" onSubmit={save}>
        <section className="fs"><div className="fh"><h3>Datos generales</h3></div>
          <Input label="Nombre de la sucursal" placeholder="Ej. Estacionamiento Central Pellegrini" autoComplete="off" value={v.name} onChange={set('name')} error={err.name} data-first />
          <Input label="URL de la foto de portada (opcional)" type="url" placeholder="https://…" hint="Enlace directo a una imagen pública." value={v.image} onChange={set('image')} error={err.image} />
        </section>
        <section className="fs"><div className="fh"><h3>Dirección</h3></div>
          <LocationPicker value={{ province: v.province, locality: v.locality, neighborhood: v.neighborhood, address: v.address, postalCode: v.postalCode, lat: Number(v.lat), lng: Number(v.lng) }} onChange={onPlace} errors={err} />
        </section>
        {edit ? (
          <section className="fs"><div className="fh"><h3>Plazas</h3><span className="total">Total: <b>{plural(total, 'plaza', 'plazas')}</b></span></div>
            <p className="ctx" style={{ margin: 0 }}>Para agregar, pasar a mantenimiento o dar de baja plazas, usá la pestaña{' '}
              <button type="button" className="link" onClick={() => { onClose(); navigate(`/owner/spaces?p=${parking!.id}`); }}>Plazas</button>.</p>
          </section>
        ) : (
        <section className="fs"><div className="fh"><h3>Plazas</h3><span className="total">Total: <b>{plural(total, 'plaza', 'plazas')}</b></span></div>
          <p className="ctx" style={{ marginTop: -6 }}>Se crean automáticamente con código correlativo por tipo de vehículo. Después las gestionás desde Plazas.</p>
          <div className="g3">{types.map(t => {
            const I = iconOf(t.name), c = spacePrefix(t.name), cnt = n(t.id), pl = typePlural(t.name);
            return (
              <Field key={t.id} label={pl} error={err[t.id]}>
                {(id, aria) => (<>
                  <div className="stepper">
                    <button type="button" aria-label={`Quitar una plaza de ${pl.toLowerCase()}`} onClick={() => step(t.id, -1)}><Minus className="i sm" /></button>
                    <input id={id} type="number" inputMode="numeric" min={0} value={counts[t.id] ?? '0'} onChange={e => setCount(t.id, e.target.value)} {...aria} />
                    <button type="button" aria-label={`Sumar una plaza de ${pl.toLowerCase()}`} onClick={() => step(t.id, 1)}><Plus className="i sm" /></button>
                  </div>
                  <div className="rng"><I className="i sm" style={{ verticalAlign: -2 }} /> {cnt ? `${c}-01 a ${c}-${String(cnt).padStart(2, '0')}` : 'Sin plazas'}</div>
                </>)}
              </Field>
            );
          })}</div>
          {err.spaces && <div className="ferr" role="alert">{err.spaces}</div>}
        </section>
        )}
        <section className="fs"><div className="fh"><h3>Horario</h3>
          <label className="switch"><input type="checkbox" checked={v.is24} onChange={e => { const is24 = e.target.checked; setV(s => ({ ...s, is24 })); }} /><span className="t" />Abierto 24 horas</label></div>
          <div className="g2">
            <Input label="Apertura" type="time" disabled={v.is24} value={v.is24 ? '00:00' : v.open} onChange={set('open')} error={err.open} />
            <Input label="Cierre" type="time" disabled={v.is24} value={v.is24 ? '23:59' : v.close} onChange={set('close')} error={err.close} />
          </div>
        </section>
        <section className="fs"><div className="fh"><h3>Reservas</h3></div>
          <div className="g3">
            <Input label="Mínimo (h)" type="number" min={1} value={v.min} onChange={set('min')} error={err.min} />
            <Input label="Máximo (h)" type="number" min={1} value={v.max} onChange={set('max')} error={err.max} />
            <Input label="Margen entre reservas (min)" type="number" min={0} max={240} value={v.margin} onChange={set('margin')} error={err.margin} />
          </div>
        </section>
      </form>
    </Drawer>
  );
}
