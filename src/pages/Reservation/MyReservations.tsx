import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getReservationsByClientId, cancelReservation } from '../../services/reservation.service';
import type { Reservation } from '../../types/reservation.types';
import { ArrowLeft, Clock, MapPin, XCircle } from 'lucide-react';

export default function MyReservations() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;
  const currentUserId = user?.id || user?._id || user?.data?.id;

  useEffect(() => {
    if (!currentUserId) {
      navigate('/login');
      return;
    }
    fetchReservations(currentUserId);
  }, [currentUserId, navigate]);

  const fetchReservations = async (id: string) => {
    try {
      const data = await getReservationsByClientId(id);
      setReservations(Array.isArray(data) ? data : data?.data || []);
    } catch (error) {
      console.error('Error fetching reservations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que deseas cancelar esta reserva?')) return;
    try {
      await cancelReservation(id, currentUserId);
      fetchReservations(currentUserId);
    } catch (error) {
      alert('Error al cancelar la reserva');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDIENTE':
        return 'text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/40';
      case 'CONFIRMADA':
        return 'text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/40';
      case 'EN CURSO':
        return 'text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/40';
      case 'FINALIZADA':
        return 'text-slate-700 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700';
      case 'CANCELADA':
        return 'text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-950/50 border border-red-200 dark:border-red-800/40';
      default:
        return 'text-slate-700 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700';
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-600 dark:text-zinc-400">
        Cargando reservas...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9f5] dark:bg-[#0B0F17] text-slate-900 dark:text-white p-6 md:p-10 transition-colors">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-700 text-sm font-semibold transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver</span>
          </button>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Mis Reservas
          </h1>
        </div>

        {reservations.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm">
            <p className="text-slate-500 dark:text-zinc-400">No tienes reservas realizadas.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reservations.map((res) => (
              <div 
                key={res.id} 
                className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-zinc-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(res.status || '')}`}>
                      {res.status}
                    </span>
                    <span className="text-sm text-slate-500 dark:text-zinc-400">
                      ID: {res.id?.slice(0, 8)}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                    <MapPin className="w-4 h-4 text-slate-400 dark:text-zinc-500 shrink-0" />
                    {res.parkingSpace?.parking?.name || 'Estacionamiento Desconocido'} - Plaza {res.parkingSpace?.spaceCode || 'N/A'}
                  </h3>
                  <div className="text-slate-600 dark:text-zinc-400 flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-slate-400 dark:text-zinc-500 shrink-0" />
                    {new Date(res.startTime).toLocaleString()} - {new Date(res.endTime).toLocaleString()}
                  </div>
                  <div className="text-sm text-slate-500 dark:text-zinc-400">
                    Vehículo: <strong className="text-slate-700 dark:text-zinc-300 font-semibold">{res.vehicle?.plate || 'Sin patente'}</strong>
                  </div>
                </div>

                {(res.status === 'PENDIENTE' || res.status === 'CONFIRMADA') && new Date(res.startTime) > new Date() && (
                  <button
                    type="button"
                    onClick={() => handleCancel(res.id)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 border border-red-500/20 text-sm font-semibold transition-colors cursor-pointer shrink-0"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Cancelar</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
