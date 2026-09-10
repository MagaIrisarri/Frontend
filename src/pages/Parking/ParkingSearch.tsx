import { useEffect, useState } from 'react';
import { ParkingList } from '../../components/Parking/ParkingList.js';
import { MapView } from '../../components/Parking/MapView.js';
import { getParking, getPriceParking } from '../../services/Parking.js';
import type { Parking } from '../../types/Parking.js';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Building2 } from 'lucide-react';

interface ParkingSearchState {
  vehicleId: string;
  vehicleType: string;
}

export default function ParkingSearchPage() {
  const [spots, setSpots] = useState<Parking[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { state } = useLocation() as { state: ParkingSearchState | null };
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const vehicleId = state?.vehicleId;
  const vehicleType = state?.vehicleType;
  const navigate = useNavigate();

  useEffect(() => {
    if (!state?.vehicleType) {
      navigate('/select-vehicle');
      return;
    }

    setLoading(true);
    getParking()
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.data || [];
        setSpots(list);
      })
      .catch((err) => console.error('Error al obtener cocheras:', err))
      .finally(() => setLoading(false));
  }, [state, navigate]);

  useEffect(() => {
    if (!state?.vehicleType || spots.length === 0) return;

    Promise.all(
      spots.map((spot) =>
        getPriceParking(spot.id, state.vehicleType)
          .then((res) => [spot.id, res.data?.price ?? res.price] as const)
          .catch(() => [spot.id, null] as const)
      )
    ).then((entries) => {
      const validEntries = entries.filter(
        (entry): entry is readonly [string, number] =>
          entry[1] !== null && entry[1] !== undefined
      );
      setPrices(Object.fromEntries(validEntries));
    });
  }, [spots, state]);

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full max-w-[1600px] mx-auto bg-zinc-950 overflow-hidden">
      {/* Barra lateral de cocheras */}
      <aside className="w-[420px] bg-zinc-900 flex flex-col border-r border-zinc-800 shrink-0">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/90 backdrop-blur-md">
          <div>
            <h2 className="text-base font-bold text-white">Cocheras Disponibles</h2>
            <p className="text-xs text-zinc-400">
              Para vehículo tipo <span className="text-blue-400 font-semibold">{vehicleType}</span>
            </p>
          </div>
          <Link
            to="/select-vehicle"
            className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Cambiar vehículo
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2 text-zinc-400">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
              <p className="text-xs">Buscando estacionamientos...</p>
            </div>
          ) : spots.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center p-4">
              <Building2 className="h-8 w-8 text-zinc-600 mb-2" />
              <p className="text-sm font-semibold text-zinc-300">No hay cocheras activas</p>
              <p className="text-xs text-zinc-500 mt-1">
                No encontramos estacionamientos registrados en este momento.
              </p>
            </div>
          ) : (
            <ParkingList
              spots={spots}
              prices={prices}
              selectedId={selectedId}
              onSelect={setSelectedId}
              vehicleId={vehicleId}
              vehicleType={vehicleType}
            />
          )}
        </div>
      </aside>

      {/* Mapa interactivo MapLibre */}
      <section className="flex-1 relative bg-zinc-950 overflow-hidden">
        <MapView
          spots={spots}
          prices={prices}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      </section>
    </div>
  );
}