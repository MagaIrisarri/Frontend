import { useState, useEffect } from 'react';
import { vehicleService } from '../../services/vehicleService';
import { useNavigate } from 'react-router-dom';
import { PhoneIcon } from '../../components/icons/PhoneIcon';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import carAnimation from '../../assets/carAnimation.json';
import './Vehicle.scss';

function CarHeaderAnimation() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
      <DotLottieReact
        data={carAnimation}
        loop
        autoplay
        style={{ width: '160px', height: '160px' }}
      />
    </div>
  );
}
export default function CreateVehiclePage() {
  const navigate = useNavigate();
  
  // ID de usuario fijo para las pruebas
  const FIXED_USER_ID = "550e8400-e29b-41d4-a716-446655440000"; 

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
    vehicleService.getBrands()
      .then((data) => setBrands(data.data || data))
      .catch((err) => console.error("Error al cargar marcas:", err));

    vehicleService.getInsurances()
      .then((data) => setInsurances(data.data || data))
      .catch((err) => console.error("Error al cargar seguros:", err));
  }, []);

  // Cargar modelos cuando cambia la marca seleccionada
  useEffect(() => {
    if (selectedBrand) {
      setSelectedModel('');
      
      vehicleService.getModels(selectedBrand)
        .then((data) => {
          const list = Array.isArray(data) ? data : (data?.data || []);
          setModels(list);
        })
        .catch((err) => {
          console.error("Error al cargar modelos:", err);
          setModels([]);
        });
    } else {
      setModels([]);
      setSelectedModel('');
    }
  }, [selectedBrand]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const vehiclePayload = {
        plate: plate.trim().toUpperCase(),
        year: Number(year),
        brandId: selectedBrand,
        modelId: selectedModel,
        insuranceId: selectedInsurance || undefined,
      };
      
      const response = await vehicleService.createVehicle(FIXED_USER_ID, vehiclePayload);
      alert(response.message || '¡Vehículo creado con éxito!');
      navigate('/vehicles');
    } catch (error: any) {
      console.error('Error al registrar el vehículo:', error);
      alert(error.message || 'Ocurrió un error al registrar el vehículo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-vehicle-container">
      <div className="create-vehicle-card">
        
        {/* Animación Lottie */}
        <CarHeaderAnimation />

        <header className="card-header">
          <h2>Registrar Vehículo</h2>
          <p>Ingresa los detalles del vehículo para asociarlo al cliente.</p>
        </header>

        {/* Tarjeta de contacto con el icono animado */}
        <div className="owner-contact-banner">
          <div className="owner-info">
            <span>Propietario</span>
            <span>Cliente ID: {FIXED_USER_ID.slice(0, 8)}...</span>
          </div>
          <button 
            type="button" 
            className="btn-contact"
            onClick={() => alert('Iniciando llamada con el cliente...')}
          >
            <PhoneIcon size={18} />
            Contactar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="vehicle-form">
          <div className="form-grid-2">
            <div className="form-group">
              <label htmlFor="plate">Patente / Placa</label>
              <input 
                id="plate"
                type="text"
                placeholder="Ej. AB123CD"
                value={plate} 
                onChange={(e) => setPlate(e.target.value.toUpperCase())} 
                required 
              />
            </div>

            <div className="form-group">
              <label htmlFor="year">Año</label>
              <input 
                id="year"
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
              <label htmlFor="brand">Marca</label>
              <select 
                id="brand"
                value={selectedBrand} 
                onChange={(e) => setSelectedBrand(e.target.value)} 
                required
              >
                <option value="">Selecciona marca</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="model">Modelo</label>
              <select 
                id="model"
                value={selectedModel} 
                onChange={(e) => setSelectedModel(e.target.value)} 
                required 
                disabled={!selectedBrand}
              >
                <option value="">
                  {selectedBrand ? "Selecciona modelo" : "Elige marca primero"}
                </option>
                {models.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="insurance">Seguro (Opcional)</label>
            <select 
              id="insurance"
              value={selectedInsurance} 
              onChange={(e) => setSelectedInsurance(e.target.value)}
            >
              <option value="">Sin seguro especificado</option>
              {insurances.map((i) => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </select>
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Guardando vehículo...' : 'Guardar Vehículo'}
            </button>

            <button 
              type="button"
              onClick={() => navigate('/vehicles')} 
              className="btn-ghost"
            >
              ← Volver a la lista
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}