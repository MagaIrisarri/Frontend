import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CalendarClock, LogIn, LogOut, QrCode } from 'lucide-react';
import { checkInReservation, checkOutReservation } from '../../services/reservation.service';

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reservationId, setReservationId] = useState('');
  
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

  const handleCheckIn = async () => {
    if (!reservationId.trim()) return;
    try {
      await checkInReservation(reservationId.trim(), user.id);
      alert('Check-in exitoso');
      setReservationId('');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al hacer check-in');
    }
  };

  const handleCheckOut = async () => {
    if (!reservationId.trim()) return;
    try {
      const res = await checkOutReservation(reservationId.trim(), user.id);
      alert(`Check-out exitoso. Total a pagar: $${res.data?.totalAmount ?? res?.totalAmount ?? 0}`);
      setReservationId('');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al hacer check-out');
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-600 dark:text-zinc-400">
        Cargando panel de empleado...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9f5] dark:bg-[#0B0F17] text-slate-900 dark:text-white p-6 md:p-10 transition-colors">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Hola, {user?.name}
          </h1>
          <p className="text-sm text-slate-600 dark:text-zinc-400 mt-1">
            Bienvenido al panel de empleado
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Card Gestión de Vehículos */}
          <div className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 shadow-sm rounded-2xl transition-colors">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-slate-900 dark:text-white">
              <QrCode className="text-blue-500 h-6 w-6" />
              Gestión de Vehículos
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-zinc-400 mb-1.5">
                  ID de Reserva
                </label>
                <input 
                  type="text" 
                  value={reservationId}
                  onChange={(e) => setReservationId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono uppercase"
                  placeholder="Ingrese el ID de reserva..."
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={handleCheckIn}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Check-in</span>
                </button>
                <button
                  type="button"
                  onClick={handleCheckOut}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-sm shadow-md shadow-amber-600/20 transition-all cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Check-out</span>
                </button>
              </div>
            </div>
          </div>

          {/* Card Mis Próximos Turnos */}
          <div className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 shadow-sm rounded-2xl flex flex-col h-full transition-colors">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-slate-900 dark:text-white">
              <CalendarClock className="text-emerald-500 h-6 w-6" />
              Mis Próximos Turnos
            </h2>
            <div className="space-y-3 flex-1 overflow-y-auto">
              {shifts.length === 0 ? (
                <p className="text-slate-500 dark:text-zinc-400 text-sm">
                  No tienes turnos asignados actualmente.
                </p>
              ) : (
                shifts.map((shift) => (
                  <div 
                    key={shift.id} 
                    className="p-3.5 bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-100 dark:border-zinc-800 flex justify-between items-center transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white text-sm">
                        {shift.dayOfWeek}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-zinc-400">
                        {shift.startTime} - {shift.endTime}
                      </div>
                    </div>
                    <div className="text-right text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      {shift.parking?.name || 'Sucursal'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        
        <div className="pt-8 border-t border-slate-200 dark:border-zinc-800 flex justify-between">
          <button 
            type="button"
            onClick={() => navigate('/profile')} 
            className="text-sm font-medium text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
          >
            ← Ir a mi Perfil Personal
          </button>
          <button 
            type="button"
            onClick={() => {
              localStorage.removeItem('user');
              localStorage.removeItem('parkflow_user_id');
              navigate('/login');
            }} 
            className="text-sm font-medium text-red-500 hover:text-red-600 transition-colors cursor-pointer"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  );
}
