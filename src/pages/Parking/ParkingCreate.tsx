import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import ParkingForm from '../../components/Parking/ParkingForm';
import { createParking } from '../../services/parking.service';
import type { CreateParkingInput } from '../../types/parking.types';
import { formInitialState } from '../../components/Parking/ParkingForm.data.js';
import { useAuthStore } from '../../stores/authStore.js';

export default function ParkingsCreate() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const userId = user?.id || user?._id;

  if (!userId) {
    navigate('/');
    return null;
  }

  const handleCreate = async (form: typeof formInitialState) => {
    setError(null);
    setIsSubmitting(true);

    const payload: CreateParkingInput = {
      ownerId: userId,
      name: form.name.trim(),
      locality: form.locality.trim(),
      postalCode: form.postalCode.trim(),
      address: form.address.trim(),
      carCapacity: Number(form.carCapacity),
      motorcycleCapacity: Number(form.motorcycleCapacity),
      truckCapacity: form.truckCapacity ? Number(form.truckCapacity) : undefined,
      openingTime: form.openingTime,
      closingTime: form.closingTime,
      minReservationHours: Number(form.minReservationHours || 1),
      maxReservationHours: Number(form.maxReservationHours || 24),
      reservationMargin: Number(form.reservationMargin || 1),
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      imageUrl: form.image,
    };

    try {
      await createParking(payload);
      navigate('/owner');
    } catch (err: any) {
      const validationErrors = err.response?.data?.errors;
      if (validationErrors && Array.isArray(validationErrors)) {
        setError(validationErrors.map((e: any) => e.mensaje || e.message).join(' • '));
      } else {
        setError(
          err.response?.data?.error ||
            err.response?.data?.message ||
            'Error al registrar el estacionamiento. Verificá los datos ingresados.'
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F17] text-slate-900 dark:text-white px-4 sm:px-6 lg:px-8 py-8 transition-colors">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Cabecera Superior */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <Link
              to="/owner"
              className="p-2.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 shadow-sm transition-all active:scale-95 cursor-pointer"
              title="Volver al Panel de Dueño"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                Registrar Nuevo Estacionamiento
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400">
                Completá los datos de tu sucursal y fijá la ubicación en el mapa
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/30">
              <Building2 className="h-5 w-5" />
            </div>
            <span className="text-base font-black tracking-tight text-slate-900 dark:text-white">
              Park<span className="text-blue-500">Flow</span>
            </span>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-red-500/10 border border-red-500/25 text-red-600 dark:text-red-400 text-xs sm:text-sm font-medium leading-relaxed">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">No se pudo guardar la sucursal</strong>
              <span>{error}</span>
            </div>
          </div>
        )}

        {isSubmitting && (
          <div className="flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs sm:text-sm font-medium">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Guardando datos y registrando sucursal...</span>
          </div>
        )}

        {/* Formulario Principal de Alta */}
        <ParkingForm
          onSubmit={handleCreate}
          submitLabel="Registrar Estacionamiento"
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
}
