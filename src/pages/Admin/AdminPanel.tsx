import { useNavigate } from 'react-router-dom';
import { ArrowRight, Car, Sparkles } from 'lucide-react';

export default function AdminPanel() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#faf9f5] dark:bg-[#0B0F17] text-slate-900 dark:text-white p-6 md:p-10 transition-colors">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white">Panel de Administrador</h1>
          <p className="text-sm text-slate-600 dark:text-zinc-400 mt-1">
            Gestioná los catálogos y la configuración general de ParkFlow
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 shadow-sm rounded-2xl flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Car className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Gestión de Vehículos</h2>
              <p className="text-sm text-slate-600 dark:text-zinc-400">
                Administrá los tipos de vehículo del sistema.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/admin/vehicles')}
              className="w-full mt-6 flex items-center justify-between py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
            >
              <span>Administrar</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-6 shadow-sm rounded-2xl flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Sparkles className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Gestión de Servicios</h2>
              <p className="text-sm text-slate-600 dark:text-zinc-400">
                Administrá los servicios del sistema.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/admin/services')}
              className="w-full mt-6 flex items-center justify-between py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
            >
              <span>Administrar</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
