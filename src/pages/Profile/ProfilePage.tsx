import React from 'react';
import { Loader2, AlertCircle, CheckCircle2, Car, Calendar, FileText, ArrowRight } from 'lucide-react';
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

        {/* Accesos Rápidos: Reservas, Facturas y Vehículos */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            type="button"
            onClick={() => navigate('/reservations')}
            className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm hover:border-blue-500/50 hover:shadow-md transition-all text-left cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Mis Reservas</h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">Ver reservas activas y pasadas</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 group-hover:text-blue-500 transition-all" />
          </button>

          <button
            type="button"
            onClick={() => navigate('/invoices')}
            className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm hover:border-emerald-500/50 hover:shadow-md transition-all text-left cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Facturación y Pagos</h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">Mis facturas y comprobantes</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 group-hover:text-emerald-500 transition-all" />
          </button>

          <button
            type="button"
            onClick={() => navigate('/vehicles')}
            className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm hover:border-purple-500/50 hover:shadow-md transition-all text-left cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:scale-105 transition-transform">
                <Car className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Mis Vehículos</h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">Administrar flota registrada</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 group-hover:text-purple-500 transition-all" />
          </button>
        </div>

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