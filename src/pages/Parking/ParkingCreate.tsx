import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ParkingForm from '../../components/Parking/ParkingForm.js';
import { createParking } from '../../services/Parking.js';
import type { CreateParkingInput } from '../../types/Parking.js';
import '../Vehicle/Vehicle.scss';
import { formInitialState } from "../../components/Parking/ParkingForm.data.js";

export default function ParkingsCreate() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem('user');
    const parsedUser = raw ? JSON.parse(raw) : null;

    if (!parsedUser) {
      navigate('/login');
      return;
    }
    if (parsedUser.type !== 'DUEÑO') {
      navigate('/profile');
      return;
    }
    setUser(parsedUser);
  }, []);

  if (!user) return null;

  const handleCreate = async (form: typeof formInitialState) => {
  setError(null);
  setIsSubmitting(true);

  // TODO: latitude/longitude van a venir del mapa, no de un input de texto.
  const payload: CreateParkingInput = {
    ownerId: user.id,
    name: form.name,
    locality: form.locality,
    postalCode: form.postalCode,
    address: form.address,
    carCapacity: Number(form.carCapacity),
    motorcycleCapacity: Number(form.motorcycleCapacity),
    truckCapacity: form.truckCapacity ? Number(form.truckCapacity) : undefined,
    openingTime: form.openingTime,
    closingTime: form.closingTime,
    minReservationHours: Number(form.minReservationHours),
    maxReservationHours: Number(form.maxReservationHours),
    reservationMargin: Number(form.reservationMargin),
    latitude: Number(form.latitude),
    longitude: Number(form.longitude),
    imageUrl: '',
  };

  try {
    await createParking(payload);
    navigate('/my-parkings');
  } catch (err: any) {
    const validationErrors = err.response?.data?.errors;
    if (validationErrors) {
      setError(validationErrors.map((e: any) => e.mensaje).join(' | '));
    } else {
      setError(err.response?.data?.error || err.response?.data?.message || 'Error al crear el estacionamiento');
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
            <h1 className="text-white">Nuevo Estacionamiento</h1>
            <p className="text-zinc-400">Completá los datos para registrar tu estacionamiento</p>
          </div>
        </header>

        {error && (
          <div className="state-container">
            <p className="text-destructive">{error}</p>
          </div>
        )}

        {isSubmitting && (
          <div className="state-container">
            <p className="text-zinc-400">Creando estacionamiento...</p>
          </div>
        )}

        <ParkingForm onSubmit={handleCreate} />

        <button type="button" onClick={() => navigate('/my-parkings')} className="btn-ghost">
          ← Volver al listado
        </button>
      </div>
    </div>
  );
}
