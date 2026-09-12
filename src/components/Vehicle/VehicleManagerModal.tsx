import React, { useState, useEffect } from 'react';
import {
  X,
  Car,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Shield,
  Calendar,
  Layers,
  ArrowLeft,
} from 'lucide-react';
import {
  getUserVehicle,
  createVehicle,
  updateVehicle,
  removeVehicle,
  getBrands,
  getModels,
  getInsurances,
} from '../../services/vehicle.service';
import type { Vehicle } from '../../types/vehicle.types';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import ConfirmDialog from '../Shared/ConfirmDialog/ConfirmDialog';

interface VehicleManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'list' | 'create';
  onVehicleCreated?: (vehicle: Vehicle) => void;
  onVehiclesUpdated?: () => void;
}

export const VehicleManagerModal: React.FC<VehicleManagerModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'list',
  onVehicleCreated,
  onVehiclesUpdated,
}) => {
  const currentUser = useCurrentUser();
  const userId = currentUser?.id ?? currentUser?._id ?? '';

  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'edit'>(initialTab);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states (Create / Edit)
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);
  const [plate, setPlate] = useState('');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedInsurance, setSelectedInsurance] = useState('');

  // Catalog data
  const [brands, setBrands] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [insurances, setInsurances] = useState<any[]>([]);

  // Delete target
  const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null);

  // Reset / Sync tab on open
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setError(null);
      setSuccess(null);
      if (userId) {
        loadVehicles();
        loadCatalogs();
      }
    }
  }, [isOpen, initialTab, userId]);

  // Load models when brand changes
  useEffect(() => {
    if (selectedBrand) {
      getModels(selectedBrand)
        .then((res: any) => setModels(Array.isArray(res) ? res : (res?.data || res?.models || [])))
        .catch(() => setModels([]));
    } else {
      setModels([]);
    }
  }, [selectedBrand]);

  const loadVehicles = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const data = await getUserVehicle(userId);
      const list = Array.isArray(data) ? data : data?.data || [];
      setVehicles(list);
    } catch (err: any) {
      console.error('Error al cargar vehículos:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCatalogs = async () => {
    try {
      const [brandsRes, insurancesRes] = await Promise.all([
        getBrands().catch(() => []),
        getInsurances().catch(() => []),
      ]);
      setBrands(Array.isArray(brandsRes) ? brandsRes : brandsRes?.data || brandsRes?.brands || []);
      setInsurances(Array.isArray(insurancesRes) ? insurancesRes : insurancesRes?.data || insurancesRes?.insurances || []);
    } catch (err) {
      console.error('Error al cargar catálogos:', err);
    }
  };

  if (!isOpen) return null;

  const resetForm = () => {
    setPlate('');
    setYear(new Date().getFullYear());
    setSelectedBrand('');
    setSelectedModel('');
    setSelectedInsurance('');
    setEditingVehicleId(null);
    setError(null);
  };

  const handleStartCreate = () => {
    resetForm();
    setActiveTab('create');
  };

  const handleStartEdit = (v: any) => {
    resetForm();
    setEditingVehicleId(v.id || v._id);
    setPlate(v.plate || '');
    setYear(v.year || new Date().getFullYear());
    setSelectedBrand(v.brand?.id || v.brandId || '');
    setSelectedInsurance(v.insurance?.id || v.insuranceId || '');

    // Set model after brand models load or directly
    if (v.brand?.id || v.brandId) {
      getModels(v.brand?.id || v.brandId).then((res: any) => {
        const modelsList = Array.isArray(res) ? res : res?.data || res?.models || [];
        setModels(modelsList);
        setSelectedModel(v.model?.id || v.modelId || '');
      });
    }
    setActiveTab('edit');
  };

  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        plate: plate.trim().toUpperCase(),
        year: Number(year),
        brandId: selectedBrand,
        modelId: selectedModel,
        insuranceId: selectedInsurance || undefined,
      };

      const res = await createVehicle(userId, payload);
      setSuccess('¡Vehículo registrado con éxito!');
      await loadVehicles();
      if (onVehicleCreated) {
        onVehicleCreated(res?.data || res?.vehicle || res);
      }
      if (onVehiclesUpdated) {
        onVehiclesUpdated();
      }

      setTimeout(() => {
        setActiveTab('list');
        resetForm();
        setSuccess(null);
      }, 1200);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error al registrar vehículo');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVehicleId) return;

    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        plate: plate.trim().toUpperCase(),
        year: Number(year),
        brandId: selectedBrand,
        modelId: selectedModel,
        insuranceId: selectedInsurance || undefined,
      };

      await updateVehicle(editingVehicleId, payload);
      setSuccess('¡Vehículo actualizado correctamente!');
      await loadVehicles();
      if (onVehiclesUpdated) {
        onVehiclesUpdated();
      }

      setTimeout(() => {
        setActiveTab('list');
        resetForm();
        setSuccess(null);
      }, 1200);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error al actualizar vehículo');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDeleteVehicle = async () => {
    if (!deleteTarget) return;
    const vId = (deleteTarget as any).id || (deleteTarget as any)._id;

    try {
      await removeVehicle(vId);
      setVehicles((prev) => prev.filter((v: any) => (v.id || v._id) !== vId));
      if (onVehiclesUpdated) {
        onVehiclesUpdated();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al eliminar vehículo');
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75  animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors">
        
        {/* Header */}
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/80 dark:bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/10 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <Car className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                {activeTab === 'list'
                  ? 'Mis Vehículos Registrados'
                  : activeTab === 'create'
                  ? 'Registrar Nuevo Vehículo'
                  : 'Editar Vehículo'}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {activeTab === 'list'
                  ? 'Administrá tu flota para seleccionar en reservas'
                  : 'Completá los datos de la patente, marca y modelo'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            
            {(activeTab === 'create' || activeTab === 'edit') && (
              <button
                type="button"
                onClick={() => setActiveTab('list')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Vehiculos Registrados</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Notificaciones */}
        {error && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 dark:text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Contenido Dinámico */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: LISTADO DE VEHÍCULOS */}
          {activeTab === 'list' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Tus Vehículos ({vehicles.length})
                </span>        
              </div>

              {vehicles.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-3 text-zinc-400">
                    <Car className="h-6 w-6" />
                  </div>
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-white mb-1">
                    No tenés vehículos registrados
                  </h4>
                  <h4 className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto mb-4">
                    Agregá tus autos, motos o camionetas para reservar lugares de forma rápida.
                  </h4>
                  <button
                    type="button"
                    onClick={handleStartCreate}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Registrar mi primer vehículo</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {vehicles.map((v: any) => {
                    const currentId = v.id || v._id;
                    const brandName = v.brand?.name || v.brand || 'Marca';
                    const modelName = v.model?.name || v.model || 'Modelo';
                    const insuranceName = v.insurance?.name || v.insurance || null;

                    return (
                      <div
                        key={currentId}
                        className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <span className="px-2.5 py-1 rounded-lg bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white font-mono font-bold text-xs tracking-wider border border-zinc-300 dark:border-zinc-700">
                            {v.plate}
                          </span>

                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                              {brandName} {modelName}
                            </h4>
                            <div className="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                              <span>Año: {v.year}</span>
                              {insuranceName && (
                                <>
                                  <span>•</span>
                                  <span className="text-blue-500 dark:text-blue-400 flex items-center gap-1">
                                    <Shield className="h-3 w-3 inline" />
                                    {insuranceName}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(v)}
                            className="p-2 rounded-xl text-zinc-400 hover:text-blue-500 hover:bg-blue-500/10 transition-colors"
                            title="Editar vehículo"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(v)}
                            className="p-2 rounded-xl text-zinc-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                            title="Eliminar vehículo"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2 & 3: FORMULARIO DE REGISTRO / EDICIÓN */}
          {(activeTab === 'create' || activeTab === 'edit') && (
            <form
              onSubmit={activeTab === 'create' ? handleCreateVehicle : handleUpdateVehicle}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Patente */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
                    Patente
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. AB123CD"
                    value={plate}
                    onChange={(e) => setPlate(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-sm text-zinc-900 dark:text-white uppercase font-mono placeholder-zinc-400 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                {/* Año */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
                    Año de Fabricación
                  </label>
                  <input
                    type="number"
                    min="1980"
                    max={new Date().getFullYear() + 1}
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Marca */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
                    Marca
                  </label>
                  <select
                    value={selectedBrand}
                    onChange={(e) => setSelectedBrand(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-blue-500"
                    required
                  >
                    <option value="">Seleccioná una marca</option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Modelo */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
                    Modelo
                  </label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    disabled={!selectedBrand}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
                    required
                  >
                    <option value="">
                      {selectedBrand ? 'Seleccioná un modelo' : 'Elegí una marca primero'}
                    </option>
                    {models.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Seguro */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
                  Compañía de Seguro (Opcional)
                </label>
                <select
                  value={selectedInsurance}
                  onChange={(e) => setSelectedInsurance(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Sin seguro especificado</option>
                  {insurances.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Botones de acción */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <span>{activeTab === 'create' ? 'Guardar Vehículo' : 'Actualizar Vehículo'}</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        {activeTab === 'list' && vehicles.length > 0 && (
          <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-950/60 flex items-center justify-between">
            <span className="text-xs text-zinc-500">
              Total: {vehicles.length} vehículo{vehicles.length === 1 ? '' : 's'}
            </span>
            <button
              type="button"
              onClick={handleStartCreate}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer"
            >
              + Agregar Vehículo
            </button>
          </div>
        )}
      </div>

      {/* Diálogo de Confirmación de Baja */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Dar de baja vehículo"
        message={`¿Confirmás que querés dar de baja la patente "${deleteTarget?.plate}"? Esta acción no se puede deshacer.`}
        confirmLabel="Sí, dar de baja"
        cancelLabel="Cancelar"
        onConfirm={confirmDeleteVehicle}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default VehicleManagerModal;


