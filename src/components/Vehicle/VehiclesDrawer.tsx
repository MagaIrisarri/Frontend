import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, Pencil, Plus, Shield, Trash2 } from 'lucide-react';
import { VICON } from '../Owner/ui/vehicles';
import {
  getUserVehicle,
  createVehicle,
  updateVehicle,
  removeVehicle,
  getBrands,
  getModels,
  getInsurances,
} from '../../services/vehicle.service';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { Drawer, ConfirmModal } from '../Owner/ui/Layer';
import OwnerShell from '../Owner/ui/OwnerShell';
import { Presence } from '../Owner/ui/Presence';
import { Empty, ErrorBox } from '../Owner/ui/Page';
import { Field, Input, apiError } from '../Owner/ui/Field';
import { useToast } from '../Owner/ui/Toasts';
import { plural } from '../../pages/Owner/owner.lib';

interface VehiclesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'list' | 'create';
}

type View = 'list' | 'create' | 'edit';

const asList = (res: any, key?: string) => (Array.isArray(res) ? res : res?.data || (key && res?.[key]) || []);
const idOf = (v: any) => v.id || v._id;

// Lista, alta y edición de vehículos en un solo panel: las acciones cambian la vista, no abren otro panel.
export function VehiclesDrawer(props: VehiclesDrawerProps) {
  return (
    <Presence open={props.isOpen}>
      <OwnerShell bare>
        <Content {...props} />
      </OwnerShell>
    </Presence>
  );
}

function Content({ onClose, initialTab = 'list' }: VehiclesDrawerProps) {
  const toast = useToast();
  const currentUser = useCurrentUser();
  const userId = currentUser?.id ?? currentUser?._id ?? '';

  const [view, setView] = useState<View>(initialTab);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [plate, setPlate] = useState('');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [insurance, setInsurance] = useState('');

  const [brands, setBrands] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [insurances, setInsurances] = useState<any[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);
  const shown = useRef<any | null>(null); // la confirmación conserva sus datos mientras se va
  if (deleteTarget) shown.current = deleteTarget;

  const loadVehicles = async () => {
    if (!userId) return;
    setLoading(true);
    setLoadError(false);
    try {
      setVehicles(asList(await getUserVehicle(userId)));
    } catch (err) {
      console.error('Error al cargar vehículos:', err);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userId) return;
    loadVehicles();
    Promise.all([getBrands().catch(() => []), getInsurances().catch(() => [])]).then(([b, i]) => {
      setBrands(asList(b, 'brands'));
      setInsurances(asList(i, 'insurances'));
    });
  }, [userId]);

  useEffect(() => {
    if (!brand) return setModels([]);
    getModels(brand)
      .then((res: any) => setModels(asList(res, 'models')))
      .catch(() => setModels([]));
  }, [brand]);

  // Al entrar al formulario el foco pasa a la patente (el botón que lo abrió ya no existe).
  useEffect(() => {
    if (view !== 'list') document.querySelector<HTMLInputElement>('#vehicle-form input')?.focus();
  }, [view]);

  const resetForm = () => {
    setPlate('');
    setYear(new Date().getFullYear());
    setBrand('');
    setModel('');
    setInsurance('');
    setEditingId(null);
    setError(null);
  };

  const backToList = () => {
    resetForm();
    setView('list');
  };

  const startEdit = (v: any) => {
    resetForm();
    setEditingId(idOf(v));
    setPlate(v.plate || '');
    setYear(v.year || new Date().getFullYear());
    setInsurance(v.insurance?.id || v.insuranceId || '');
    const brandId = v.brand?.id || v.brandId || '';
    setBrand(brandId);
    if (brandId) {
      getModels(brandId).then((res: any) => {
        setModels(asList(res, 'models'));
        setModel(v.model?.id || v.modelId || '');
      });
    }
    setView('edit');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setSubmitting(true);
    setError(null);
    const payload = {
      plate: plate.trim().toUpperCase(),
      year: Number(year),
      brandId: brand,
      modelId: model,
      insuranceId: insurance || undefined,
    };
    try {
      if (view === 'create') await createVehicle(userId, payload);
      else if (editingId) await updateVehicle(editingId, { ...payload, insuranceId: insurance || null }); // vacío quita el seguro
      toast(view === 'create' ? 'Vehículo registrado.' : 'Vehículo actualizado.');
      await loadVehicles();
      backToList();
    } catch (err) {
      setError(apiError(err, view === 'create' ? 'No se pudo registrar el vehículo.' : 'No se pudo actualizar el vehículo.'));
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const id = idOf(deleteTarget);
    setDeleting(true);
    try {
      await removeVehicle(id);
      setVehicles((prev) => prev.filter((v) => idOf(v) !== id));
      toast('Vehículo dado de baja.');
    } catch (err) {
      toast(apiError(err, 'No se pudo dar de baja el vehículo.'), 'err');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const isForm = view !== 'list';
  const title = view === 'list' ? 'Mis vehículos' : view === 'create' ? 'Registrar vehículo' : 'Editar vehículo';
  const sub = view === 'list' ? 'Elegí cuál usar al reservar' : 'Patente, marca y modelo';

  const footer = isForm ? (
    <div className="dfoot">
      <button type="button" className="btn" onClick={backToList}>Cancelar</button>
      <button type="submit" form="vehicle-form" className="btn pri" disabled={submitting} aria-busy={submitting || undefined}>
        {submitting ? 'Guardando…' : view === 'create' ? 'Guardar vehículo' : 'Guardar cambios'}
      </button>
    </div>
  ) : (
    vehicles.length > 0 && (
      <div className="dfoot">
        <button type="button" className="btn pri" onClick={() => { resetForm(); setView('create'); }}>
          <Plus className="i sm" />Agregar vehículo
        </button>
      </div>
    )
  );

  return (
    <>
      <Drawer title={title} sub={sub} onClose={onClose} onBack={isForm ? backToList : undefined} footer={footer || undefined}>
        {isForm ? (
          <form id="vehicle-form" className="dbody stack" onSubmit={submit}>
            {error && <div className="ferr" role="alert"><AlertCircle className="i sm" />{error}</div>}
            <div className="grid2">
              <Input label="Patente" placeholder="AB123CD" value={plate} required style={{ textTransform: 'uppercase' }}
                onChange={(e) => setPlate(e.target.value.toUpperCase())} />
              <Input label="Año de fabricación" type="number" min={1980} max={new Date().getFullYear() + 1} value={year} required
                onChange={(e) => setYear(Number(e.target.value))} />
            </div>
            <div className="grid2">
              <Field label="Marca">
                {(id, aria) => (
                  <select className="sel" id={id} {...aria} value={brand} required onChange={(e) => { setBrand(e.target.value); setModel(''); }}>
                    <option value="">Seleccioná una marca</option>
                    {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                )}
              </Field>
              <Field label="Modelo">
                {(id, aria) => (
                  <select className="sel" id={id} {...aria} value={model} required disabled={!brand} onChange={(e) => setModel(e.target.value)}>
                    <option value="">{brand ? 'Seleccioná un modelo' : 'Elegí una marca primero'}</option>
                    {models.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                )}
              </Field>
            </div>
            <Field label="Compañía de seguro (opcional)">
              {(id, aria) => (
                <select className="sel" id={id} {...aria} value={insurance} onChange={(e) => setInsurance(e.target.value)}>
                  <option value="">Sin seguro especificado</option>
                  {insurances.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
              )}
            </Field>
          </form>
        ) : (
          <div className="dbody stack" aria-busy={loading}>
            {loading ? (
              [0, 1].map((i) => (
                <div key={i} aria-hidden="true" className="rcard">
                  <span className="sk" style={{ height: 14, width: '40%' }} />
                  <span className="sk" style={{ height: 12, width: '65%' }} />
                </div>
              ))
            ) : loadError ? (
              <ErrorBox what="tus vehículos" onRetry={loadVehicles} />
            ) : vehicles.length === 0 ? (
              <Empty
                icon={<VICON.AUTO className="i" />}
                title="No tenés vehículos registrados"
                action={
                  <button type="button" className="btn pri" data-first onClick={() => { resetForm(); setView('create'); }}>
                    <Plus className="i sm" />Registrar mi primer vehículo
                  </button>
                }
              >
                Agregá tus autos, motos o camionetas para reservar más rápido.
              </Empty>
            ) : (
              <>
                <p className="sub">{plural(vehicles.length, 'vehículo registrado', 'vehículos registrados')}</p>
                <ul className="list">
                  {vehicles.map((v) => {
                    const brandName = v.brand?.name || v.brand || 'Marca';
                    const modelName = v.model?.name || v.model || 'Modelo';
                    const insuranceName = v.insurance?.name || v.insurance || null;
                    return (
                      <li key={idOf(v)} className="li vrow">
                        <div className="l">
                          <span className="plate">{v.plate}</span>
                          <div>
                            <div>{brandName} {modelName}</div>
                            <div className="sd">
                              <span>Año {v.year}</span>
                              {insuranceName && <span className="tag"><Shield className="i sm" aria-hidden="true" /> {insuranceName}</span>}
                            </div>
                          </div>
                        </div>
                        <div>
                          <button type="button" className="icon-btn" data-tip="Editar" aria-label={`Editar ${v.plate}`} onClick={() => startEdit(v)}>
                            <Pencil className="i" />
                          </button>
                          <button type="button" className="icon-btn" data-tip="Dar de baja" aria-label={`Dar de baja ${v.plate}`} onClick={() => setDeleteTarget(v)}>
                            <Trash2 className="i" />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </div>
        )}
      </Drawer>

      <Presence open={!!deleteTarget}>
        {shown.current && (
        <ConfirmModal
          title={`¿Dar de baja ${shown.current.plate}?`}
          body="El vehículo deja de aparecer en tu lista. Esta acción no se puede deshacer."
          ok="Dar de baja"
          danger
          busy={deleting}
          onConfirm={confirmDelete}
          onClose={() => setDeleteTarget(null)}
        />
        )}
      </Presence>
    </>
  );
}
