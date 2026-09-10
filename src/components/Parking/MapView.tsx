import { MapContainer, TileLayer } from 'react-leaflet';
import { MapMarker } from './MapMarket.js';
import type { Parking } from '../../types/Parking.js';
import 'leaflet/dist/leaflet.css';

const ROSARIO_CENTER: [number, number] = [-32.9468, -60.6393];

interface MapViewProps {
  spots: Parking[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  prices: Record<string, number>;
}

export function MapView({ spots, selectedId, onSelect, prices }: MapViewProps) {
  return (
    <MapContainer center={ROSARIO_CENTER} zoom={14} className="w-full h-full" zoomControl={false}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />
      {spots.map((spot) => (
        <MapMarker key={spot.id} spot={spot} selected={spot.id === selectedId} onSelect={onSelect} price={prices[spot.id]}/>
      ))}
    </MapContainer>
  );
}