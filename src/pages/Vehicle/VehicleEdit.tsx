import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import VehicleForm from '../../components/Vehicle/VehicleForm';
import { getOneVehicle, updateVehicle } from '../../services/vehicle.service';
import type { UpdateVehicle } from '../../types/vehicle.types';
import '../Vehicle/Vehicle.scss';
import { formInitialState } from '../../components/Vehicle/VehicleForm.data';

export default function VehicleEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialData, setInitialData] = useState<{
    plate: string;
    year: string;
    brandId: string;
    modelId: string;
    insuranceId: string;
  }>();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setErrorMsg('No se encontró el vehiculo a editar.');
      setLoading(false);
      return;
    }

    const fetchVehicle = async () => {
      try {
        const res = await getOneVehicle(id);
        const vehicleData = res.data;

        setInitialData({
          plate: vehicleData.plate || '',
          year: String(vehicleData.year || ''),
          brandId: vehicleData.brand?.id || '',
          modelId: vehicleData.model?.id || '',
          insuranceId: vehicleData.insurance?.id || '',
        });
      } catch (err: any) {
        setErrorMsg(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicle();
  }, [id]);

  const handleUpdate = async (form: typeof formInitialState) => {
    setError(null);
    setIsSubmitting(true);

    const payload: UpdateVehicle = {
      plate: form.plate,
      year: Number(form.year),
      brandId: form.brandId,
      modelId: form.modelId,
      insuranceId: form.insuranceId,
    };

    try {
      await updateVehicle(id as string, payload);
      navigate('/vehicles');
    } catch (err: any) {
      const validationErrors = err.response?.data?.errors;
      if (validationErrors) {
        setError(validationErrors.map((e: any) => e.mensaje).join(' | '));
      } else {
        setError(err.response?.data?.error || err.response?.data?.message || 'Error al modificar los datos del vehiculo');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="create-vehicle-container bg-zinc-950">
      <div className="create-vehicle-card">
        <header className="management-header">
          <div className="header-info">
            <h1 className="text-white">Vehículo</h1>
            <p className="text-zinc-400">Completá los datos que deseas cambiar de tu Vehículo</p>
          </div>
        </header>

        {error && (
          <div className="state-container">
            <p className="text-destructive">{error}</p>
          </div>
        )}

        {isSubmitting && (
          <div className="state-container">
            <p className="text-zinc-400">Actualizando vehículo...</p>
          </div>
        )}

        {errorMsg ? (
          <div className="state-container">
            <p className="text-destructive">{errorMsg}</p>
          </div>
        ) : initialData ? (
          <VehicleForm initialData={initialData} onSubmit={handleUpdate} submitLabel="Actualizar vehículo" />
        ) : (
          <p>{loading ? 'Cargando...' : 'No se encontraron datos del vehículo.'}</p>
        )}

        <button type="button" onClick={() => navigate('/vehicles')} className="btn-ghost">
          ← Volver al listado
        </button>
      </div>
    </div>
  );
}

