import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Car, Sparkles, Activity, ShieldAlert, Database, LogOut } from 'lucide-react';

export default function AdminPanel() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('parkflow_user_id');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#faf9f5] dark:bg-[#0B0F17] text-slate-900 dark:text-white transition-colors selection:bg-blue-500/30">
      
      {/* Top Navbar */}
      <nav className="sticky top-0 z-30 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-slate-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-red-600/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white leading-none">ParkFlow Admin</h1>
              <span className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-widest">Nivel de Acceso: GOD_MODE</span>
            </div>
          </div>
          <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-12">
        
        {/* Global Metrics Summary */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <Activity className="w-5 h-5 text-emerald-500" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Estado Global del Sistema</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Usuarios Activos', value: '12,403', trend: '+14%', color: 'text-blue-500' },
              { label: 'Reservas Hoy', value: '4,102', trend: '+5%', color: 'text-emerald-500' },
              { label: 'Sucursales', value: '84', trend: '+2', color: 'text-amber-500' },
              { label: 'Facturación USD', value: '$84.2K', trend: '+21%', color: 'text-purple-500' },
            ].map((stat, i) => (
              <div key={i} className="p-6 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl hover:border-slate-300 dark:hover:border-zinc-700 transition-colors">
                <p className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-widest mb-2">{stat.label}</p>
                <div className="flex items-end gap-2">
                  <span className={`text-3xl font-black ${stat.color}`}>{stat.value}</span>
                  <span className="text-sm font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-md mb-1">{stat.trend}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Configurations */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <Database className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Catálogos y Configuración</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            <button
              onClick={() => navigate('/admin/vehicles')}
              className="text-left group bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-8 rounded-3xl hover:border-blue-500 transition-all hover:shadow-xl hover:shadow-blue-500/10"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Car className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Tipos de Vehículo</h3>
              <p className="text-sm text-slate-500 dark:text-zinc-400 mb-6">
                Gestiona los tamaños, categorías y multiplicadores de precio base según el vehículo.
              </p>
              <div className="flex items-center text-blue-600 dark:text-blue-400 font-bold text-sm">
                Administrar <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            <button
              onClick={() => navigate('/admin/services')}
              className="text-left group bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-8 rounded-3xl hover:border-purple-500 transition-all hover:shadow-xl hover:shadow-purple-500/10"
            >
              <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Servicios Adicionales</h3>
              <p className="text-sm text-slate-500 dark:text-zinc-400 mb-6">
                Configura servicios extras como Lavado, Carga EV, o Valet Parking para todas las sucursales.
              </p>
              <div className="flex items-center text-purple-600 dark:text-purple-400 font-bold text-sm">
                Administrar <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* MOCK: System health */}
            <div className="bg-slate-900 dark:bg-zinc-950 border border-slate-800 dark:border-zinc-800 p-8 rounded-3xl text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <ShieldAlert className="w-32 h-32" />
              </div>
              <h3 className="text-xl font-bold mb-2">Salud del Sistema</h3>
              <p className="text-sm text-slate-400 mb-6">Los servicios se encuentran operando con normalidad.</p>
              <ul className="space-y-3">
                <li className="flex justify-between text-sm">
                  <span className="text-slate-400">API Backend</span>
                  <span className="text-emerald-400 font-bold">100% Uptime</span>
                </li>
                <li className="flex justify-between text-sm">
                  <span className="text-slate-400">Base de Datos</span>
                  <span className="text-emerald-400 font-bold">12ms Latency</span>
                </li>
                <li className="flex justify-between text-sm">
                  <span className="text-slate-400">Pasarela de Pagos</span>
                  <span className="text-emerald-400 font-bold">Operativa</span>
                </li>
              </ul>
            </div>

          </div>
        </section>

      </div>
    </div>
  );
}

