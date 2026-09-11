import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { ShineBorder } from '@/components/ui/shine-border';
import ParkingForm from '../../components/Parking/ParkingForm';
import { createParking } from '../../services/Parking.js';
import type { CreateParkingInput } from '../../types/Parking.js';
import { formInitialState } from '../../components/Parking/ParkingForm.data.js';
import { useCurrentUser } from '../../hooks/useCurrentUser.js';

export default function ParkingsCreate() {
  const navigate = useNavigate();
  const user = useCurrentUser();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user?.id) return null;

  const handleCreate = async (form: typeof formInitialState) => {
    setError(null);
    setIsSubmitting(true);

    const payload: CreateParkingInput = {
      ownerId: user.id!,
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
      image: form.image,
    };

    try {
      await createParking(payload);
      navigate('/my-parkings');
    } catch (err: any) {
      const validationErrors = err.response?.data?.errors;
      if (validationErrors) {
        setError(validationErrors.map((e: any) => e.mensaje).join(' | '));
      } else {
        setError(
          err.response?.data?.error ||
            err.response?.data?.message ||
            'Error al crear el estacionamiento'
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-3xl">
        {/* Logo / Header */}
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/my-parkings"
            className="inline-flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Mis Cocheras
          </Link>

          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/30">
              <Building2 className="h-5 w-5" />
            </div>
            <span className="text-xl font-black tracking-tight text-white">
              Servicio<span className="text-blue-500">Cocheras</span>
            </span>
          </div>
        </div>

        {/* Tarjeta principal con ShineBorder */}
        <ShineBorder
          className="w-full bg-zinc-900/90 border border-zinc-800 p-6 md:p-8 shadow-2xl "
          color={['#e3e0ec', '#8915a0', '#e3e0ec']}
          borderRadius={16}
          borderWidth={1.5}
          duration={35}
        >
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Registrar Nuevo Estacionamiento
            </h2>
            <p className="text-sm text-zinc-400 mt-1">
              Completá los datos y seleccioná la ubicación exacta en el mapa
            </p>
          </div>

          {error && (
            <div className="mb-6 flex items-center gap-2.5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isSubmitting && (
            <div className="mb-6 flex items-center justify-center gap-2 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Guardando estacionamiento...</span>
            </div>
          )}

          <ParkingForm
            onSubmit={handleCreate}
            submitLabel="Registrar Estacionamiento"
            isSubmitting={isSubmitting}
          />
        </ShineBorder>
      </div>
    </div>
  );
}
