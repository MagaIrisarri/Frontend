import { useEffect, useRef } from 'react';
import * as maptilersdk from '@maptiler/sdk';
import '@maptiler/sdk/dist/maptiler-sdk.css';
import type { Parking } from '../../types/Parking.js';
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM, getMapStyle } from '../../config/map.js';

interface MapViewProps {
  spots: Parking[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  prices: Record<string, number>;
}

export function MapView({ spots, selectedId, onSelect, prices }: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maptilersdk.Map | null>(null);
  const markersRef = useRef<Map<string, maptilersdk.Marker>>(new Map());

  // Inicializar mapa
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new maptilersdk.Map({
      container: mapContainerRef.current,
      style: getMapStyle(),
      center: DEFAULT_MAP_CENTER,
      zoom: DEFAULT_MAP_ZOOM,
      navigationControl: 'top-right',
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Actualizar marcadores y ajustar vista (fitBounds) cuando cambian los spots
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Limpiar marcadores viejos
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();

    if (spots.length === 0) return;

    const bounds = new maptilersdk.LngLatBounds();
    let hasValidBounds = false;

    spots.forEach((spot) => {
      const lat = Number(spot.latitude);
      const lng = Number(spot.longitude);

      if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) return;

      const isSelected = spot.id === selectedId;
      const price = prices[spot.id];
      const priceText = price !== undefined ? `$${price}` : 'Ver';

      // Elemento HTML personalizado para el pin
      const el = document.createElement('div');
      el.className = 'cursor-pointer select-none transition-transform duration-200 hover:scale-110';
      el.innerHTML = `
        <div class="flex flex-col items-center">
          <div class="px-3 py-1.5 rounded-full shadow-lg border-2 font-bold text-xs whitespace-nowrap transition-colors ${
            isSelected
              ? 'bg-blue-600 text-white border-white scale-110 ring-2 ring-blue-400'
              : 'bg-zinc-900 text-white border-zinc-700 hover:bg-zinc-800'
          }">
            ${priceText}
          </div>
          <div class="w-2.5 h-2.5 transform rotate-45 -mt-1.5 border-r-2 border-b-2 ${
            isSelected ? 'bg-blue-600 border-white' : 'bg-zinc-900 border-zinc-700'
          }"></div>
        </div>
      `;

      el.addEventListener('click', () => {
        onSelect(spot.id);
        map.flyTo({
          center: [lng, lat],
          zoom: Math.max(map.getZoom(), 15),
          duration: 800,
        });
      });

      const marker = new maptilersdk.Marker({
        element: el,
        anchor: 'bottom',
      })
        .setLngLat([lng, lat])
        .addTo(map);

      markersRef.current.set(spot.id, marker);
      bounds.extend([lng, lat]);
      hasValidBounds = true;
    });

    if (hasValidBounds) {
      map.fitBounds(bounds, {
        padding: 60,
        maxZoom: 15,
        duration: 1000,
      });
    }
  }, [spots, selectedId, prices, onSelect]);

  // Centrar en el seleccionado si cambia externamente
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedId) return;

    const selectedSpot = spots.find((s) => s.id === selectedId);
    if (!selectedSpot) return;

    const lat = Number(selectedSpot.latitude);
    const lng = Number(selectedSpot.longitude);

    if (!isNaN(lat) && !isNaN(lng) && !(lat === 0 && lng === 0)) {
      map.flyTo({
        center: [lng, lat],
        zoom: Math.max(map.getZoom(), 15),
        duration: 800,
      });
    }
  }, [selectedId, spots]);

  return <div ref={mapContainerRef} className="w-full h-full relative" />;
}