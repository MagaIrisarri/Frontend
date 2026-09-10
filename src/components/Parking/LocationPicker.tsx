import { useMemo } from 'react';
import L, { type LeafletMouseEvent, type LeafletEvent } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';

import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface LocationData {
  lat: number;
  lng: number;
  address?: string;
  locality?: string;
  postalCode?: string;
}

interface LocationPickerProps {
  lat: number;
  lng: number;
  onChangeLocation: (locationData: LocationData) => void;
}

function MapEvents({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e: LeafletMouseEvent) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function LocationPicker({ lat, lng, onChangeLocation
}: LocationPickerProps) {
const position = useMemo<[number, number]>(() => {
  const defaultLat = lat && !isNaN(lat) && lat !== 0 ? lat : -32.9468;
  const defaultLng = lng && !isNaN(lng) && lng !== 0 ? lng : -60.6393;
  return [defaultLat, defaultLng];
}, [lat, lng]);


const handlePositionChange = async (newLat: number, newLng: number) => {
 let address = '';
 let locality = '';
 let postalCode = '';

try { 
const response = await  fetch (
  `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${newLat}&lon=${newLng}`
)

const data = await response.json();

if (data && data.address) {
   address = data.address.road ? `${data.address.road} ${data.address.house_number || ''}`.trim() :
   data.display_name.split(',')[0];
   locality = data.address.city || data.address.town || data.address.village || '';
    postalCode = data.address.postcode || '';
}
    } catch (error) {
      console.error('Error al realizar geocodificación inversa:', error);
    }

onChangeLocation(
  {
    lat: newLat,
    lng: newLng,
    address,
    locality, 
    postalCode,
  }
)
}
return (
    <div className="w-full flex flex-col gap-2 my-4">
      <label className="text-sm font-medium text-zinc-300">
        Ubicación en el mapa (Haz clic o arrastra el pin para ubicar la playa)
      </label>
      
      <div className="h-72 w-full rounded-lg overflow-hidden border border-zinc-700 relative z-0">
       <MapContainer center={ position} zoom={13}>
         <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
         <MapEvents onSelect={handlePositionChange} />
         <Marker  
           position={ position}
           draggable={true}
           eventHandlers={{
             dragend: (e: LeafletEvent) => {
                const marker = e.target;
                const pos = marker.getLatLng();
                handlePositionChange(pos.lat, pos.lng);
              },
            }}
          />
        </MapContainer>
      </div>
    </div>
 );
}
