import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EditPerfilForm from '../../components/EditPerfilForm/EditPerfilForm';
import ChangePasswordForm from '../../components/ChangePasswordForm/ChangePasswordForm';
import { Loader2, AlertCircle, CheckCircle, Plus, Shield, ArrowRight, LogOut } from 'lucide-react';
import { ShineBorder } from '../../components/ui/shine-border';
import { Lottie } from 'lottie-react';
import carAnimation from '../../assets/carAnimation.json';
import { getUserId, updateUser, changePassword, removeUser } from '@/services/User.js';
import ConfirmDialog from '@/components/shared/ConfirmDialog/ConfirmDialog.js';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const userId = localStorage.getItem('parkflow_user_id') || JSON.parse(localStorage.getItem('user') || '{}')?.id;

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
        const data = await getUserId(userId);
        const userData = data.data || data;
        setInitialData({
          name: userData.name || '',
          last_name: userData.last_name || '',
          email: userData.email || '',
          phone: userData.phone || '',
        });
      } catch (err: any) {
        setErrorMsg(err.response?.data?.message || 'Error al cargar perfil');
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
      await updateUser(userId, formData);

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
      setErrorMsg(err.response?.data?.message || 'Error al actualizar');
    }
  };

  const handlePasswordSubmit = async (passwordData: { currentPassword: string; newPassword: string }) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await changePassword(userId, passwordData.currentPassword, passwordData.newPassword);
      setSuccessMsg('Contraseña actualizada correctamente.');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Error al cambiar contraseña');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('parkflow_user_id');
    navigate('/login');
  };

  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const confirmDelete = async () => {
    if (!userId) return;

    try {
      await removeUser(userId);
      localStorage.removeItem('user');
      localStorage.removeItem('parkflow_user_id');
      navigate('/login');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al eliminar la cuenta');
      setConfirmingDelete(false);
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
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">Panel de Usuario</h1>
            <p className="text-sm text-slate-600 mt-1">
              Gestioná tu información personal y los vehículos asociados a tu cuenta
            </p>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 text-red-600 hover:bg-red-500/20 font-semibold text-sm transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Cerrar Sesión</span>
          </button>
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

            <ShineBorder
              className="w-full bg-zinc-900/90 border border-red-900/50 p-6 shadow-xl backdrop-blur-md rounded-2xl"
              color={['#ef4444', '#f87171', '#ef4444']}
              borderRadius={16}
              borderWidth={1.5}
              duration={10}
            >
              <h2 className="text-lg font-bold text-red-400">ELIMINAR CUENTA</h2>
              <p className="text-sm text-zinc-400 mt-2">
                Eliminar tu cuenta es una acción permanente: vas a perder el acceso y no vas a poder volver a iniciar sesión.
              </p>
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="w-full mt-4 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold shadow-lg shadow-red-600/20 transition-all cursor-pointer"
              >
                Eliminar cuenta
              </button>
            </ShineBorder>
          </div>
        </div>

        <ConfirmDialog
          open={confirmingDelete}
          title="Eliminar cuenta"
          message={`¿Confirmás que querés eliminar tu cuenta${initialData?.name ? `, ${initialData.name}` : ''}? Esta acción no se puede deshacer y vas a cerrar sesión.`}
          confirmLabel="Sí, eliminar mi cuenta"
          cancelLabel="Cancelar"
          onConfirm={confirmDelete}
          onCancel={() => setConfirmingDelete(false)}
        />

      </div>
    </div>
  );
};

export default ProfilePage;