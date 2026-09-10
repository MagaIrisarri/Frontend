import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Users, Receipt, CalendarClock, ArrowRight } from 'lucide-react';
import { ShineBorder } from '../../components/ui/shine-border';
import { useCurrentUser } from '../../hooks/useCurrentUser.js';

export const OwnerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = useCurrentUser();
  const userName = currentUser?.name || 'Dueño';

  return (
    <div className="min-h-screen bg-[#faf9f5] text-slate-900 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Cabecera */}
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">Hola, {userName}</h1>
          <p className="text-sm text-slate-600 mt-1">
            Bienvenido al panel de administración de tus sucursales y empleados
          </p>
        </div>

        {/* Grilla de Opciones */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Card: Sucursales (Parkings) */}
          <ShineBorder
            className="w-full bg-white border border-slate-200 p-6 shadow-sm rounded-2xl flex flex-col justify-between h-full"
            color={['#2563EB', '#38BDF8']}
            borderRadius={16}
            borderWidth={1.5}
            duration={10}
          >
            <div className="space-y-4">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                <Building2 className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-bold">Mis Sucursales</h2>
              <p className="text-sm text-slate-500">
                Administrá tus estacionamientos, capacidad de plazas y tarifas por hora.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/my-parkings')}
              className="mt-6 flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-sm transition-colors cursor-pointer"
            >
              <span>Gestionar Estacionamientos</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </ShineBorder>

          {/* Card: Empleados */}
          <ShineBorder
            className="w-full bg-white border border-slate-200 p-6 shadow-sm rounded-2xl flex flex-col justify-between h-full"
            color={['#10B981', '#34D399']}
            borderRadius={16}
            borderWidth={1.5}
            duration={12}
          >
            <div className="space-y-4">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
                <Users className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-bold">Personal</h2>
              <p className="text-sm text-slate-500">
                Da de alta a tus empleados y asignalos a tus diferentes sucursales.
              </p>
            </div>
            <button className="mt-6 flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-semibold text-sm transition-colors cursor-pointer">
              <span>Gestionar Empleados</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </ShineBorder>

          {/* Card: Turnos */}
          <ShineBorder
            className="w-full bg-white border border-slate-200 p-6 shadow-sm rounded-2xl flex flex-col justify-between h-full"
            color={['#F59E0B', '#FBBF24']}
            borderRadius={16}
            borderWidth={1.5}
            duration={14}
          >
            <div className="space-y-4">
              <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center mb-4">
                <CalendarClock className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-bold">Turnos y Cobertura</h2>
              <p className="text-sm text-slate-500">
                Planificá los horarios de tus empleados y revisá brechas de cobertura.
              </p>
            </div>
            <button className="mt-6 flex items-center gap-2 text-amber-600 hover:text-amber-700 font-semibold text-sm transition-colors cursor-pointer">
              <span>Organizar Grilla</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </ShineBorder>

          {/* Card: Servicios Extra */}
          <ShineBorder
            className="w-full bg-white border border-slate-200 p-6 shadow-sm rounded-2xl flex flex-col justify-between h-full"
            color={['#8B5CF6', '#A78BFA']}
            borderRadius={16}
            borderWidth={1.5}
            duration={16}
          >
            <div className="space-y-4">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-4">
                <Receipt className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-bold">Servicios Extra</h2>
              <p className="text-sm text-slate-500">
                Seleccioná servicios del catálogo (ej: Lavado) y asignales tu propio precio.
              </p>
            </div>
            <button className="mt-6 flex items-center gap-2 text-purple-600 hover:text-purple-700 font-semibold text-sm transition-colors cursor-pointer">
              <span>Configurar Precios</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </ShineBorder>

        </div>
        
        <div className="pt-8 border-t border-slate-200">
           <button onClick={() => navigate('/profile')} className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">
             ← Ir a mi Perfil Personal
           </button>
        </div>

      </div>
    </div>
  );
};

export default OwnerDashboard;

