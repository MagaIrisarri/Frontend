import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getInvoicesByClientId } from '../../services/Invoice';
import { ArrowLeft, FileText, CheckCircle, Clock } from 'lucide-react';
import Button from '../../components/shared/Button/Button';

export default function MyInvoices() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchInvoices();
  }, [user, navigate]);

  const fetchInvoices = async () => {
    try {
      const data = await getInvoicesByClientId(user.id);
      setInvoices(data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Cargando facturas...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/profile')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Mis Facturas y Pagos</h1>
        </div>

        {invoices.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <p className="text-gray-500">No tienes facturas registradas.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {invoices.map(inv => (
              <div key={inv.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <span className="font-semibold text-gray-900">Factura #{inv.id.slice(0, 8)}</span>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${inv.status === 'PAGADA' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {inv.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    Reserva: {new Date(inv.reservation?.startTime).toLocaleDateString()} en {inv.reservation?.parkingSpace?.parking?.name}
                  </div>
                  <div className="text-sm text-gray-500 flex items-center gap-1">
                    <Clock className="w-4 h-4" /> 
                    {inv.paymentDate ? `Pagado el ${new Date(inv.paymentDate).toLocaleString()}` : 'Pendiente de pago'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">${Number(inv.totalAmount).toFixed(2)}</div>
                  <div className="text-sm text-gray-500">{inv.paymentMethod}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
