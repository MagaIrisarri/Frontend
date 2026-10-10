import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Minus, Plus } from 'lucide-react';
import { Drawer } from '../../components/Owner/ui/Layer';
import { Field, Input, apiError } from '../../components/Owner/ui/Field';
import { useToast } from '../../components/Owner/ui/Toasts';
import { LocationPicker, type LocationData } from '../../components/Parking/LocationPicker';
import { DEFAULT_MAP_CENTER } from '../../config/map';
import { createParking, putParking } from '../../services/parking.service';
import type { Parking } from '../../types/parking.types';
import { useOwner } from './OwnerContext';
import { VICON } from './OwnerDashboard';
import { VT, plural } from './owner.lib';

const CODE = { AUTO: 'A', MOTO: 'M', CAMIONETA: 'C' } as const;
const NAME = { AUTO: 'Autos / Sedanes', MOTO: 'Motos', CAMIONETA: 'Camionetas' } as const;
const FIELD = { AUTO: 'car', MOTO: 'moto', CAMIONETA: 'truck' } as const;
type Key = 'car' | 'moto' | 'truck';

const hm = (t?: string) => (t ?? '').slice(0, 5);

// Alta y edición de sucursal en un panel lateral (owner-design/owner.html › openParkingForm).
export default function ParkingDrawer({ parking, onClose }: { parking: Parking | null; onClose: () => void }) {
  const { ownerId, refresh } = useOwner();
  const toast = useToast();
  const navigate = useNavigate();
  const edit = !!parking;
  const [v, setV] = useState(() => parking ? {
    name: parking.name, image: parking.imageUrl || parking.image || '', address: parking.address, locality: parking.locality, postalCode: parking.postalCode,
    car: String(parking.carCapacity ?? 0), moto: String(parking.motorcycleCapacity ?? 0), truck: String(parking.truckCapacity ?? 0),
    is24: hm(parking.openingTime) === '00:00' && hm(parking.closingTime) === '23:59', open: hm(parking.openingTime), close: hm(parking.closingTime),
    min: String(parking.minReservationHours), max: String(parking.maxReservationHours), margin: String(parking.reservationMargin),
    lat: parking.latitude, lng: parking.longitude,
  } : {
    name: '', image: '', address: '', locality: 'Rosario', postalCode: '', car: '10', moto: '0', truck: '0',
    is24: false, open: '08:00', close: '22:00', min: '1', max: '24', margin: '1', lat: DEFAULT_MAP_CENTER[1], lng: DEFAULT_MAP_CENTER[0],
  });
  const [err, setErr] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const set = (k: string) => (e: { target: { value: string } }) => { setV({ ...v, [k]: e.target.value }); setErr({ ...err, [k]: '' }); };
  const num = (k: string) => parseInt((v as any)[k], 10);
  const n = (k: Key) => Math.max(0, num(k) || 0);
  const total = n('car') + n('moto') + n('truck');
  const step = (k: Key, d: number) => setV({ ...v, [k]: String(Math.max(k === 'car' ? 1 : 0, n(k) + d)) });

  const onLocation = (l: LocationData) => setV(s => ({
    ...s, lat: l.lat, lng: l.lng, address: s.address || l.address || '', locality: l.locality || s.locality, postalCode: s.postalCode || l.postalCode || '',
  }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (v.name.trim().length < 3) e.name = 'Ingresá el nombre de la sucursal (mínimo 3 letras).';
    if (v.image && !/^https?:\/\//i.test(v.image)) e.image = 'La URL debe empezar con http:// o https://';
    if (v.address.trim().length < 5) e.address = 'Ingresá calle y altura.';
    if (v.locality.trim().length < 3) e.locality = 'Ingresá la localidad.';
    if (!/^(\d{4}|[A-Z]\d{4}[A-Z]{3})$/.test(v.postalCode.trim().toUpperCase())) e.postalCode = 'Usá 4 dígitos o formato CPA (S2000ABC).';
    if (!edit) { // las plazas solo se cargan al crear; después se gestionan en Plazas (R-18)
      if (!(num('car') >= 1)) e.car = 'Mínimo 1 plaza de auto.';
      (['moto', 'truck'] as const).forEach(k => { if (!(num(k) >= 0)) e[k] = 'Número inválido.'; });
    }
    if (!v.is24 && !(v.open && v.close && v.open < v.close)) e.close = 'El cierre debe ser posterior a la apertura.';
    if (!(num('min') >= 1)) e.min = 'Mínimo 1 h.';
    if (!(num('max') >= num('min'))) e.max = 'Debe ser ≥ al mínimo.';
    if (!(num('margin') >= 0)) e.margin = 'Número inválido.';
    return e;
  };

  const save = async (ev: FormEvent) => {
    ev.preventDefault();
    const e = validate();
    setErr(e);
    if (Object.keys(e).length) return toast('Revisá los campos marcados.', 'err');
    setBusy(true);
    const data = {
      name: v.name.trim(), address: v.address.trim(), locality: v.locality.trim(), postalCode: v.postalCode.trim().toUpperCase(),
      openingTime: v.is24 ? '00:00' : v.open, closingTime: v.is24 ? '23:59' : v.close,
      minReservationHours: num('min'), maxReservationHours: num('max'), reservationMargin: num('margin'),
      latitude: Number(v.lat), longitude: Number(v.lng), imageUrl: v.image.trim(),
    };
    try {
      if (parking) { await putParking(data, parking.id); toast(`Cambios guardados en “${data.name}”.`); }
      else { await createParking({ ...data, carCapacity: n('car'), motorcycleCapacity: n('moto'), truckCapacity: n('truck'), ownerId }); toast(`Sucursal “${data.name}” creada con ${plural(total, 'plaza', 'plazas')}. Falta cargar sus tarifas.`); }
      await refresh();
      onClose();
    } catch (x) { toast(apiError(x), 'err'); } finally { setBusy(false); }
  };

  return (
    <Drawer title={edit ? 'Editar sucursal' : 'Nueva sucursal'} sub={edit ? parking!.name : 'Completá los datos para publicar tu cochera.'} onClose={onClose}
      footer={<div className="dfoot"><button type="button" className="btn" onClick={onClose}>Cancelar</button><button className="btn pri" type="submit" form="pform" aria-busy={busy}>{edit ? 'Guardar cambios' : 'Crear sucursal'}</button></div>}>
      <form id="pform" noValidate className="dbody" onSubmit={save}>
        <section className="fs"><div className="fh"><h3>Datos generales</h3></div>
          <Input label="Nombre de la sucursal" placeholder="Ej. Estacionamiento Central Pellegrini" autoComplete="off" value={v.name} onChange={set('name')} error={err.name} data-first />
          <Input label="URL de la foto de portada (opcional)" type="url" placeholder="https://…" hint="Enlace directo a una imagen pública." value={v.image} onChange={set('image')} error={err.image} />
        </section>
        <section className="fs"><div className="fh"><h3>Dirección</h3></div>
          <Input label="Calle y altura" placeholder="Ej. Av. Pellegrini 1540" value={v.address} onChange={set('address')} error={err.address} />
          <div className="g2">
            <Input label="Localidad" value={v.locality} onChange={set('locality')} error={err.locality} />
            <Input label="Código postal" placeholder="2000 o S2000ABC" maxLength={8} autoCapitalize="characters" autoComplete="postal-code" value={v.postalCode} onChange={set('postalCode')} error={err.postalCode} />
          </div>
          <div style={{ borderRadius: 8, overflow: 'hidden' }} aria-label="Selector de ubicación">
            <LocationPicker lat={Number(v.lat)} lng={Number(v.lng)} defaultLocality={v.locality} defaultPostalCode={v.postalCode} onChangeLocation={onLocation} />
          </div>
        </section>
        {edit ? (
          <section className="fs"><div className="fh"><h3>Plazas</h3><span className="total">Total: <b>{plural(total, 'plaza', 'plazas')}</b></span></div>
            <p className="ctx" style={{ margin: 0 }}>Para agregar, pasar a mantenimiento o dar de baja plazas, usá la pestaña{' '}
              <button type="button" className="link" onClick={() => { onClose(); navigate(`/owner/spaces?p=${parking!.id}`); }}>Plazas</button>.</p>
          </section>
        ) : (
        <section className="fs"><div className="fh"><h3>Plazas</h3><span className="total">Total: <b>{plural(total, 'plaza', 'plazas')}</b></span></div>
          <p className="ctx" style={{ marginTop: -6 }}>Se crean automáticamente con código correlativo por tipo de vehículo. Después las gestionás desde Plazas.</p>
          <div className="g3">{VT.map(t => {
            const k = FIELD[t.k], I = VICON[t.k], c = CODE[t.k], cnt = n(k);
            return (
              <Field key={t.k} label={NAME[t.k]} error={err[k]}>
                {(id, aria) => (<>
                  <div className="stepper">
                    <button type="button" aria-label={`Quitar una plaza de ${t.pl.toLowerCase()}`} onClick={() => step(k, -1)}><Minus className="i sm" /></button>
                    <input id={id} type="number" inputMode="numeric" min={k === 'car' ? 1 : 0} value={v[k]} onChange={set(k)} {...aria} />
                    <button type="button" aria-label={`Sumar una plaza de ${t.pl.toLowerCase()}`} onClick={() => step(k, 1)}><Plus className="i sm" /></button>
                  </div>
                  <div className="rng"><I className="i sm" style={{ verticalAlign: -2 }} /> {cnt ? `${c}-01 a ${c}-${String(cnt).padStart(2, '0')}` : 'Sin plazas'}</div>
                </>)}
              </Field>
            );
          })}</div>
        </section>
        )}
        <section className="fs"><div className="fh"><h3>Horario</h3>
          <label className="switch"><input type="checkbox" checked={v.is24} onChange={e => setV({ ...v, is24: e.target.checked })} /><span className="t" />Abierto 24 horas</label></div>
          <div className="g2">
            <Input label="Apertura" type="time" disabled={v.is24} value={v.is24 ? '00:00' : v.open} onChange={set('open')} error={err.open} />
            <Input label="Cierre" type="time" disabled={v.is24} value={v.is24 ? '23:59' : v.close} onChange={set('close')} error={err.close} />
          </div>
        </section>
        <section className="fs"><div className="fh"><h3>Reservas</h3></div>
          <div className="g3">
            <Input label="Mínimo (h)" type="number" min={1} value={v.min} onChange={set('min')} error={err.min} />
            <Input label="Máximo (h)" type="number" min={1} value={v.max} onChange={set('max')} error={err.max} />
            <Input label="Tolerancia (h)" type="number" min={0} value={v.margin} onChange={set('margin')} error={err.margin} />
          </div>
        </section>
      </form>
    </Drawer>
  );
}
