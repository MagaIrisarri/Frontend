import { MapView } from '../../components/Parking/MapView';
import { Sidebar } from '../../components/Home/Sidebar';
import { ListDrawer } from '../../components/Home/ListDrawer';
import { TopBar } from '../../components/Home/TopBar';
import { HomeModalManager } from '../../components/Home/HomeModalManager';
import OwnerShell from '../../components/Owner/ui/OwnerShell';
import { useHomePage } from '../../hooks/useHomePage';
import '../../styles/home.scss';

export default function HomePage() {
  const homeProps = useHomePage();
  const { filteredParkings, selectedParkingId, handleSelectSpot, filters, mapArea, setMapArea } = homeProps;

  return (
    <>
      {/* Mapa + barra + paneles con el formato del rol dueño; los modales pesados quedan fuera del scope .owner. */}
      <OwnerShell bare>
        <div className="home relative w-full h-screen overflow-hidden">
          {/* 1. MAPA EN PANTALLA COMPLETA */}
          <div className="absolute inset-0 z-0">
            <MapView
              spots={filteredParkings}
              selectedId={selectedParkingId}
              onSelect={handleSelectSpot}
              selectedVehicleType={filters.vehicleType}
              fit={!mapArea}
              onSearchArea={setMapArea}
            />
          </div>

          {/* 2. BARRA DE CONTROL SUPERIOR */}
          <TopBar {...homeProps} />

          {/* 3. MENÚ LATERAL IZQUIERDO */}
          <Sidebar {...homeProps} />

          {/* 4. PANEL LATERAL UNIFICADO DE COCHERAS (LISTADO / DETALLE) */}
          <ListDrawer {...homeProps} />
        </div>
      </OwnerShell>

      {/* 5. MANEJADOR UNIFICADO DE MODALES */}
      <HomeModalManager {...homeProps} />
    </>
  );
}
