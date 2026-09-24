import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Plus, Clock, MapPin, User, ChevronLeft } from 'lucide-react';
import { getEmployeesByOwner } from '../../services/employee.service';
import { createShift } from '../../services/shift.service';
import axios from 'axios';

export default function OwnerShifts() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<any[]>([]);
  const [parkings, setParkings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [ownerId, setOwnerId] = useState('');

  // Form
  const [formData, setFormData] = useState({ employeeId: '', parkingId: '', dayOfWeek: 'LUNES', startTime: '08:00', endTime: '16:00' });
  const days = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'];

  const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

  useEffect(() => {
    const rawUser = localStorage.getItem('user');
    if (!rawUser) { navigate('/login'); return; }
    try {
      const parsed = JSON.parse(rawUser);
      const user = parsed?.data ?? parsed?.user ?? parsed;
      setOwnerId(user.id);
      fetchData(user.id);
    } catch {
      navigate('/login');
    }
  }, [navigate]);

  const fetchData = async (id: string) => {
    setLoading(true);
    try {
      const emps = await getEmployeesByOwner(id);
      setEmployees(emps);
      
      const pkgs = await api.get('/api/parkings/owner/' + id).then(r => r.data.data);
      setParkings(pkgs);
      
      if (emps.length > 0) setFormData(prev => ({ ...prev, employeeId: emps[0].id }));
      if (pkgs.length > 0) setFormData(prev => ({ ...prev, parkingId: pkgs[0].id }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createShift(formData);
      alert('Turno creado exitosamente');
      setShowForm(false);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al crear turno');
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f5] dark:bg-[#0B0F17] p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate('/owner')} className="p-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl hover:bg-slate-50 transition-colors">
            <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-zinc-400" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
              <Calendar className="w-8 h-8 text-blue-600" /> Asignación de Turnos
            </h1>
            <p className="text-slate-500 dark:text-zinc-400 font-medium">Programa el horario de tus empleados</p>
          </div>
        </div>

        {showForm ? (
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-sm">
            <h2 className="text-xl font-bold mb-6 text-slate-900 dark:text-white">Nuevo Turno</h2>
            <form onSubmit={handleCreate} className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-zinc-300 mb-1 flex items-center gap-2"><User className="w-4 h-4"/> Empleado</label>
                <select value={formData.employeeId} onChange={e => setFormData({...formData, employeeId: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500">
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-zinc-300 mb-1 flex items-center gap-2"><MapPin className="w-4 h-4"/> Sucursal</label>
                <select value={formData.parkingId} onChange={e => setFormData({...formData, parkingId: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500">
                  {parkings.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-zinc-300 mb-1">Día de la semana</label>
                <select value={formData.dayOfWeek} onChange={e => setFormData({...formData, dayOfWeek: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500">
                  {days.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-zinc-300 mb-1 flex items-center gap-2"><Clock className="w-4 h-4"/> Inicio</label>
                  <input type="time" required value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-zinc-300 mb-1">Fin</label>
                  <input type="time" required value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="submit" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors">Guardar Turno</button>
                <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-white font-bold rounded-xl transition-colors">Cancelar</button>
              </div>
            </form>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Planificación Rápida</h2>
              <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl hover:opacity-90 transition-opacity">
                <Plus className="w-5 h-5" /> Agregar Turno
              </button>
            </div>
            
            <div className="bg-white dark:bg-zinc-900 p-12 text-center rounded-3xl border border-dashed border-slate-300 dark:border-zinc-700">
              <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Módulo en construcción</h3>
              <p className="text-slate-500 mb-6">Puedes crear turnos desde aquí, la visualización en calendario llegará en la próxima actualización.</p>
              <button onClick={() => setShowForm(true)} className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl">Crear un Turno</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

