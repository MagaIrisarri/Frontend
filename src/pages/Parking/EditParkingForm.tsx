import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ParkingForm from '../../components/Parking/ParkingForm.js';
import { getOneParking, putParking } from '../../services/Parking.js';
import type { UpdateParkingInput } from '../../types/Parking.js';
import '../Vehicle/Vehicle.scss';
import { formInitialState } from "../../components/Parking/ParkingForm.data.js";
import { useParams } from 'react-router-dom';


export default function ParkingEdit() {
  const {id} = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
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
  imageUrl: string;
    }>();
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
      

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

    useEffect(() => {
      if (!id) {
        setErrorMsg('No se encontró la sesión del usuario.');
        setLoading(false);
        return;
      }

      
  
  const fetchUser = async () => {
      try {
       const res = await getOneParking(id);
        const parkingData = res.data;

        setInitialData
        ({
          name: parkingData.name || '',
          locality: parkingData.locality || '',
          postalCode: parkingData.postalCode || '',
          address: parkingData.address || '',
          carCapacity: String(parkingData.carCapacity) || '',
          motorcycleCapacity: String(parkingData.motorcycleCapacity) || '',
          truckCapacity: String(parkingData.truckCapacity ?? ''),
          openingTime: String(parkingData.openingTime) || '',
          closingTime: String(parkingData.closingTime) || '',
          minReservationHours: String(parkingData.minReservationHours) || '',
          maxReservationHours: String(parkingData.maxReservationHours) || '',
          reservationMargin: String(parkingData.reservationMargin) || '',
          latitude: String(parkingData.latitude) || '',
          longitude: String(parkingData.longitude) || '',
          imageUrl: parkingData.imageUrl || '',
        });
      } catch (err: any) {
        setErrorMsg(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id]);


  if (!user) return null;

 const handleUpdate = async (form: typeof formInitialState) => {
   setError(null);
   setIsSubmitting(true);
 
   // TODO: latitude/longitude van a venir del mapa, no de un input de texto.
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
     imageUrl: '',
   };
 
   try {
     await putParking(payload, id as string);
     navigate('/my-parkings');
   } catch (err: any) {
     const validationErrors = err.response?.data?.errors;
     if (validationErrors) {
       setError(validationErrors.map((e: any) => e.mensaje).join(' | '));
     } else {
       setError(err.response?.data?.error || err.response?.data?.message || 'Error al modificar los datos del estacionamiento');
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
            <h1 className="text-white">Estacionamiento</h1>
            <p className="text-zinc-400">Completá los datos que deseas camniar de tu estacionamiento</p>
          </div>
        </header>

        {error && (
          <div className="state-container">
            <p className="text-destructive">{error}</p>
          </div>
        )}

        {isSubmitting && (
          <div className="state-container">
            <p className="text-zinc-400">Actualizando estacionamiento...</p>
          </div>
        )}

        {initialData ? (
          <ParkingForm initialData={initialData} onSubmit={handleUpdate} submitLabel="Actualizar estacionamiento" />
        ) : (
          <p>Cargando...</p>
        )}

        <button type="button" onClick={() => navigate('/my-parkings')} className="btn-ghost">
          ← Volver al listado
        </button>
      </div>
    </div>
  );
}