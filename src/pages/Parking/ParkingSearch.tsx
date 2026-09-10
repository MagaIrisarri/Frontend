import { useEffect, useState } from 'react';
import { ParkingList } from '../../components/Parking/ParkingList.js';
import { ParkingCard } from '../../components/Parking/ParkingCard.js';
import { MapView } from '../../components/Parking/MapView.js';
import { getParking } from '../../services/Parking.js';
import type { Parking } from '../../types/Parking.js';
import { useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import {getPriceParking} from '../../services/Parking.js'

interface ParkingSearchState {
  vehicleId: string;
  vehicleType: string;
}

export default function ParkingSearchPage() {
  const [spots, setSpots] = useState<Parking[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { state } = useLocation() as { state: ParkingSearchState | null };
  const [prices, setPrices] = useState<Record<string, number>>({});
  const availableSpots = spots.filter((s) => prices[s.id] !== undefined);
  const vehicleId = state?.vehicleId;
  const vehicleType = state?.vehicleType;
  
const navigate = useNavigate();

useEffect(() => {
  if (!state?.vehicleType) {
    navigate('/select-vehicle');
    return;
  }
  getParking().then(setSpots);
}, [state])

useEffect(() => {
  if (!state?.vehicleType || spots.length === 0) return;

  Promise.all(
    spots.map((spot) =>
      getPriceParking(spot.id, state.vehicleType)
        .then((res) => [spot.id, res.data.price] as const)
        .catch(() => [spot.id, null] as const)
    )
  ).then((entries) => {
    const validEntries = entries.filter(
      (entry): entry is readonly [string, number] => entry[1] !== null
    );
    setPrices(Object.fromEntries(validEntries));
  });
}, [spots, state]);


  return (
    <div className="flex h-full w-full max-w-[1600px] mx-auto bg-surface-container-low">
      <aside className="w-[400px] bg-surface-container-lowest flex flex-col border-r border-outline-variant shrink-0">
        <ParkingList spots={availableSpots} prices={prices} selectedId={selectedId} onSelect={setSelectedId} vehicleId={vehicleId} vehicleType={vehicleType} /> 
      </aside>
      <section className="flex-1 relative bg-surface-variant overflow-hidden">
        <MapView spots={availableSpots} prices={prices} selectedId={selectedId} onSelect={setSelectedId}  />
      </section>
    </div>
    
  );
}