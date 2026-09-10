import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, TrendingUp, Users, CheckCircle, Clock } from 'lucide-react';
import Button from '../../components/shared/Button/Button';

export default function MetricsView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

  useEffect(() => {
    fetchMetrics();
  }, [id]);

  const fetchMetrics = async () => {
    try {
      const res = await api.get(`/api/parkings/${id}/metrics`);
      setMetrics(res.data.data);
    } catch (error) {
      console.error('Error fetching metrics', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Cargando métricas...</div>;
  if (!metrics) return <div className="p-8 text-center">No se encontraron métricas</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/my-parkings')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Mis Sucursales
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Métricas de Sucursal</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-2">
            <div className="text-gray-500 text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              Recaudación (Pagada)
            </div>
            <div className="text-3xl font-bold text-gray-900">${metrics.totalRevenue.toFixed(2)}</div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-2">
            <div className="text-gray-500 text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-500" />
              Reservas Activas
            </div>
            <div className="text-3xl font-bold text-gray-900">{metrics.activeReservations}</div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-2">
            <div className="text-gray-500 text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-500" />
              Ocupación Actual
            </div>
            <div className="text-3xl font-bold text-gray-900">{metrics.occupancyRate}%</div>
            <div className="text-xs text-gray-400">Plazas totales: {metrics.totalCapacity}</div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-2">
            <div className="text-gray-500 text-sm font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Finalizadas
            </div>
            <div className="text-3xl font-bold text-gray-900">{metrics.reservations['FINALIZADA'] || 0}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
