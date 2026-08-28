import { cn } from '@/lib/utils';
import type { Parking } from '../../types/Parking.js';



interface ParkingSpotCardProps {
  spot: Parking;
  selected: boolean;
  onSelect: (id: string) => void;
  price: number;
}

export function ParkingCard({ spot, selected, onSelect, price }: ParkingSpotCardProps) {
    return (
    <div
      onClick={() => onSelect(spot.id)}
    
    >
      {selected && <div className="absolute top-0 left-0 w-1 h-full bg-secondary" />}
      <div className="flex gap-4">
        <div className="w-24 h-24 rounded-lg overflow-hidden shrink-0 bg-surface-variant">
          <img src={spot.imageUrl} alt={spot.name} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-1">
              <h3 className="font-headline-md text-body-lg font-semibold text-on-surface leading-tight">
                {spot.name}
              </h3>
        </div>
          <div className="flex justify-between items-end mt-2">
            <div className="flex flex-col">
              <span className="text-body-sm text-on-surface-variant">Precio</span>
                ${price}/h
                <span className="text-body-sm font-normal text-on-surface-variant"></span>
              </div>
            </div>  
          </div>
        </div>
      </div>
    </div>
  );
}