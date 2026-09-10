import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CalendarClock, LogIn, LogOut, Search, QrCode } from 'lucide-react';
import Button from '../../components/shared/Button/Button';
import { checkInReservation, checkOutReservation } from '../../services/Reservation';
import { ShineBorder } from '../../components/ui/shine-border';

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
      
      if (currentUser?.type !== 'EMPLEADO') {
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
      .then(res => setShifts(res.data.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [user]);

  const handleCheckIn = async () => {
    if (!reservationId) return;
    try {
      await checkInReservation(reservationId, user.id);
      alert('Check-in exitoso');
      setReservationId('');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al hacer check-in');
    }
  };

  const handleCheckOut = async () => {
    if (!reservationId) return;
    try {
      const res = await checkOutReservation(reservationId, user.id);
      alert(`Check-out exitoso. Total a pagar: $${res.data?.totalAmount || 0}`);
      setReservationId('');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al hacer check-out');
    }
  };

  if (loading) return <div className="p-8 text-center">Cargando...</div>;

  return (
    <div className="min-h-screen bg-[#faf9f5] text-slate-900 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">Hola, {user.name}</h1>
          <p className="text-sm text-slate-600 mt-1">
            Bienvenido al panel de empleado
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <ShineBorder
            className="w-full bg-white border border-slate-200 p-6 shadow-sm rounded-2xl"
            color={['#2563EB', '#38BDF8']}
            borderRadius={16}
            borderWidth={1.5}
            duration={10}
          >
            <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
              <QrCode className="text-blue-500" />
              Gestión de Vehículos
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID de Reserva</label>
                <input 
                  type="text" 
                  value={reservationId}
                  onChange={(e) => setReservationId(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Ingrese el ID de reserva..."
                />
              </div>
              <div className="flex gap-4">
                <Button onClick={handleCheckIn} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">
                  <LogIn className="w-4 h-4 mr-2" /> Check-in
                </Button>
                <Button onClick={handleCheckOut} className="flex-1 bg-amber-600 hover:bg-amber-700 text-white">
                  <LogOut className="w-4 h-4 mr-2" /> Check-out
                </Button>
              </div>
            </div>
          </ShineBorder>

          <ShineBorder
            className="w-full bg-white border border-slate-200 p-6 shadow-sm rounded-2xl flex flex-col h-full"
            color={['#10B981', '#34D399']}
            borderRadius={16}
            borderWidth={1.5}
            duration={12}
          >
            <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
              <CalendarClock className="text-emerald-500" />
              Mis Próximos Turnos
            </h2>
            <div className="space-y-3 flex-1 overflow-y-auto">
              {shifts.length === 0 ? (
                <p className="text-gray-500">No tienes turnos asignados actualmente.</p>
              ) : (
                shifts.map(shift => (
                  <div key={shift.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100 flex justify-between items-center">
                    <div>
                      <div className="font-semibold">{shift.dayOfWeek}</div>
                      <div className="text-sm text-gray-500">{shift.startTime} - {shift.endTime}</div>
                    </div>
                    <div className="text-right text-sm font-medium text-emerald-600">
                      {shift.parking?.name || 'Sucursal'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ShineBorder>

        </div>
        
        <div className="pt-8 border-t border-slate-200 flex justify-between">
           <button onClick={() => navigate('/profile')} className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">
             ← Ir a mi Perfil Personal
           </button>
           <button 
             onClick={() => {
               localStorage.removeItem('user');
               localStorage.removeItem('parkflow_user_id');
               navigate('/login');
             }} 
             className="text-sm font-medium text-red-500 hover:text-red-800 transition-colors"
           >
             Cerrar Sesión
           </button>
        </div>
      </div>
    </div>
  );
}
