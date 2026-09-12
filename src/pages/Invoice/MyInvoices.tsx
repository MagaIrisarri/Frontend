import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getInvoicesByClientId } from '../../services/invoice.service';
import { ArrowLeft, FileText, Clock } from 'lucide-react';

export default function MyInvoices() {
  const [invoices, setInvoices] = useState<any[]>([]);
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
    fetchInvoices(currentUserId);
  }, [currentUserId, navigate]);

  const fetchInvoices = async (id: string) => {
    try {
      const data = await getInvoicesByClientId(id);
      setInvoices(Array.isArray(data) ? data : data?.data || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-600 dark:text-zinc-400">
        Cargando facturas...
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
            Mis Facturas y Pagos
          </h1>
        </div>

        {invoices.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm">
            <p className="text-slate-500 dark:text-zinc-400">No tienes facturas registradas.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {invoices.map((inv) => (
              <div 
                key={inv.id} 
                className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-sm transition-colors"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-slate-400 dark:text-zinc-500" />
                    <span className="font-semibold text-slate-900 dark:text-white">
                      Factura #{inv.id?.slice(0, 8)}
                    </span>
                    <span 
                      className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${
                        inv.status === 'PAGADA' 
                          ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40' 
                          : 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </div>
                  <div className="text-sm text-slate-500 dark:text-zinc-400">
                    Reserva: {inv.reservation?.startTime ? new Date(inv.reservation.startTime).toLocaleDateString() : 'N/A'} en {inv.reservation?.parkingSpace?.parking?.name || 'Estacionamiento'}
                  </div>
                  <div className="text-sm text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                    <Clock className="w-4 h-4" /> 
                    {inv.paymentDate ? `Pagado el ${new Date(inv.paymentDate).toLocaleString()}` : 'Pendiente de pago'}
                  </div>
                </div>
                <div className="sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 dark:border-zinc-800">
                  <div className="text-2xl font-black text-slate-900 dark:text-white">
                    ${Number(inv.totalAmount || 0).toFixed(2)}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-zinc-400 uppercase tracking-wider font-semibold">
                    {inv.paymentMethod || 'No especificado'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
