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

        {/* Layout de 2 Columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* =========================================================
              COLUMNA 1 (Izquierda): Datos Personales 
             ========================================================= */}
          <div className="lg:col-span-6 space-y-6">
            <PersonalDataCard {...profileProps} />

            {isOwner && <FiscalDataCard {...profileProps} />}

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