import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShineBorder } from '../../components/ui/shine-border';
import { ArrowRight } from 'lucide-react';

export default function AdminPanel() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const raw = localStorage.getItem('user');
    const parsedUser = raw ? JSON.parse(raw) : null;

    if (!parsedUser) {
      navigate('/login');
      return;
    }
    if (parsedUser.type !== 'ADMINISTRADOR') {
      navigate('/profile');
      return;
    }
    setUser(parsedUser);
  }, []);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#faf9f5] text-white p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">Panel de Administrador</h1>
          <p className="text-sm text-slate-600 mt-1">
            Gestioná los catálogos y la configuración general de ParkFlow
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ShineBorder
            className="w-full bg-zinc-900/90 border border-zinc-800 p-6 shadow-xl backdrop-blur-md rounded-2xl flex flex-col justify-between"
            color={['#2563EB', '#38BDF8', '#818CF8']}
            borderRadius={16}
            borderWidth={1.5}
            duration={10}
          >
            <div>
              <h2 className="text-lg font-bold text-white">Gestión de Vehículos</h2>
              <p className="text-sm text-zinc-400 mt-2">
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

          </ShineBorder>

          <ShineBorder
            className="w-full bg-zinc-900/90 border border-zinc-800 p-6 shadow-xl backdrop-blur-md rounded-2xl flex flex-col justify-between"
            color={['#2563EB', '#38BDF8', '#818CF8']}
            borderRadius={16}
            borderWidth={1.5}
            duration={10}
          >
            <div>
              <h2 className="text-lg font-bold text-white">Gestión de Servicios</h2>
              <p className="text-sm text-zinc-400 mt-2">
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
            
          </ShineBorder>
        </div>
      </div>
    </div>
  );
}
