import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getReservationsByClientId, cancelReservation } from '../../services/Reservation';
import type { Reservation } from '../../types/Reservation';
import { ArrowLeft, Clock, MapPin, XCircle } from 'lucide-react';
import Button from '../../components/shared/Button/Button';

export default function MyReservations() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchReservations();
  }, [user, navigate]);

  const fetchReservations = async () => {
    try {
      const data = await getReservationsByClientId(user.id);
      setReservations(data);
    } catch (error) {
      console.error('Error fetching reservations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que deseas cancelar esta reserva?')) return;
    try {
      await cancelReservation(id, user.id);
      fetchReservations();
    } catch (error) {
      alert('Error al cancelar la reserva');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDIENTE': return 'text-yellow-600 bg-yellow-100';
      case 'CONFIRMADA': return 'text-blue-600 bg-blue-100';
      case 'EN CURSO': return 'text-green-600 bg-green-100';
      case 'FINALIZADA': return 'text-gray-600 bg-gray-100';
      case 'CANCELADA': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) return <div className="p-8 text-center">Cargando reservas...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/profile')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Mis Reservas</h1>
        </div>

        {reservations.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <p className="text-gray-500">No tienes reservas realizadas.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reservations.map(res => (
              <div key={res.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(res.status || '')}`}>
                      {res.status}
                    </span>
                    <span className="text-sm text-gray-500">ID: {res.id.slice(0, 8)}</span>
                  </div>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    {res.parkingSpace?.parking?.name || 'Estacionamiento Desconocido'} - Plaza {res.parkingSpace?.spaceCode}
                  </h3>
                  <div className="text-gray-600 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    {new Date(res.startTime).toLocaleString()} - {new Date(res.endTime).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">
                    Vehículo: {res.vehicle?.plate}
                  </div>
                </div>

                {(res.status === 'PENDIENTE' || res.status === 'CONFIRMADA') && new Date(res.startTime) > new Date() && (
                  <Button variant="danger" onClick={() => handleCancel(res.id)}>
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
