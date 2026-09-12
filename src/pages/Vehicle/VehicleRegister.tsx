import React, { useState, useEffect } from 'react';
import { getBrands, getInsurances, getModels, createVehicle} from '../../services/vehicle.service';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Car, Shield } from 'lucide-react';
import { useCurrentUser } from '../../hooks/useCurrentUser.js';

export default function VehicleRegister() {
  const navigate = useNavigate();
  const currentUser = useCurrentUser();
  const userId = currentUser?.id ?? currentUser?._id ?? '';
  const userName = currentUser?.name ? `${currentUser.name} ${currentUser.last_name || ''}`.trim() : '';
  const [plate, setPlate] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  
  const [brands, setBrands] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [insurances, setInsurances] = useState<any[]>([]);
  
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedInsurance, setSelectedInsurance] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getBrands()
      .then((res: any) => setBrands(Array.isArray(res) ? res : (res?.data || res?.brands || [])))
      .catch((err) => console.error("Error al cargar marcas:", err));

    getInsurances()
      .then((res: any) => setInsurances(Array.isArray(res) ? res : (res?.data || res?.insurances || [])))
      .catch((err) => console.error("Error al cargar seguros:", err));
  }, []);

  useEffect(() => {
    if (selectedBrand) {
      setSelectedModel('');
      getModels(selectedBrand)
        .then((res: any) => setModels(Array.isArray(res) ? res : (res?.data || res?.models || [])))
        .catch(() => setModels([]));
    } else {
      setModels([]);
      setSelectedModel('');
    }
  }, [selectedBrand]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      const vehiclePayload = {
        plate: plate.trim().toUpperCase(),
        year: Number(year),
        brandId: selectedBrand,
        modelId: selectedModel,
        insuranceId: selectedInsurance || undefined,
      };
      
      const response = await createVehicle(userId, vehiclePayload);
      alert(response.message || '¡Vehículo creado con éxito!');
      navigate('/vehicles');
    } catch (error: any) {
      alert(error.message || 'Ocurrió un error al registrar el vehículo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f5] dark:bg-[#0B0F17] text-slate-900 dark:text-white p-6 md:p-10 transition-colors">
      <div className="max-w-3xl mx-auto space-y-6">
        <button
          type="button"
          onClick={() => navigate('/vehicles')}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver a Mis Vehículos</span>
        </button>

        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 md:p-8 shadow-sm">
          <header className="flex items-center justify-between pb-6 mb-6 border-b border-slate-100 dark:border-zinc-800">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Registrar Vehículo</h1>
              <p className="text-sm text-slate-600 dark:text-zinc-400 mt-1">Ingresá los detalles del vehículo para asociarlo a tu cuenta.</p>
            </div>
            <div className="w-14 h-14 hidden sm:flex items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 text-blue-600 dark:text-blue-400 shadow-sm transition-transform hover:scale-105">
              <Car className="h-7 w-7 animate-pulse" />
            </div>
          </header>

          <div className="mb-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-slate-700 dark:text-zinc-300">
                Titular: <strong className="text-slate-900 dark:text-white font-bold">{userName || `Usuario (${userId.slice(0, 8)}...)`}</strong>
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-zinc-400 mb-1.5">
                  Patente / Placa
                </label>
                <input 
                  type="text"
                  placeholder="Ej. AB123CD"
                  value={plate} 
                  onChange={(e) => setPlate(e.target.value.toUpperCase())} 
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono uppercase"
                  required 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-zinc-400 mb-1.5">
                  Año
                </label>
                <input 
                  type="number" 
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  value={year} 
                  onChange={(e) => setYear(Number(e.target.value))} 
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  required 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-zinc-400 mb-1.5">
                  Marca
                </label>
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  required
                >
                  <option value="">Seleccioná una marca</option>
                  {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-zinc-400 mb-1.5">
                  Modelo
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-50"
                  required
                  disabled={!selectedBrand}
                >
                  <option value="">{selectedBrand ? "Seleccioná un modelo" : "Elegí una marca primero"}</option>
                  {models.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-zinc-400 mb-1.5">
                Seguro (Opcional)
              </label>
              <select
                value={selectedInsurance}
                onChange={(e) => setSelectedInsurance(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="">Sin seguro especificado</option>
                {insurances.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            </div>

            <div className="pt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate('/vehicles')}
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 text-sm font-semibold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Guardando...' : 'Guardar Vehículo'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export { VehicleRegister };