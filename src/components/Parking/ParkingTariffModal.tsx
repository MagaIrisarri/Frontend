import React, { useEffect, useState } from 'react';
import {
  DollarSign,
  Car,
  Bike,
  Truck,
  Plus,
  Trash2,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Pencil,
  Check,
  Power,
  Layers,
} from 'lucide-react';
import {
  getParkingPrices,
  createParkingPrice,
  updateParkingPrice,
  deleteParkingPrice,
  reactivateParking,
  deleteParking,
} from '../../services/Parking';
import {
  getParkingServices,
  createServicePrice,
  deleteServicePrice,
  getServiceCatalog,
  type ServiceCatalogItem,
} from '../../services/ServicePrice';
import { getVehicleTypes } from '../../services/VehicleType';
import type { VehicleType } from '../../types/vehicle.types';
import type { Parking } from '../../types/Parking';

export const getVehicleIcon = (typeName: string) => {
  const t = (typeName || '').toLowerCase();
  if (t.includes('moto') || t.includes('bici')) return Bike;
  if (t.includes('camion') || t.includes('util') || t.includes('van') || t.includes('pick') || t.includes('suv')) return Truck;
  return Car;
};

// Mantenemos compatibilidad con cualquier llamada existente
export const getCategoryInfo = (rawType: string) => {
  const icon = getVehicleIcon(rawType);
  return { label: rawType, icon };
};

export const isVehicleMatch = (typeA?: string, typeB?: string): boolean => {
  if (!typeA || !typeB) return false;
  const a = typeA.trim().toLowerCase();
  const b = typeB.trim().toLowerCase();
  if (a === b) return true;
  if ((a.includes('moto') || a.includes('bici')) && (b.includes('moto') || b.includes('bici'))) return true;
  if (
    (a.includes('camion') || a.includes('util') || a.includes('van') || a.includes('pick') || a.includes('suv')) &&
    (b.includes('camion') || b.includes('util') || b.includes('van') || b.includes('pick') || b.includes('suv'))
  ) return true;
  if ((a.includes('auto') || a.includes('car')) && (b.includes('auto') || b.includes('car'))) return true;
  return false;
};

interface ParkingTariffModalProps {
  isOpen: boolean;
  onClose: () => void;
  parking: Parking | null;
  onUpdated?: () => void;
}

const DEFAULT_CATEGORIES = [
  { name: 'Auto', icon: Car, label: 'Autos y Sedanes' },
  { name: 'Moto', icon: Bike, label: 'Motos y Ciclomotores' },
  { name: 'Camioneta', icon: Truck, label: 'Camionetas y Utilitarios' },
];

export const ParkingTariffModal: React.FC<ParkingTariffModalProps> = ({
  isOpen,
  onClose,
  parking,
  onUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'tariffs' | 'services'>('tariffs');
  const [prices, setPrices] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [catalog, setCatalog] = useState<ServiceCatalogItem[]>([]);
  const [, setVehicleTypes] = useState<VehicleType[]>([]);

  // Estado de la cochera (ACTIVO / INACTIVO)
  const [parkingState, setParkingState] = useState<string>('ACTIVO');
  const [togglingState, setTogglingState] = useState(false);

  // Inline editing para tarifas
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [inlinePriceInput, setInlinePriceInput] = useState<string>('');
  const [savingCategory, setSavingCategory] = useState<string | null>(null);

  // Formulario para servicios extra
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [servicePriceVal, setServicePriceVal] = useState<string>('');
  const [savingService, setSavingService] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(null), 3500);
    return () => clearTimeout(timer);
  }, [success]);

  const loadData = async () => {
    if (!parking) return;
    try {
      setLoading(true);
      setError(null);
      setParkingState(parking.state || 'ACTIVO');

      const [pricesRes, servicesRes, catalogRes, typesRes] = await Promise.all([
        getParkingPrices(parking.id).catch(() => []),
        getParkingServices(parking.id).catch(() => []),
        getServiceCatalog().catch(() => []),
        getVehicleTypes().catch(() => []),
      ]);

      setPrices(Array.isArray(pricesRes) ? pricesRes : []);
      setServices(Array.isArray(servicesRes) ? servicesRes : []);
      const loadedCatalog = Array.isArray(catalogRes) ? catalogRes : [];
      setCatalog(loadedCatalog);

      const rawTypes = Array.isArray(typesRes)
        ? typesRes
        : Array.isArray(typesRes?.data)
        ? typesRes.data
        : [];
      const activeOfficialTypes = rawTypes.filter((t: any) => t && t.isActive !== false);
      setVehicleTypes(activeOfficialTypes);

      if (loadedCatalog.length > 0) {
        setSelectedServiceId(loadedCatalog[0].id);
      }
    } catch {
      setError('Error al cargar tarifas y servicios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && parking) {
      loadData();
    }
  }, [isOpen, parking]);

  if (!isOpen || !parking) return null;

  // Toggle de Estado de Cochera (Habilitada / Pausada)
  const handleToggleParkingState = async () => {
    try {
      setTogglingState(true);
      setError(null);
      if (parkingState === 'ACTIVO') {
        await deleteParking(parking.id);
        setParkingState('INACTIVO');
        setSuccess('Cochera pausada temporalmente (no visible en búsquedas)');
      } else {
        await reactivateParking(parking.id);
        setParkingState('ACTIVO');
        setSuccess('Cochera habilitada y visible al público');
      }
      if (onUpdated) onUpdated();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cambiar estado de la cochera');
    } finally {
      setTogglingState(false);
    }
  };

  // Iniciar edición inline de una categoría de vehículo
  const handleStartInlineEdit = (categoryName: string, currentPrice?: number) => {
    setEditingCategory(categoryName);
    setInlinePriceInput(currentPrice ? String(currentPrice) : '');
    setError(null);
  };

  const handleCancelInlineEdit = () => {
    setEditingCategory(null);
    setInlinePriceInput('');
    setError(null);
  };

  // Guardar tarifa inline
  const handleSaveInlinePrice = async (categoryName: string) => {
    const num = Number(inlinePriceInput.replace(/\D/g, ''));
    if (isNaN(num) || num <= 0) {
      setError('Ingresá un precio válido por hora mayor a 0');
      return;
    }

    try {
      setSavingCategory(categoryName);
      setError(null);

      // Buscar si ya existe una tarifa para esta categoría
      const existingPrice = prices.find((p) => isVehicleMatch(p.vehicleType, categoryName));

      if (existingPrice) {
        await updateParkingPrice(existingPrice.id, {
          price: num,
          vehicleType: existingPrice.vehicleType || categoryName,
        });
        setSuccess(`Tarifa para ${categoryName} actualizada a $${num.toLocaleString('es-AR')}/h`);
      } else {
        await createParkingPrice(parking.id, {
          vehicleType: categoryName,
          price: num,
        });
        setSuccess(`Tarifa para ${categoryName} configurada a $${num.toLocaleString('es-AR')}/h`);
      }

      // Si la cochera estaba inactiva por falta de tarifas, intentar reactivar
      await reactivateParking(parking.id).catch(() => null);

      setEditingCategory(null);
      setInlinePriceInput('');
      await loadData();
      if (onUpdated) onUpdated();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar la tarifa');
    } finally {
      setSavingCategory(null);
    }
  };

  // Eliminar tarifa de una categoría
  const handleDeletePrice = async (priceId: string, categoryName: string) => {
    try {
      setError(null);
      await deleteParkingPrice(priceId);
      setSuccess(`Tarifa para ${categoryName} eliminada`);
      await loadData();
      if (onUpdated) onUpdated();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al eliminar la tarifa');
    }
  };

  // Crear asignación de Servicio Extra
  const handleCreateServicePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = Number(servicePriceVal.replace(/\D/g, ''));
    if (isNaN(priceNum) || priceNum <= 0) {
      setError('Ingresá un precio válido para el servicio');
      return;
    }

    if (!selectedServiceId) {
      setError('Seleccioná un servicio del catálogo');
      return;
    }

    try {
      setSavingService(true);
      setError(null);
      await createServicePrice(parking.id, {
        serviceCatalogId: selectedServiceId,
        price: priceNum,
      });

      setSuccess('Servicio asignado exitosamente');
      setServicePriceVal('');
      await loadData();
      if (onUpdated) onUpdated();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al asignar servicio');
    } finally {
      setSavingService(false);
    }
  };

  // Eliminar asignación de Servicio Extra
  const handleDeleteServicePrice = async (servicePriceId: string) => {
    try {
      setError(null);
      await deleteServicePrice(servicePriceId);
      setSuccess('Servicio eliminado');
      await loadData();
      if (onUpdated) onUpdated();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al eliminar servicio');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs transition-all duration-200">
      <div className="bg-white dark:bg-[#0B0F17] text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col transition-all">
        
        {/* Cabecera compacta con Estado de Cochera */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3 bg-slate-50/80 dark:bg-[#111827]/60">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-500" />
              <span>Configurar Tarifas y Servicios</span>
            </h2>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <span className="font-semibold text-slate-800 dark:text-slate-300">{parking.name}</span>
              <span>•</span>
              <span className="truncate max-w-[220px]">{parking.address}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle rápido de estado de cochera */}
            <button
              type="button"
              onClick={handleToggleParkingState}
              disabled={togglingState}
              title={parkingState === 'ACTIVO' ? 'Pausar visibilidad de cochera' : 'Habilitar cochera al público'}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                parkingState === 'ACTIVO'
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
              }`}
            >
              {togglingState ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Power className="h-3 w-3" />
              )}
              <span>{parkingState === 'ACTIVO' ? 'Habilitada' : 'Pausada'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Notificaciones / Alertas de éxito o error */}
        {error && (
          <div className="mx-5 mt-3 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mx-5 mt-3 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Pestañas de Navegación Unificadas con Azul Primario */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-5 pt-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab('tariffs');
              setError(null);
            }}
            className={`py-2.5 px-3 text-xs font-semibold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'tariffs'
                ? 'text-blue-600 dark:text-blue-500 border-blue-600 dark:border-blue-500'
                : 'text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Car className="h-3.5 w-3.5" />
            <span>Tarifas por Hora</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('services');
              setError(null);
            }}
            className={`py-2.5 px-3 text-xs font-semibold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'services'
                ? 'text-blue-600 dark:text-blue-500 border-blue-600 dark:border-blue-500'
                : 'text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Servicios Extra ({services.length})</span>
          </button>
        </div>

        {/* Contenido Principal */}
        <div className="p-5 space-y-4">
          {loading ? (
            <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600 dark:text-blue-500" />
              <span className="text-xs">Cargando tarifas y servicios...</span>
            </div>
          ) : activeTab === 'tariffs' ? (
            
            /* =========================================================
               PESTAÑA 1: Tarifas por Hora con Edición Inline Directa
               ========================================================= */
            <div className="space-y-3">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Establecé el valor por hora para cada tipo de vehículo admitido en la cochera:
              </p>

              <div className="space-y-2">
                {DEFAULT_CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const matchedPrice = prices.find((p) => isVehicleMatch(p.vehicleType, cat.name));
                  const isEditing = editingCategory === cat.name;
                  const isSavingThis = savingCategory === cat.name;

                  return (
                    <div
                      key={cat.name}
                      className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                        isEditing
                          ? 'bg-blue-50/70 dark:bg-blue-950/20 border-blue-500/50 ring-1 ring-blue-500/20'
                          : 'bg-slate-50 dark:bg-[#161F30]/70 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      {/* Información de Categoría */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-lg bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shrink-0">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white">{cat.name}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">{cat.label}</div>
                        </div>
                      </div>

                      {/* Modo Visualización vs Modo Edición Inline */}
                      {isEditing ? (
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-500 dark:text-slate-400 font-bold">$</span>
                            <input
                              type="text"
                              autoFocus
                              value={inlinePriceInput}
                              onChange={(e) => setInlinePriceInput(e.target.value.replace(/\D/g, ''))}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveInlinePrice(cat.name);
                                if (e.key === 'Escape') handleCancelInlineEdit();
                              }}
                              placeholder="0"
                              className="w-24 pl-6 pr-2 py-1 bg-white dark:bg-[#0B0F17] border border-blue-500 rounded-lg text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-400"
                            />
                          </div>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">/h</span>

                          <button
                            type="button"
                            disabled={isSavingThis}
                            onClick={() => handleSaveInlinePrice(cat.name)}
                            className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors cursor-pointer disabled:opacity-50 active:scale-95"
                            title="Guardar tarifa"
                          >
                            {isSavingThis ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelInlineEdit}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer active:scale-95"
                            title="Cancelar"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 shrink-0">
                          {matchedPrice ? (
                            <div className="text-right">
                              <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                                ${Number(matchedPrice.price).toLocaleString('es-AR')}
                              </span>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 ml-1">/ hora</span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 italic">Sin tarifa</span>
                          )}

                          <button
                            type="button"
                            onClick={() => handleStartInlineEdit(cat.name, matchedPrice?.price)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer active:scale-95"
                            title={matchedPrice ? 'Editar tarifa' : 'Asignar tarifa'}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>

                          {matchedPrice && (
                            <button
                              type="button"
                              onClick={() => handleDeletePrice(matchedPrice.id, cat.name)}
                              className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 transition-colors cursor-pointer active:scale-95"
                              title="Eliminar tarifa"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            
            /* =========================================================
               PESTAÑA 2: Servicios Extra (Lavado, Valet, etc.)
               ========================================================= */
            <div className="space-y-4">
              {/* Formulario compacto para asignar servicio */}
              <form onSubmit={handleCreateServicePrice} className="p-3 rounded-xl bg-slate-50 dark:bg-[#161F30]/70 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-300">Asignar Servicio Adicional</div>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-7">
                    <select
                      value={selectedServiceId}
                      onChange={(e) => setSelectedServiceId(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-[#0B0F17] border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white outline-none focus:border-blue-500"
                    >
                      {catalog.length === 0 ? (
                        <option value="">No hay servicios en catálogo</option>
                      ) : (
                        catalog.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                  <div className="sm:col-span-5 relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-500 dark:text-slate-400 font-bold">$</span>
                    <input
                      type="text"
                      placeholder="Precio extra"
                      value={servicePriceVal}
                      onChange={(e) => setServicePriceVal(e.target.value.replace(/\D/g, ''))}
                      className="w-full pl-6 pr-2 py-1.5 bg-white dark:bg-[#0B0F17] border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500 placeholder-slate-400"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingService || catalog.length === 0}
                  className="w-full py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                >
                  {savingService ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5 stroke-[2.5]" />}
                  <span>+ Asignar Servicio</span>
                </button>
              </form>

              {/* Lista de servicios asignados */}
              <div className="space-y-1.5">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-400">Servicios activos en esta sucursal:</div>
                {services.length === 0 ? (
                  <div className="py-4 text-center text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-[#0B0F17]/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-xs">
                    No tenés servicios adicionales asignados a esta cochera.
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {services.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-[#161F30]/50 border border-slate-200 dark:border-slate-800 text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{s.serviceCatalog?.name || 'Servicio'}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">{s.serviceCatalog?.description || 'Servicio adicional'}</div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-emerald-600 dark:text-emerald-400">${Number(s.price).toLocaleString('es-AR')}</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteServicePrice(s.id)}
                            className="p-1 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                            title="Eliminar servicio"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer fijo y limpio */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#111827]/40 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer active:scale-95"
          >
            Listo / Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};

export default ParkingTariffModal;


