// components/parking/MapMarker.tsx
import { Marker } from 'react-leaflet';
import L from 'leaflet';
import { renderToStaticMarkup } from 'react-dom/server';
import { cn } from '@/lib/utils';
import type { Parking } from '../../types/Parking.js';



function markerHtml(spot: Parking, selected: boolean, price: number) {
  return renderToStaticMarkup(
    <div className="flex flex-col items-center">
      <div className="bg-primary-container text-on-primary px-3 py-1.5 rounded-full shadow-lg border-2 border-white font-bold text-sm whitespace-nowrap">
        ${price}
      </div>
      <div className="w-3 h-3 bg-primary-container transform rotate-45 -mt-2 border-r-2 border-b-2 border-white" />
    </div>
  );
}

interface MapMarkerProps {
  spot: Parking;
  selected: boolean;
  onSelect: (id: string) => void;
  price: number
}

export function MapMarker({ spot, selected, onSelect, price }: MapMarkerProps) {
  const icon = L.divIcon({
    html: markerHtml(spot, selected, price),
    className: 'bg-transparent border-none',
    iconAnchor: [0, 0],
  });

  return (
    <Marker
      position={[spot.latitude, spot.longitude]}
      icon={icon}
    />
  );
}