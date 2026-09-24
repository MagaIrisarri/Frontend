import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, UserCircle, Briefcase, ChevronLeft } from 'lucide-react';
import { getEmployeesByOwner, createEmployee } from '../../services/employee.service';

export default function OwnerEmployees() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [ownerId, setOwnerId] = useState('');

  // Form State
  const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '' });

  useEffect(() => {
    const rawUser = localStorage.getItem('user');
    if (!rawUser) { navigate('/login'); return; }
    try {
      const parsed = JSON.parse(rawUser);
      const user = parsed?.data ?? parsed?.user ?? parsed;
      setOwnerId(user.id);
      fetchEmployees(user.id);
    } catch {
      navigate('/login');
    }
  }, [navigate]);

  const fetchEmployees = async (id: string) => {
    setLoading(true);
    try {
      const data = await getEmployeesByOwner(id);
      setEmployees(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createEmployee(ownerId, formData);
      setShowForm(false);
      setFormData({ name: '', email: '', password: '', phone: '' });
      fetchEmployees(ownerId);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al crear empleado');
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
              <Briefcase className="w-8 h-8 text-blue-600" /> Mi Personal
            </h1>
            <p className="text-slate-500 dark:text-zinc-400 font-medium">Gestión de empleados operativos</p>
          </div>
        </div>

        {showForm ? (
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-sm">
            <h2 className="text-xl font-bold mb-6 text-slate-900 dark:text-white">Alta de Nuevo Empleado</h2>
            <form onSubmit={handleCreate} className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-zinc-300 mb-1">Nombre Completo</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-zinc-300 mb-1">Email</label>
                <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-zinc-300 mb-1">Teléfono</label>
                <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-zinc-300 mb-1">Contraseña Temporal</label>
                <input required type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="submit" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors">Crear Empleado</button>
                <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-white font-bold rounded-xl transition-colors">Cancelar</button>
              </div>
            </form>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Empleados Registrados ({employees.length})</h2>
              <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl hover:opacity-90 transition-opacity">
                <Plus className="w-5 h-5" /> Agregar Empleado
              </button>
            </div>

            {loading ? (
              <div className="text-center p-12 text-slate-500">Cargando personal...</div>
            ) : employees.length === 0 ? (
              <div className="bg-white dark:bg-zinc-900 p-12 text-center rounded-3xl border border-dashed border-slate-300 dark:border-zinc-700">
                <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No tienes empleados</h3>
                <p className="text-slate-500 mb-6">Registra a tu personal para que puedan operar las sucursales.</p>
                <button onClick={() => setShowForm(true)} className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl">Crear Primer Empleado</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {employees.map(emp => (
                  <div key={emp.id} className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-slate-200 dark:border-zinc-800 flex items-center gap-4">
                    <UserCircle className="w-12 h-12 text-blue-500" />
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">{emp.name}</h3>
                      <p className="text-xs text-slate-500 dark:text-zinc-400">{emp.email}</p>
                      <span className="inline-block mt-2 px-2 py-1 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 text-xs font-bold rounded-md">
                        ACTIVO
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

