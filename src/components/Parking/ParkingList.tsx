import { ParkingCard } from './ParkingCard.js';
import type { Parking } from '../../types/Parking.js';

interface ParkingList {
  spots: Parking[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  prices: Record<string, number>;
}

export function ParkingList({ spots, selectedId, onSelect, prices }: ParkingList) {
  return (
    <div className="flex-1 overflow-y-auto p-gutter space-y-4">
      {spots.map((spot) => (
        <ParkingCard
          key={spot.id}
          spot={spot}
          selected={spot.id === selectedId}
          onSelect={onSelect}
          price={prices[spot.id]}
        />
      ))}
    </div>
  );
}