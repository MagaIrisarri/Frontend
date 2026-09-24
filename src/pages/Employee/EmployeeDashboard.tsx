import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CalendarClock, LogIn, LogOut, Search, ShieldCheck, Car } from 'lucide-react';
import { checkInReservation, checkOutReservation, confirmReservation } from '../../services/reservation.service';
import CheckoutModal from '../../components/Checkout/CheckoutModal';

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [activeReservation, setActiveReservation] = useState<any>(null);
  const [searchError, setSearchError] = useState('');

  // Checkout Modal State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutData, setCheckoutData] = useState({ invoiceId: '', totalAmount: 0 });

  const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

  useEffect(() => {
    const rawUser = localStorage.getItem('user');
    if (!rawUser) {
      navigate('/login');
      return;
    }
    try {
      const parsed = JSON.parse(rawUser);
      const currentUser = parsed?.data ?? parsed?.user ?? parsed;
      const userType = (currentUser?.type || currentUser?.role || '').toUpperCase();
      if (!userType.includes('EMP')) {
        navigate('/profile');
        return;
      }
      setUser(currentUser);
    } catch (err) {
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    if (!user) return;
    api.get(`/api/employee-shifts/employee/${user.id}`)
      .then(res => setShifts(res.data?.data || res.data || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [user]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearchLoading(true);
    setSearchError('');
    setActiveReservation(null);

    try {
      const res = await api.get(`/api/reservations/${searchQuery.trim()}`);
      setActiveReservation(res.data.data || res.data);
    } catch (err: any) {
      setSearchError('No se encontró la reserva. Verifica el ID.');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAction = async (action: 'CONFIRM' | 'CHECKIN' | 'CHECKOUT') => {
    if (!activeReservation) return;
    try {
      if (action === 'CONFIRM') {
        const res = await confirmReservation(activeReservation.id);
        setActiveReservation(res.data || res);
      } else if (action === 'CHECKIN') {
        const res = await checkInReservation(activeReservation.id, user.id);
        setActiveReservation(res.data || res);
      } else if (action === 'CHECKOUT') {
        const res = await checkOutReservation(activeReservation.id, user.id);
        const data = res.data || res;
        // Open modal instead of alert
        setCheckoutData({
          invoiceId: data.invoice.id,
          totalAmount: data.invoice.totalAmount
        });
        setIsCheckoutOpen(true);
      }
    } catch (err: any) {
      setSearchError(err.response?.data?.message || `Error al ejecutar la acción`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf9f5] dark:bg-[#0B0F17]">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
          <p className="text-slate-500 dark:text-zinc-400 font-medium tracking-wide">Iniciando terminal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9f5] dark:bg-[#0B0F17] text-slate-900 dark:text-white p-4 md:p-8 transition-colors">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-blue-600" />
              Terminal Operativa
            </h1>
            <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 mt-1">
              Operador activo: <span className="text-slate-800 dark:text-zinc-200">{user?.name}</span>
            </p>
          </div>
          <button 
            onClick={() => {
              localStorage.removeItem('user');
              localStorage.removeItem('parkflow_user_id');
              navigate('/login');
            }} 
            className="px-4 py-2 rounded-full bg-slate-200/50 dark:bg-zinc-800/50 text-slate-600 dark:text-zinc-300 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors text-sm font-bold"
          >
            Cerrar Sesión
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Action Area */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="relative group">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <Search className="h-6 w-6 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                placeholder="Ingresar ID de Reserva..."
                className="block w-full pl-14 pr-6 py-5 bg-white dark:bg-zinc-900 border-2 border-slate-200 dark:border-zinc-800 rounded-3xl text-lg font-mono placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
              />
              <button
                type="submit"
                disabled={searchLoading || !searchQuery.trim()}
                className="absolute right-3 top-3 bottom-3 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-bold rounded-2xl transition-colors"
              >
                {searchLoading ? 'Buscando...' : 'Buscar'}
              </button>
            </form>

            {searchError && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-400 rounded-r-xl font-medium">
                {searchError}
              </div>
            )}

            {/* Active Reservation Card */}
            {activeReservation && (
              <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 p-6 md:p-8 shadow-xl animate-in slide-in-from-bottom-4 duration-300">
                <div className="flex justify-between items-start mb-8 border-b border-slate-100 dark:border-zinc-800 pb-6">
                  <div>
                    <span className="px-3 py-1 text-xs font-black uppercase tracking-widest bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 rounded-full mb-3 inline-block">
                      {activeReservation.status}
                    </span>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-1">
                      {activeReservation.vehicle?.licensePlate || 'Sin Patente'}
                    </h2>
                    <p className="text-slate-500 dark:text-zinc-400 font-medium">
                      {activeReservation.vehicle?.brand} {activeReservation.vehicle?.model}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-500 dark:text-zinc-400">Espacio</p>
                    <p className="text-3xl font-black text-blue-600 dark:text-blue-500">
                      {activeReservation.parkingSpace?.spaceCode || '--'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="p-4 bg-slate-50 dark:bg-zinc-950 rounded-2xl">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Hora Estimada</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                      {new Date(activeReservation.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-zinc-950 rounded-2xl">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Cliente</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white truncate">
                      {activeReservation.client?.name || 'Invitado'}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  {activeReservation.status === 'PENDIENTE' && (
                    <button
                      onClick={() => handleAction('CONFIRM')}
                      className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-lg rounded-2xl hover:opacity-90 transition-opacity"
                    >
                      Confirmar Reserva
                    </button>
                  )}
                  {activeReservation.status === 'CONFIRMADA' && (
                    <button
                      onClick={() => handleAction('CHECKIN')}
                      className="w-full flex items-center justify-center gap-3 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-lg rounded-2xl transition-colors shadow-lg shadow-emerald-600/20"
                    >
                      <LogIn className="w-6 h-6" /> Registrar Entrada
                    </button>
                  )}
                  {activeReservation.status === 'EN_CURSO' && (
                    <button
                      onClick={() => handleAction('CHECKOUT')}
                      className="w-full flex items-center justify-center gap-3 py-4 bg-amber-500 hover:bg-amber-400 text-white font-black text-lg rounded-2xl transition-colors shadow-lg shadow-amber-500/20"
                    >
                      <LogOut className="w-6 h-6" /> Finalizar y Cobrar
                    </button>
                  )}
                  {(activeReservation.status === 'FINALIZADA' || activeReservation.status === 'CANCELADA') && (
                    <div className="w-full py-4 text-center text-slate-500 dark:text-zinc-500 font-bold bg-slate-100 dark:bg-zinc-900 rounded-2xl border border-dashed border-slate-300 dark:border-zinc-700">
                      Esta reserva ya no permite acciones operativas.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
              <h3 className="text-lg font-bold flex items-center gap-2 mb-6 text-slate-900 dark:text-white">
                <CalendarClock className="text-emerald-500 h-5 w-5" />
                Mis Turnos de Hoy
              </h3>
              <div className="space-y-3">
                {shifts.length === 0 ? (
                  <div className="text-center p-6 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800">
                    <p className="text-slate-500 dark:text-zinc-400 text-sm font-medium">No hay turnos registrados.</p>
                  </div>
                ) : (
                  shifts.map((shift) => (
                    <div key={shift.id} className="p-4 bg-slate-50 dark:bg-zinc-950 rounded-2xl border border-slate-100 dark:border-zinc-800 transition-colors">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-slate-900 dark:text-white">{shift.dayOfWeek}</span>
                        <span className="text-xs font-black text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-1 rounded-md">
                          ACTIVO
                        </span>
                      </div>
                      <div className="text-sm font-medium text-slate-500 dark:text-zinc-400 mb-2">
                        {shift.startTime} - {shift.endTime}
                      </div>
                      <div className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                        <Car className="w-3.5 h-3.5" />
                        {shift.parking?.name || 'Sucursal'}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>
      </div>

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        reservationId={activeReservation?.id}
        invoiceId={checkoutData.invoiceId}
        totalAmount={checkoutData.totalAmount}
        onSuccess={() => {
          // Actualizar el estado local para mostrar como FINALIZADA
          setActiveReservation((prev: any) => ({ ...prev, status: 'FINALIZADA' }));
        }}
      />
    </div>
  );
}

