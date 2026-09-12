import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getReservationsByClientId, cancelReservation } from '../../services/reservation.service';
import type { Reservation } from '../../types/reservation.types';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { ReservationCard } from '../../components/Reservation/ReservationCard';
import { CancelReservationDialog } from '../../components/Reservation/CancelReservationDialog';

export default function MyReservations() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmingReservation, setConfirmingReservation] = useState<Reservation | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelSuccess, setCancelSuccess] = useState<string | null>(null);
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

  const handleConfirmCancel = async () => {
    if (!confirmingReservation || !currentUserId) return;
    try {
      setCancelling(true);
      setCancelError(null);
      await cancelReservation(confirmingReservation.id, currentUserId);
      setCancelSuccess('La reserva fue dada de baja correctamente.');
      setConfirmingReservation(null);
      await fetchReservations(currentUserId);
      setTimeout(() => setCancelSuccess(null), 4000);
    } catch (err: any) {
      setCancelError(err.response?.data?.message || err.message || 'Error al dar de baja la reserva');
    } finally {
      setCancelling(false);
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

        {/* Mensaje de éxito tras cancelar */}
        {cancelSuccess && (
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span>{cancelSuccess}</span>
          </div>
        )}

        {reservations.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm">
            <p className="text-slate-500 dark:text-zinc-400">No tienes reservas realizadas.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reservations.map((res) => (
              <ReservationCard
                key={res.id}
                reservation={res}
                onCancel={(reservation) => {
                  setCancelError(null);
                  setConfirmingReservation(reservation);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal de confirmación de cancelación */}
      <CancelReservationDialog
        isOpen={!!confirmingReservation}
        reservation={confirmingReservation}
        onClose={() => {
          setConfirmingReservation(null);
          setCancelError(null);
        }}
        onConfirm={handleConfirmCancel}
        loading={cancelling}
        error={cancelError}
      />
    </div>
  );
}

