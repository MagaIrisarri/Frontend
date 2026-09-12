import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, TrendingUp, Users, CheckCircle, Clock } from 'lucide-react';

export default function MetricsView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

  useEffect(() => {
    if (!id) return;
    fetchMetrics();
  }, [id]);

  const fetchMetrics = async () => {
    try {
      const res = await api.get(`/api/parkings/${id}/metrics`);
      setMetrics(res.data?.data || res.data);
    } catch (error) {
      console.error('Error fetching metrics', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-600 dark:text-zinc-400">
        Cargando métricas...
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="min-h-screen bg-[#faf9f5] dark:bg-[#0B0F17] text-slate-900 dark:text-white p-6 md:p-10 transition-colors">
        <div className="max-w-4xl mx-auto space-y-6">
          <button
            type="button"
            onClick={() => navigate('/my-parkings')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-700 text-sm font-semibold transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a Mis Sucursales</span>
          </button>
          <div className="text-center py-12 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm">
            <p className="text-slate-500 dark:text-zinc-400">No se encontraron métricas para este estacionamiento.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9f5] dark:bg-[#0B0F17] text-slate-900 dark:text-white p-6 md:p-10 transition-colors">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/my-parkings')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-700 text-sm font-semibold transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a Mis Sucursales</span>
          </button>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Métricas de Sucursal
          </h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card Recaudación */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-zinc-800 flex flex-col gap-2 transition-colors">
            <div className="text-slate-500 dark:text-zinc-400 text-xs uppercase tracking-wider font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              Recaudación
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white">
              ${Number(metrics.totalRevenue || 0).toFixed(2)}
            </div>
            <div className="text-xs text-slate-400 dark:text-zinc-500">Monto total pagado</div>
          </div>
          
          {/* Card Reservas Activas */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-zinc-800 flex flex-col gap-2 transition-colors">
            <div className="text-slate-500 dark:text-zinc-400 text-xs uppercase tracking-wider font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-500" />
              Reservas Activas
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white">
              {metrics.activeReservations || 0}
            </div>
            <div className="text-xs text-slate-400 dark:text-zinc-500">En curso actualmente</div>
          </div>

          {/* Card Ocupación Actual */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-zinc-800 flex flex-col gap-2 transition-colors">
            <div className="text-slate-500 dark:text-zinc-400 text-xs uppercase tracking-wider font-semibold flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-500" />
              Ocupación Actual
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white">
              {metrics.occupancyRate ?? 0}%
            </div>
            <div className="text-xs text-slate-400 dark:text-zinc-500">
              Plazas totales: {metrics.totalCapacity || 0}
            </div>
          </div>

          {/* Card Finalizadas */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-zinc-800 flex flex-col gap-2 transition-colors">
            <div className="text-slate-500 dark:text-zinc-400 text-xs uppercase tracking-wider font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Finalizadas
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white">
              {metrics.reservations?.['FINALIZADA'] || 0}
            </div>
            <div className="text-xs text-slate-400 dark:text-zinc-500">Reservas completadas</div>
          </div>
        </div>
      </div>
    </div>
  );
}
