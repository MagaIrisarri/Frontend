import { useEffect, useState, type FormEvent } from 'react';
import { Drawer } from '../../components/Owner/ui/Layer';
import { Presence } from '../../components/Owner/ui/Presence';
import { Field, Input, apiError } from '../../components/Owner/ui/Field';
import { vehicleKey } from '../../components/Owner/ui/vehicles';
import { useToast } from '../../components/Owner/ui/Toasts';
import { walkInReservation } from '../../services/reservation.service';
import { getParkingServices } from '../../services/servicePrice.service';
import { getBrands, getModels } from '../../services/vehicle.service';
import { cleanPlate, plateState } from '../../utils/plate';
import { capOf, mm, money, plural, priceOf, type Svc } from '../Owner/owner.lib';
import { hhmm, list, type EParking } from './employee.lib';

const EMPTY = { plate: '', brandId: '', modelId: '', name: '', last_name: '', dni: '', email: '', phone: '' };
const PLATE_HELP = 'Letras y números, sin espacios.';

// R-29: ingreso de mostrador. Patente, vehículo, cliente y horas; el inicio (ahora, sin segundos) lo fija el servidor.
export default function WalkInDrawer({ open, ...p }: WalkInProps & { open: boolean }) { return <Presence open={open}><WalkIn {...p} /></Presence>; }
type WalkInProps = { parking: EParking; userId: string; onChange: () => Promise<void>; onClose: () => void };
function WalkIn({ parking, userId, onChange, onClose }: WalkInProps) {
  const toast = useToast();
  const [v, setV] = useState(EMPTY);
  const [hours, setHours] = useState(parking.minReservationHours || 1);
  const [svcIds, setSvcIds] = useState<string[]>([]);
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [offer, setOffer] = useState<Svc[]>([]);
  const [err, setErr] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof EMPTY) => (e: { target: { value: string } }) => { setV(x => ({ ...x, [k]: e.target.value })); setErr(x => ({ ...x, [k]: '' })); };

  useEffect(() => {
    getBrands().then(x => setBrands(list(x))).catch(() => toast('No se pudieron cargar las marcas.', 'err'));
    getParkingServices(parking.id).then(x => setOffer(list(x).filter((s: any) => s.expirationDate == null)
      .map((s: any) => ({ id: s.id, name: s.serviceCatalog?.name ?? 'Servicio', price: Number(s.price) })))).catch(() => setOffer([]));
  }, [parking.id, toast]);
  useEffect(() => {
    setModels([]);
    if (v.brandId) getModels(v.brandId).then(x => setModels(list(x))).catch(() => toast('No se pudieron cargar los modelos.', 'err'));
  }, [v.brandId, toast]);

  // Horas posibles: desde el mínimo de la sucursal hasta lo que queda hasta el cierre, sin pasar el máximo.
  const nowD = new Date();
  const nowMin = nowD.getHours() * 60 + nowD.getMinutes();
  const minH = parking.minReservationHours || 1;
  const maxH = Math.min(parking.maxReservationHours || 24, Math.floor((mm(parking.closingTime) - nowMin) / 60));
  const close = parking.closingTime.slice(0, 5);
  const blocked = nowMin < mm(parking.openingTime) ? `La sucursal abre a las ${parking.openingTime.slice(0, 5)}.`
    : maxH < minH ? `Ya no cabe una estadía de ${plural(minH, 'hora', 'horas')} antes del cierre (${close}): no se registran ingresos nuevos.` : '';
  const h = Math.min(Math.max(hours, minH), Math.max(maxH, minH));
  const endsAt = new Date(nowD.getFullYear(), nowD.getMonth(), nowD.getDate(), nowD.getHours(), nowD.getMinutes() + h * 60);

  const model = models.find(m => m.id === v.modelId);
  const key = model ? vehicleKey(model.vehicleType) : null;
  const rate = key ? priceOf(parking, key)?.price ?? null : null;
  const noRate = key != null && rate == null;
  const noSpaces = key != null && capOf(parking, key) === 0;
  const picked = offer.filter(s => svcIds.includes(s.id));
  const total = rate != null ? rate * h + picked.reduce((a, s) => a + s.price, 0) : null;

  const plate = cleanPlate(v.plate);
  const plateSt = plateState(plate);
  const plateMsg = plateSt === 'ok' ? 'Patente válida. Si ya está registrada se reutiliza el vehículo.' : plateSt === 'bad' ? 'Formatos: AB123CD, ABC123, A123BCD o 123ABC.' : PLATE_HELP;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const e2: Record<string, string> = {};
    if (plateSt !== 'ok') e2.plate = 'La patente no tiene un formato argentino válido.';
    if (!v.brandId) e2.brandId = 'Elegí la marca.';
    if (!v.modelId) e2.modelId = 'Elegí el modelo.';
    if (v.name.trim().length < 2) e2.name = 'Al menos 2 caracteres.';
    if (v.last_name.trim().length < 2) e2.last_name = 'Al menos 2 caracteres.';
    if (!/^\d{7,8}$/.test(v.dni.trim())) e2.dni = '7 u 8 dígitos, sin puntos.';
    if (!/^\S+@\S+\.\S+$/.test(v.email.trim())) e2.email = 'Email inválido.';
    if (v.phone.trim() && !/^\d{6,15}$/.test(v.phone.trim())) e2.phone = 'Solo dígitos (6 a 15).';
    setErr(e2);
    if (Object.keys(e2).length || blocked || noRate || noSpaces) return;
    setBusy(true);
    try {
      const res = await walkInReservation({
        parkingId: parking.id, plate, brandId: v.brandId, modelId: v.modelId, hours: h, serviceIds: svcIds.length ? svcIds : undefined,
        name: v.name.trim(), last_name: v.last_name.trim(), dni: v.dni.trim(), email: v.email.trim(), phone: v.phone.trim() || undefined,
      }, userId);
      await onChange();
      const space = res?.data?.parkingSpace?.spaceCode;
      toast(`Ingreso de ${plate} registrado${space ? ` en la plaza ${space}` : ''}.`);
      if (res?.accountCreated) toast(`Se creó la cuenta de ${v.email.trim()}; su contraseña inicial es su DNI.`, 'info');
      onClose();
    } catch (x) { toast(apiError(x, 'No se pudo registrar el ingreso.'), 'err'); }
    setBusy(false);
  };

  return (
    <Drawer title="Nuevo ingreso" sub={`Ahora ${hhmm(nowD)} · cliente de mostrador`} onClose={onClose} focusSel="[data-first]"
      footer={<div className="dfoot"><button type="button" className="btn" onClick={onClose}>Cancelar</button>
        <button className="btn pri" type="submit" form="wform" disabled={busy || !!blocked || noRate || noSpaces}>Registrar ingreso</button></div>}>
      <form id="wform" noValidate className="dbody" onSubmit={submit}>
        {blocked && <div className="e-note warn" role="alert"><span>{blocked}</span></div>}
        <Field label="Patente" error={err.plate} hint={plateMsg}>
          {(id, aria) => <input className="inp plate" id={id} {...aria} placeholder="Patente" autoComplete="off" maxLength={7} value={v.plate} data-first
            aria-invalid={plateSt === 'bad' || !!err.plate || undefined}
            onChange={e => { setV(x => ({ ...x, plate: cleanPlate(e.target.value) })); setErr(x => ({ ...x, plate: '' })); }} />}
        </Field>

        {plateSt === 'ok' && <>
          <section className="fs"><div className="fh"><h3>Vehículo</h3></div>
            <div className="e-two">
              <Field label="Marca" error={err.brandId}>{(id, aria) => <select className="sel" id={id} {...aria} value={v.brandId} onChange={e => { setV(x => ({ ...x, brandId: e.target.value, modelId: '' })); setErr(x => ({ ...x, brandId: '' })); }}>
                <option value="">Elegir…</option>{brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select>}</Field>
              <Field label="Modelo" error={err.modelId}>{(id, aria) => <select className="sel" id={id} {...aria} value={v.modelId} disabled={!v.brandId} onChange={set('modelId')}>
                <option value="">Elegir…</option>{models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select>}</Field>
            </div>
            <div className={`e-vt${key && !noRate && !noSpaces ? ' ok' : noRate || noSpaces ? ' err' : ''}`}><span>Tarifa</span>
              <b>{!key ? 'Elegí marca y modelo' : noSpaces ? `Sin plazas de ${key.toLowerCase()}` : noRate ? `Sin tarifa para ${key.toLowerCase()}` : `${key} · ${money(rate!)}/h`}</b></div>
          </section>

          <section className="fs"><div className="fh"><h3>Cliente</h3></div>
            <div className="e-two"><Input label="Nombre" value={v.name} onChange={set('name')} error={err.name} /><Input label="Apellido" value={v.last_name} onChange={set('last_name')} error={err.last_name} /></div>
            <div className="e-two"><Input label="DNI" placeholder="Sin puntos" inputMode="numeric" maxLength={8} value={v.dni} onChange={set('dni')} error={err.dni} />
              <Input label="Teléfono (opcional)" type="tel" placeholder="3415550123" value={v.phone} onChange={set('phone')} error={err.phone} /></div>
            <Input label="Email" type="email" autoComplete="off" value={v.email} onChange={set('email')} error={err.email}
              hint="Si no tiene cuenta se crea con su DNI como contraseña y la cambia al entrar." />
          </section>

          <section className="fs"><div className="fh"><h3>Tiempo</h3></div>
            <div className="e-step">
              <button type="button" className="btn" aria-label="Menos una hora" disabled={h <= minH} onClick={() => setHours(h - 1)}>−</button>
              <output aria-live="polite">{plural(h, 'hora', 'horas')}</output>
              <button type="button" className="btn" aria-label="Más una hora" disabled={h >= maxH} onClick={() => setHours(h + 1)}>+</button>
              <span className="dim">Desde ahora hasta las {hhmm(endsAt)}. Máximo {Math.max(maxH, 0)} h: la cochera cierra a las {close}.</span>
            </div>
          </section>

          {offer.length > 0 && <section className="fs"><div className="fh"><h3>Servicios · opcional</h3></div>
            <div className="e-opts" role="group" aria-label="Servicios">
              {offer.map(s => (
                <button key={s.id} type="button" role="checkbox" aria-checked={svcIds.includes(s.id)} className="e-opt"
                  onClick={() => setSvcIds(x => x.includes(s.id) ? x.filter(i => i !== s.id) : [...x, s.id])}>
                  <span>{s.name}</span><span>+{money(s.price)}</span>
                </button>
              ))}
            </div></section>}

          <div className="e-sum est">
            <div><span>{h} h × {rate != null ? money(rate) : '—'}</span><span>{rate != null ? money(rate * h) : '—'}</span></div>
            {picked.map(s => <div key={s.id}><span>{s.name}</span><span>{money(s.price)}</span></div>)}
            <div className="t"><span>Total estimado</span><span>{total != null ? money(total) : '—'}</span></div>
            <span className="dim">Se cobra al salir. Si se pasa de hora, se suman las horas extra.</span>
          </div>
        </>}
      </form>
    </Drawer>
  );
}
