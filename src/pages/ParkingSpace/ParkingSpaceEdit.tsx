import React from 'react';
import { Loader2 } from 'lucide-react';
import { useParkingSpaceEdit } from '../../hooks/useParkingSpaceEdit';
import { ParkingSpaceHeader } from '../../components/ParkingSpace/ParkingSpaceHeader';
import { ParkingSpaceToolbar } from '../../components/ParkingSpace/ParkingSpaceToolbar';
import { ParkingSpaceGrid } from '../../components/ParkingSpace/ParkingSpaceGrid';
import { ParkingSpaceDrawer } from '../../components/ParkingSpace/ParkingSpaceDrawer';
import { AddSpaceModal } from '../../components/ParkingSpace/AddSpaceModal';
import ConfirmDialog from '../../components/shared/ConfirmDialog/ConfirmDialog';

export function ParkingSpaceEdit() {
  const spaceProps = useParkingSpaceEdit();
  const {
    loading,
    errorMsg,
    selectedSpace,
    spaceToDelete,
    setSpaceToDelete,
    handleDeleteSpace,
  } = spaceProps;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex items-center justify-center text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 transition-colors duration-200">
      {/* 1. HEADER Y KPIs DE CAPACIDAD */}
      <ParkingSpaceHeader {...spaceProps} />

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8 space-y-6">
        {errorMsg && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs">
            {errorMsg}
          </div>
        )}

        {/* 2. BARRA DE FILTROS & LEYENDA */}
        <ParkingSpaceToolbar {...spaceProps} />

        {/* 3. GRILLA DE PLAZAS SECTORIZADA + DRAWER LATERAL */}
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <ParkingSpaceGrid {...spaceProps} />
          </div>

          {selectedSpace && <ParkingSpaceDrawer {...spaceProps} />}
        </div>
      </main>

      {/* MODAL PARA AGREGAR NUEVA PLAZA */}
      <AddSpaceModal {...spaceProps} />

      {/* CONFIRMACIÓN DE ELIMINACIÓN DE PLAZA */}
      <ConfirmDialog
        open={!!spaceToDelete}
        title="Eliminar Plaza"
        message={`¿Estás seguro de eliminar la plaza ${
          spaceToDelete?.spaceCode || (spaceToDelete as any)?.id_parking_space || ''
        }? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        onConfirm={handleDeleteSpace}
        onCancel={() => setSpaceToDelete(null)}
      />
    </div>
  );
}

export default ParkingSpaceEdit;
