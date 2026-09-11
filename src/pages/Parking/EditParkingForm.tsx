import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Building2, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { ShineBorder } from '@/components/ui/shine-border';
import ParkingForm from '../../components/Parking/ParkingForm';
import { getOneParking, putParking } from '../../services/Parking.js';
import type { UpdateParkingInput } from '../../types/Parking.js';
import { formInitialState } from '../../components/Parking/ParkingForm.data.js';

export default function ParkingEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialData, setInitialData] = useState<{
    locality: string;
    postalCode: string;
    address: string;
    carCapacity: string;
    motorcycleCapacity: string;
    truckCapacity: string;
    openingTime: string;
    closingTime: string;
    minReservationHours: string;
    maxReservationHours: string;
    reservationMargin: string;
    name: string;
    latitude: string;
    longitude: string;
    image: string;
  }>();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setErrorMsg('No se encontró el estacionamiento a editar.');
      setLoading(false);
      return;
    }

    const fetchParking = async () => {
      try {
        const res = await getOneParking(id);
        const parkingData = res.data;

        setInitialData({
          name: parkingData.name || '',
          locality: parkingData.locality || '',
          postalCode: String(parkingData.postalCode || ''),
          address: parkingData.address || '',
          carCapacity: String(parkingData.carCapacity || '0'),
          motorcycleCapacity: String(parkingData.motorcycleCapacity || '0'),
          truckCapacity: String(parkingData.truckCapacity ?? ''),
          openingTime: String(parkingData.openingTime || '08:00'),
          closingTime: String(parkingData.closingTime || '22:00'),
          minReservationHours: String(parkingData.minReservationHours || '1'),
          maxReservationHours: String(parkingData.maxReservationHours || '24'),
          reservationMargin: String(parkingData.reservationMargin || '1'),
          latitude: String(parkingData.latitude || ''),
          longitude: String(parkingData.longitude || ''),
          image: parkingData.image || '',
        });
      } catch (err: any) {
        setErrorMsg(err.message || 'Error al cargar los datos del estacionamiento');
      } finally {
        setLoading(false);
      }
    };

    fetchParking();
  }, [id]);

  const handleUpdate = async (form: typeof formInitialState) => {
    setError(null);
    setIsSubmitting(true);

    const payload: UpdateParkingInput = {
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
      await putParking(payload, id as string);
      navigate('/my-parkings');
    } catch (err: any) {
      const validationErrors = err.response?.data?.errors;
      if (validationErrors) {
        setError(validationErrors.map((e: any) => e.mensaje).join(' | '));
      } else {
        setError(
          err.response?.data?.error ||
            err.response?.data?.message ||
            'Error al modificar los datos del estacionamiento'
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
              Editar Estacionamiento
            </h2>
            <p className="text-sm text-zinc-400 mt-1">
              Modificá los datos, horarios y ubicación de tu cochera
            </p>
          </div>

          {error && (
            <div className="mb-6 flex items-center gap-2.5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {errorMsg ? (
            <div className="mb-6 flex items-center gap-2.5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <p className="text-sm text-zinc-400">Cargando datos del estacionamiento...</p>
            </div>
          ) : initialData ? (
            <>
              {isSubmitting && (
                <div className="mb-6 flex items-center justify-center gap-2 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Actualizando estacionamiento...</span>
                </div>
              )}

              <ParkingForm
                initialData={initialData}
                onSubmit={handleUpdate}
                submitLabel="Actualizar Estacionamiento"
                isSubmitting={isSubmitting}
              />
            </>
          ) : (
            <p className="text-center text-zinc-400 py-8">
              No se encontraron datos del estacionamiento.
            </p>
          )}
        </ShineBorder>
      </div>
    </div>
  );
}