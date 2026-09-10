import React, { useState, useEffect } from 'react';
import { vehicleService } from '../../services/vehicleService';
import { useNavigate, useParams} from 'react-router-dom';
import { ShineBorder } from '../../components/ui/shine-border';
import './Vehicle.scss';

export default function VehicleEdit() {
  const navigate = useNavigate();
  const {id} = useParams<{id: string}> ();

  const [plate, setPlate] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [brands, setBrands] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [insurances, setInsurances] = useState<any[]>([]);

  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedInsurance, setSelectedInsurance] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() =>{
    vehicleService.getBrands()
    .then((res:any) => setBrands(Array.isArray(res)? res: (res?.data || [])) )
    .catch( (err) => console.error("Error al cargar marcas:", err))

    vehicleService.getInsurances()
    .then((res:any) => setInsurances(Array.isArray(res)? res: (res?.data || [])) )
    .catch( (err) => console.error("Error al cargar seguros:", err))

    if (id) {
      vehicleService.getVehicleId(id)
        .then((v: any) => {
          if (v) {
            setPlate(v.plate || '');
            setYear(v.year || new Date().getFullYear());
            setSelectedBrand(v.brand?.id || v.Brand?.id || '');
            setSelectedModel(v.model?.id || '');
            setSelectedInsurance(v.insurance?.id || v.Insurance?.id || '');
          }
        })
        .catch((err) => console.error("Error al cargar vehiculo: ", err));
    }
  }, [id]);

  useEffect(() => {
    if (selectedBrand) {
      vehicleService.getModels(selectedBrand)
      .then((res: any) => setModels(Array.isArray(res)? res: (res?.data || [])))
      .catch(() => setModels([]) );
    } else {
      setModels([]);
    }
  }, [selectedBrand]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id)
      return;

  setLoading(true);
    try {
      const vehiclePayload = {
        plate: plate.trim().toUpperCase(),
        year: Number(year),
        brandId: selectedBrand,
        modelId: selectedModel,
        insuranceId: selectedInsurance || undefined,
      };
      const response = await vehicleService.updateVehicle(id, vehiclePayload);
      alert (response.message || '¡Vehiculo actualizado con exito!' );
      navigate('/vehicles');
    } catch (error: any) {
      alert(error.message || 'Ocurrio un error al actualizar el vehiculo');
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
           <h2 className="text-white">Modificar vehiculo</h2>
          </div>
        </header> 

        <form onSubmit={handleSubmit} className="vehicle-form">
          <div className="form-grid-2">
            <div className="form-group">
              <label className="text-zinc-400">Patente / Placa</label>
              <input 
                type="text"
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
              {loading ? 'Guardando...' : 'Guardar cambios'}
            </button>
            <button type="button" onClick={() => navigate('/vehicles')} className="btn-ghost">
              ← Cancelar 
            </button>
          </div>
        </form>
      </ShineBorder>
    </div>
  );
}