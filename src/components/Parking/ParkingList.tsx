import { ParkingCard } from './ParkingCard.js';
import type { Parking } from '../../types/Parking.js';

interface ParkingListProps {
  spots: Parking[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  prices: Record<string, number>;
  vehicleId?: string;
  vehicleType?: string
}

export function ParkingList({ spots, selectedId, onSelect, prices,vehicleId, vehicleType }: ParkingListProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {spots.map((spot) => (
        <ParkingCard
          key={spot.id}
          spot={spot}
          selected={spot.id === selectedId}
          onSelect={onSelect}
          price={prices[spot.id]}
          vehicleId={vehicleId}
          vehicleType={vehicleType}
        />
      ))}
    </div>
  );
}