import React, { useState, useEffect } from 'react';
import { vehicleService } from '../../services/vehicleService';
import { useNavigate } from 'react-router-dom';
import { PhoneIcon } from '../../components/icons/PhoneIcon';
import { ShineBorder } from '../../components/ui/shine-border';
import { Lottie } from 'lottie-react';
import carAnimation from '../../assets/carAnimation.json';
import './Vehicle.scss';

export default function VehicleRegister() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
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
    const rawUser = localStorage.getItem('user');
    if (!rawUser) {
      navigate('/login');
      return;
    }

    try {
      const parsed = JSON.parse(rawUser);
      const currentUser = parsed?.data ?? parsed?.user ?? parsed;
      const currentId = currentUser?.id ?? currentUser?._id;

      if (!currentId) {
        navigate('/login');
        return;
      }

      setUserId(currentId);
      setUserName(
        currentUser.name ? `${currentUser.name} ${currentUser.last_name || ''}`.trim() : ''
      );
    } catch {
      localStorage.removeItem('user');
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    vehicleService.getBrands()
      .then((res: any) => setBrands(Array.isArray(res) ? res : (res?.data || res?.brands || [])))
      .catch((err) => console.error("Error al cargar marcas:", err));

    vehicleService.getInsurances()
      .then((res: any) => setInsurances(Array.isArray(res) ? res : (res?.data || res?.insurances || [])))
      .catch((err) => console.error("Error al cargar seguros:", err));
  }, []);

  useEffect(() => {
    if (selectedBrand) {
      setSelectedModel('');
      vehicleService.getModels(selectedBrand)
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
      
      const response = await vehicleService.createVehicle(userId, vehiclePayload);
      alert(response.message || '¡Vehículo creado con éxito!');
      navigate('/vehicles');
    } catch (error: any) {
      alert(error.message || 'Ocurrió un error al registrar el vehículo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-vehicle-container bg-[#faf9f5]">
      <ShineBorder
        className="create-vehicle-card bg-zinc-900/90 border border-zinc-800 shadow-2xl backdrop-blur-md text-white"
        color={['#2563EB', '#38BDF8', '#818CF8']}
        borderRadius={16}
        borderWidth={1.5}
        duration={10}
      >
        <header className="card-header flex items-center justify-between">
          <div>
            <h2 className="text-white">Registrar Vehículo</h2>
            <p className="text-zinc-400">Ingresá los detalles del vehículo para asociarlo a tu cuenta.</p>
          </div>
          <div className="w-20 h-20 hidden sm:block">
            <Lottie src={carAnimation} autoplay loop={true} />
          </div>
        </header>

        <div className="owner-contact-banner">
          <div className="owner-info">
            <span>Propietario</span>
            <span>{userName ? userName : `Cliente ID: ${userId.slice(0, 8)}...`}</span>
          </div>
          <button type="button" className="btn-contact" onClick={() => alert('Soporte')}>
            <PhoneIcon size={18} /> Contactar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="vehicle-form">
          <div className="form-grid-2">
            <div className="form-group">
              <label className="text-zinc-400">Patente / Placa</label>
              <input 
                type="text"
                placeholder="Ej. AB123CD"
                value={plate} 
                onChange={(e) => setPlate(e.target.value.toUpperCase())} 
                required 
              />
            </div>
            <div className="form-group">
              <label className="text-zinc-400">Año</label>
              <input 
                type="number" 
                min="1900"
                max={new Date().getFullYear() + 1}
                value={year} 
                onChange={(e) => setYear(Number(e.target.value))} 
                required 
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="text-zinc-400">Marca</label>
              <select value={selectedBrand} onChange={(e) => setSelectedBrand(e.target.value)} required>
                <option value="">Seleccioná una marca</option>
                {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="text-zinc-400">Modelo</label>
              <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} required disabled={!selectedBrand}>
                <option value="">{selectedBrand ? "Seleccioná un modelo" : "Elegí una marca primero"}</option>
                {models.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="text-zinc-400">Seguro (Opcional)</label>
            <select value={selectedInsurance} onChange={(e) => setSelectedInsurance(e.target.value)}>
              <option value="">Sin seguro especificado</option>
              {insurances.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </div>

          <div className="form-actions">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Guardando...' : 'Guardar Vehículo'}
            </button>
            <button type="button" onClick={() => navigate('/profile')} className="btn-ghost">
              ← Volver al Perfil
            </button>
          </div>
        </form>
      </ShineBorder>
    </div>
  );
}

export { VehicleRegister };