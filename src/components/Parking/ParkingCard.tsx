import { cn } from '@/lib/utils';
import type { Parking } from '../../types/Parking.js';
import {Link} from 'react-router-dom';



interface ParkingSpotCardProps {
  spot: Parking;
  selected: boolean;
  onSelect: (id: string) => void;
  price: number;
  vehicleId?: string;
  vehicleType?: string;
}

export function ParkingCard({ spot, selected, onSelect, price, vehicleId, vehicleType }: ParkingSpotCardProps) {
  return (
    <div
      onClick={() => onSelect(spot.id)}
      className={cn(
        'relative flex gap-4 p-3 rounded-xl border cursor-pointer transition-colors',
        selected ? 'border-primary bg-accent' : 'border-border hover:bg-accent/50'
      )}
    >
      {selected && <div className="absolute top-0 left-0 w-1 h-full bg-primary rounded-l-xl" />}
      <div className="w-24 h-24 rounded-lg overflow-hidden shrink-0 bg-muted">
        <img src={spot.imageUrl} alt={spot.name} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 flex flex-col justify-between">
        <h3 className="text-base font-semibold text-foreground leading-tight">
          {spot.name}
        </h3>
        <div className="flex justify-between items-end mt-2">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Precio</span>
            <span className="text-sm font-medium text-foreground">${price}/h</span>
          </div>
          <Link
            state={{ vehicleId, vehicleType }}
            to={`/parkings/${spot.id}/reservar`}
            onClick={(e) => e.stopPropagation()}
            className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium px-3 py-1.5 rounded-full transition-colors"
          >
            Ver disponibilidad
          </Link>
        </div>
      </div>
    </div>
  );
}