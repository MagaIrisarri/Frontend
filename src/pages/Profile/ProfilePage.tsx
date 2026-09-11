import React from 'react';
import { Loader2, AlertCircle, CheckCircle2, Car, Plus, ArrowRight } from 'lucide-react';
import { useProfile } from '../../hooks/useProfile';
import { ProfileHeader } from '../../components/Profile/ProfileHeader';
import { ProfileIdentityCard } from '../../components/Profile/ProfileIdentityCard';
import { PersonalDataCard } from '../../components/Profile/PersonalDataCard';
import { FiscalDataCard } from '../../components/Profile/FiscalDataCard';
import { SecurityDataCard } from '../../components/Profile/SecurityDataCard';
import { PreferencesCard } from '../../components/Profile/PreferencesCard';
import { DangerZoneCard } from '../../components/Profile/DangerZoneCard';

export const ProfilePage: React.FC = () => {
  const profileProps = useProfile();
  const {
    loading,
    errorMsg,
    successMsg,
    isOwner,
    isAdmin,
    navigate,
  } = profileProps;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex items-center justify-center text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 p-4 sm:p-6 md:p-8 transition-colors duration-200">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Barra superior de navegación y acciones */}
        <ProfileHeader {...profileProps} />

        {/* Tarjeta de Identidad Superior */}
        <ProfileIdentityCard {...profileProps} />

        {/* Notificaciones globales de feedback */}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs sm:text-sm flex items-center gap-2">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Layout de 2 Columnas Balanceadas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* =========================================================
              COLUMNA 1 (Izquierda): Datos Personales y Fiscales
             ========================================================= */}
          <div className="lg:col-span-6 space-y-6">
            <PersonalDataCard {...profileProps} />

            {isOwner && <FiscalDataCard {...profileProps} />}

            {/* Accesos a flota para cliente */}
            {!isOwner && !isAdmin && (
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-3 border-b border-slate-100 dark:border-zinc-800/80 pb-3.5">
                  <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                    <Car className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">Mis Vehículos</h2>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Administrá tus patentes registradas</p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <button
                    type="button"
                    onClick={() => navigate('/vehicles/new')}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition-all cursor-pointer"
                  >
                    <Plus className="h-4 w-4 stroke-[2.5]" />
                    <span>Registrar Nuevo Vehículo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/vehicles')}
                    className="w-full flex items-center justify-between py-2 px-4 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 text-sm font-medium transition-colors cursor-pointer"
                  >
                    <span>Ver Mis Vehículos</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* =========================================================
              COLUMNA 2 (Derecha): Seguridad y Preferencias
             ========================================================= */}
          <div className="lg:col-span-6 space-y-6">
            <SecurityDataCard {...profileProps} />

            {isOwner && <PreferencesCard {...profileProps} />}
          </div>

        </div>

        {/* ZONA DE PELIGRO */}
        <DangerZoneCard {...profileProps} />

      </div>
    </div>
  );
};

export default ProfilePage;