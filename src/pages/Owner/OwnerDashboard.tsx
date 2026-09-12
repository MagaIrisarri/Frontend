import React from 'react';
import { Building2 } from 'lucide-react';
import { useOwnerDashboard } from '../../hooks/useOwnerDashboard';
import { OwnerHeader } from '../../components/Owner/OwnerHeader';
import { OwnerKpis } from '../../components/Owner/OwnerKpis';
import { OwnerDemandCurve } from '../../components/Owner/OwnerDemandCurve';
import { OwnerBranchToolbar } from '../../components/Owner/OwnerBranchToolbar';
import { OwnerBranchGrid } from '../../components/Owner/OwnerBranchGrid';
import { OwnerBranchTable } from '../../components/Owner/OwnerBranchTable';
import { ParkingTariffModal } from '../../components/Parking/ParkingTariffModal';

export const OwnerDashboard: React.FC = () => {
  const dashboardProps = useOwnerDashboard();
  const {
    loading,
    parkings,
    viewMode,
    navigate,
    selectedParkingForTariff,
    isTariffModalOpen,
    setIsTariffModalOpen,
    setSelectedParkingForTariff,
    fetchData,
  } = dashboardProps;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 transition-colors duration-200">
      {/* 1. HEADER B2B & TOP NAVIGATION */}
      <OwnerHeader {...dashboardProps} />

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8 space-y-8">
        {/* 2. KPIS OPERATIVOS EN TIEMPO REAL */}
        <OwnerKpis {...dashboardProps} />

        {/* 3. TIMELINE / GRÁFICA OPERATIVA DE DEMANDA */}
        <OwnerDemandCurve {...dashboardProps} />

        {/* 4. MONITOREO Y GESTIÓN DE SUCURSALES */}
        <section className="space-y-4">
          <OwnerBranchToolbar {...dashboardProps} />

          {loading ? (
            <div className="p-12 text-center text-slate-400">Cargando sucursales...</div>
          ) : parkings.length === 0 ? (
            <div className="p-12 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-center space-y-4">
              <Building2 className="h-12 w-12 text-slate-400 mx-auto" />
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Todavía no tenés sucursales registradas
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                  Registrá tu primer estacionamiento para comenzar a recibir reservas y generar ingresos.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/my-parkings/create')}
                className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 transition-colors cursor-pointer"
              >
                Crear mi primera sucursal
              </button>
            </div>
          ) : viewMode === 'table' ? (
            <OwnerBranchTable {...dashboardProps} />
          ) : (
            <OwnerBranchGrid {...dashboardProps} />
          )}
        </section>
      </main>

      {/* MODAL DE TARIFAS Y SERVICIOS */}
      {selectedParkingForTariff && (
        <ParkingTariffModal
          isOpen={isTariffModalOpen}
          onClose={() => {
            setIsTariffModalOpen(false);
            setSelectedParkingForTariff(null);
          }}
          parking={selectedParkingForTariff}
          onUpdated={fetchData}
        />
      )}
    </div>
  );
};

export default OwnerDashboard;
