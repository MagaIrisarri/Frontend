import React from 'react';
import { MapView } from '../../components/Parking/MapView';
import { Sidebar } from '../../components/Home/Sidebar';
import { ListDrawer } from '../../components/Home/ListDrawer';
import { TopBar } from '../../components/Home/TopBar';
import { HomeModalManager } from '../../components/Home/HomeModalManager';
import { useHomePage } from '../../hooks/useHomePage';

export default function HomePage() {
  const homeProps = useHomePage();
  const { filteredParkings, selectedParkingId, handleSelectSpot, filters } = homeProps;

  return (
    <div className="relative w-full h-screen overflow-hidden bg-zinc-100 dark:bg-zinc-950 font-sans transition-colors">
      {/* 1. MAPA EN PANTALLA COMPLETA */}
      <div className="absolute inset-0 z-0">
        <MapView
          spots={filteredParkings}
          selectedId={selectedParkingId}
          onSelect={handleSelectSpot}
          selectedVehicleType={filters.vehicleType}
        />
      </div>

      {/* 2. BARRA DE CONTROL SUPERIOR */}
      <TopBar {...homeProps} />

      {/* 3. MENÚ LATERAL IZQUIERDO */}
      <Sidebar {...homeProps} />

      {/* 4. PANEL LATERAL UNIFICADO DE COCHERAS (LISTADO / DETALLE) */}
      <ListDrawer {...homeProps} />

      {/* 5. MANEJADOR UNIFICADO DE MODALES */}
      <HomeModalManager {...homeProps} />
    </div>
  );
}
