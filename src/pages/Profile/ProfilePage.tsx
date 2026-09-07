import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EditPerfilForm from '../../components/EditPerfilForm/EditPerfilForm';
import ChangePasswordForm from '../../components/ChangePasswordForm/ChangePasswordForm';
import { Loader2, AlertCircle, CheckCircle, Plus, Shield, ArrowRight } from 'lucide-react';
import { ShineBorder } from '../../components/ui/shine-border';
import { Lottie } from 'lottie-react';
import carAnimation from '../../assets/carAnimation.json';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const userId = localStorage.getItem('parkflow_user_id') || JSON.parse(localStorage.getItem('user') || '{}')?.id;
  const userType = JSON.parse(localStorage.getItem('user') || '{}')?.type;

  const [initialData, setInitialData] = useState<{
    name: string;
    last_name: string;
    email: string;
    phone: string;
  } | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setErrorMsg('No se encontró la sesión del usuario.');
      setLoading(false);
      return;
    }

    const fetchUser = async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/users/${userId}`);
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.message || 'Error al cargar perfil');

        const userData = data.data || data;
        setInitialData({
          name: userData.name || '',
          last_name: userData.last_name || '',
          email: userData.email || '',
          phone: userData.phone || '',
        });
      } catch (err: any) {
        setErrorMsg(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  const handleProfileSubmit = async (formData: { name: string; last_name: string; email: string; phone: string }) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`http://localhost:3000/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Error al actualizar');

      const rawUser = localStorage.getItem('user');
      if (rawUser) {
        const parsed = JSON.parse(rawUser);
        if (parsed.user) {
          parsed.user = { ...parsed.user, ...formData };
        } else if (parsed.data) {
          parsed.data = { ...parsed.data, ...formData };
        } else {
          const updated = { ...parsed, ...formData };
          localStorage.setItem('user', JSON.stringify(updated));
        }

        if (parsed.user || parsed.data) {
          localStorage.setItem('user', JSON.stringify(parsed));
        }
      }

      setSuccessMsg('Datos personales actualizados correctamente.');
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handlePasswordSubmit = async (passwordData: { currentPassword: string; newPassword: string }) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`http://localhost:3000/api/users/${userId}/password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passwordData),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Error al cambiar contraseña');

      setSuccessMsg('Contraseña actualizada correctamente.');
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf9f5] flex items-center justify-center text-zinc-500">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9f5] text-white p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Cabecera */}
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">Panel de Usuario</h1>
          <p className="text-sm text-slate-600 mt-1">
            Gestioná tu información personal y los vehículos asociados a tu cuenta
          </p>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
            <CheckCircle className="h-5 w-5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Layout de Dos Columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Columna Izquierda: Formularios con ShineBorder */}
          <div className="lg:col-span-7 space-y-6">
            <ShineBorder
              className="w-full bg-zinc-900/90 border border-zinc-800 p-6 shadow-xl backdrop-blur-md rounded-2xl"
              color={['#2563EB', '#38BDF8', '#818CF8']}
              borderRadius={16}
              borderWidth={1.5}
              duration={10}
            >
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-white">
                <Shield className="h-5 w-5 text-blue-500" />
                <span>Datos Personales</span>
              </h2>
              {initialData && (
                <EditPerfilForm
                  initialData={initialData as any}
                  onSubmit={handleProfileSubmit}
                />
              )}
            </ShineBorder>

            <ShineBorder
              className="w-full bg-zinc-900/90 border border-zinc-800 p-6 shadow-xl backdrop-blur-md rounded-2xl"
              color={['#2563EB', '#38BDF8', '#818CF8']}
              borderRadius={16}
              borderWidth={1.5}
              duration={10}
            >
              <ChangePasswordForm onSubmit={handlePasswordSubmit} />
            </ShineBorder>
          </div>

          {/* Columna Derecha: Tarjeta de Flota con Lottie animado y ShineBorder */}
          <div className="lg:col-span-5 space-y-6">
            <ShineBorder
              className="w-full bg-zinc-900/90 border border-zinc-800 p-6 shadow-xl backdrop-blur-md rounded-2xl flex flex-col justify-between h-full"
              color={['#2563EB', '#38BDF8', '#818CF8']}
              borderRadius={16}
              borderWidth={1.5}
              duration={10}
            >
              <div className="space-y-4 text-center">
                <div className="w-36 h-36 mx-auto">
                  <Lottie src={carAnimation} autoplay loop={true} />
                </div>
                <h2 className="text-xl font-bold text-white">Gestión de Flota</h2>
                <p className="text-sm text-zinc-400">
                  Administrá los vehículos registrados en tu cuenta para agilizar el ingreso a las sucursales y cocheras de ParkFlow.
                </p>
              </div>

              <div className="mt-8 space-y-3 pt-6 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => navigate('/vehicles/new')}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
                >
                  <Plus className="h-4 w-4 stroke-[3]" />
                  <span>Registrar Nuevo Vehículo</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/vehicles')}
                  className="w-full flex items-center justify-between py-3 px-4 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 text-zinc-300 hover:text-white text-sm font-medium transition-colors cursor-pointer"
                >
                  <span>Ver Mis Vehículos Registrados</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/select-vehicle')}
                  className="w-full flex items-center justify-between py-3 px-4 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 text-zinc-300 hover:text-white text-sm font-medium transition-colors cursor-pointer"
                >
                  <span>Elegir vehiculo para reserva</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </ShineBorder>

            {userType === 'DUEÑO' && (
              <ShineBorder
                className="w-full bg-zinc-900/90 border border-zinc-800 p-6 shadow-xl backdrop-blur-md rounded-2xl"
                color={['#2563EB', '#38BDF8', '#818CF8']}
                borderRadius={16}
                borderWidth={1.5}
                duration={10}
              >
                <h2 className="text-xl font-bold text-white text-center">Mis Estacionamientos</h2>
                <p className="text-sm text-zinc-400 text-center mt-2">
                  Administrá los estacionamientos que tenés registrados como dueño en ParkFlow.
                </p>

                <div className="mt-6 space-y-3 pt-6 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => navigate('/my-parkings/create')}
                    className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
                  >
                    <Plus className="h-4 w-4 stroke-[3]" />
                    <span>Registrar Nuevo Estacionamiento</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate('/my-parkings')}
                    className="w-full flex items-center justify-between py-3 px-4 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 text-zinc-300 hover:text-white text-sm font-medium transition-colors cursor-pointer"
                  >
                    <span>Ver Mis Estacionamientos</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </ShineBorder>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

export default ProfilePage;