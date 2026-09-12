import React, { useEffect, useRef, memo, useCallback } from 'react';
import * as maptilersdk from '@maptiler/sdk';
import '@maptiler/sdk/dist/maptiler-sdk.css';
import type { Parking } from '../../types/parking.types';
import type { VehicleFilterType } from '../../types/mapFilters.types';
import { formatSpotPrice } from '../../utils/parkingPriceUtils.js';
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM, getMapStyle } from '../../config/map.js';
import { useTheme } from '../../context/ThemeContext';

interface MapViewProps {
  spots: Parking[];
  selectedId: string | null;
  onSelect?: (id: string) => void;
  prices?: Record<string, number>;
  selectedVehicleType?: VehicleFilterType | null;
}

const EMPTY_PRICES: Record<string, number> = {};

function MapViewComponent({
  spots,
  selectedId,
  onSelect,
  prices = EMPTY_PRICES,
  selectedVehicleType = null,
}: MapViewProps) {
  const { theme } = useTheme();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maptilersdk.Map | null>(null);
  const activeMarkersRef = useRef<maptilersdk.Marker[]>([]);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const isInternalClickRef = useRef(false);

  // Helper para generar el contenido HTML de un pin individual
  const getSingleMarkerHtml = useCallback((spot: Parking, isSelected: boolean) => {
    const spotPrice = formatSpotPrice(spot, selectedVehicleType);
    const isUnavailable = !spotPrice.isAvailable;

    if (isSelected) {
      return `
        <div class="px-3.5 py-1.5 rounded-full ${
          isUnavailable
            ? 'bg-zinc-800 text-zinc-300 border-zinc-600'
            : 'bg-blue-600 text-white border-blue-400 dark:border-blue-300'
        } font-extrabold text-xs shadow-xl shadow-blue-500/40 scale-105 ring-4 ring-blue-500/30 transition-all duration-150 border whitespace-nowrap flex items-center gap-1.5 select-none z-30">
          ${selectedVehicleType && spotPrice.isAvailable ? `<span class="w-2 h-2 rounded-full bg-emerald-300 animate-pulse shrink-0"></span>` : ''}
          <span>${spotPrice.text}</span>
        </div>
      `;
    }

    return `
      <div class="px-3 py-1.5 rounded-full ${
        isUnavailable
          ? 'bg-zinc-100/90 dark:bg-zinc-800/80 text-zinc-400 dark:text-zinc-500 border-zinc-300 dark:border-zinc-700'
          : 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white font-bold border-zinc-200 dark:border-zinc-700 hover:scale-105 hover:shadow-lg hover:border-blue-500'
      } text-xs shadow-md border transition-all duration-150 whitespace-nowrap flex items-center gap-1.5 select-none">
        ${selectedVehicleType && spotPrice.isAvailable ? `<span class="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>` : ''}
        <span>${spotPrice.text}</span>
      </div>
    `;
  }, [selectedVehicleType]);

  // Helper para generar el contenido HTML de un Cluster
  const getClusterHtml = (count: number) => {
    return `
      <div class="px-3 py-1.5 rounded-full bg-zinc-900 dark:bg-zinc-800 text-white font-black text-xs shadow-xl border border-zinc-700 dark:border-zinc-600 flex items-center gap-1.5 cursor-pointer hover:scale-110 hover:bg-blue-600 transition-all select-none">
        <span class="w-2 h-2 rounded-full bg-blue-400 shrink-0 animate-ping"></span>
        <span>${count} cocheras</span>
      </div>
    `;
  };

  // Renderizar marcadores con algoritmo de clustering por distancia en píxeles (< 40px)
  const renderMarkers = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    // Limpiar marcadores anteriores
    activeMarkersRef.current.forEach((marker) => marker.remove());
    activeMarkersRef.current = [];

    if (spots.length === 0) return;

    // Filtrar spots válidos
    const validSpots = spots.filter((spot) => {
      const lat = Number(spot.latitude);
      const lng = Number(spot.longitude);
      return !isNaN(lat) && !isNaN(lng) && !(lat === 0 && lng === 0);
    });

    if (validSpots.length === 0) return;

    // Agrupar por cercanía en pantalla (< 40px)
    type ClusterItem = {
      center: [number, number];
      spots: Parking[];
    };

    const clusters: ClusterItem[] = [];

    validSpots.forEach((spot) => {
      const lng = Number(spot.longitude);
      const lat = Number(spot.latitude);
      const pos = map.project([lng, lat]);

      let addedToCluster = false;

      for (const cluster of clusters) {
        const clusterPos = map.project(cluster.center);
        const dist = Math.hypot(pos.x - clusterPos.x, pos.y - clusterPos.y);

        if (dist < 40) {
          cluster.spots.push(spot);
          // Recalcular centro del cluster
          const totalLng = cluster.spots.reduce((s, p) => s + Number(p.longitude), 0);
          const totalLat = cluster.spots.reduce((s, p) => s + Number(p.latitude), 0);
          cluster.center = [totalLng / cluster.spots.length, totalLat / cluster.spots.length];
          addedToCluster = true;
          break;
        }
      }

      if (!addedToCluster) {
        clusters.push({
          center: [lng, lat],
          spots: [spot],
        });
      }
    });

    // Crear markers para cada cluster o spot individual
    clusters.forEach((cluster) => {
      if (cluster.spots.length > 1) {
        // Marcador de Cluster
        const el = document.createElement('div');
        el.className = 'cursor-pointer select-none transition-transform duration-200 z-20';
        el.innerHTML = getClusterHtml(cluster.spots.length);

        el.addEventListener('click', (e) => {
          e.stopPropagation();
          map.flyTo({
            center: cluster.center,
            zoom: Math.min(18, map.getZoom() + 2.5),
            duration: 600,
          });
        });

        const marker = new maptilersdk.Marker({ element: el, anchor: 'center' })
          .setLngLat(cluster.center)
          .addTo(map);

        activeMarkersRef.current.push(marker);
      } else {
        // Marcador Individual
        const spot = cluster.spots[0];
        const isSelected = spot.id === selectedId;

        const el = document.createElement('div');
        el.className = `cursor-pointer select-none transition-transform duration-200 ${
          isSelected ? 'z-30' : 'z-10'
        }`;
        el.innerHTML = getSingleMarkerHtml(spot, isSelected);

        el.addEventListener('click', (e) => {
          e.stopPropagation();
          isInternalClickRef.current = true;
          if (onSelectRef.current) {
            onSelectRef.current(spot.id);
          }
        });

        const marker = new maptilersdk.Marker({ element: el, anchor: 'center' })
          .setLngLat([Number(spot.longitude), Number(spot.latitude)])
          .addTo(map);

        activeMarkersRef.current.push(marker);
      }
    });
  }, [spots, selectedId, selectedVehicleType, getSingleMarkerHtml]);

  const renderMarkersRef = useRef(renderMarkers);
  renderMarkersRef.current = renderMarkers;

  // Inicializar mapa
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new maptilersdk.Map({
      container: mapContainerRef.current,
      style: getMapStyle(theme),
      center: DEFAULT_MAP_CENTER,
      zoom: DEFAULT_MAP_ZOOM,
      navigationControl: 'bottom-right',
    });

    map.on('styleimagemissing', () => {});
    map.on('load', () => renderMarkersRef.current());
    map.on('style.load', () => renderMarkersRef.current());
    map.on('styledata', () => renderMarkersRef.current());
    map.on('zoomend', () => renderMarkersRef.current());
    map.on('moveend', () => renderMarkersRef.current());

    mapRef.current = map;

    return () => {
      try {
        activeMarkersRef.current.forEach((marker) => marker.remove());
        activeMarkersRef.current = [];
        map.remove();
      } catch {
        // Safe unmount
      }
      mapRef.current = null;
    };
  }, []);

  // Actualizar tema del mapa si cambia (ignorar primer render ya que Map() ya recibe el estilo inicial)
  const isFirstThemeRun = useRef(true);
  useEffect(() => {
    if (isFirstThemeRun.current) {
      isFirstThemeRun.current = false;
      return;
    }
    const map = mapRef.current;
    if (!map) return;
    try {
      map.setStyle(getMapStyle(theme));
      const onStyleReady = () => {
        renderMarkersRef.current();
      };
      map.once('style.load', onStyleReady);
      map.once('styledata', onStyleReady);
      setTimeout(() => renderMarkersRef.current(), 150);
    } catch (e) {
      console.warn('Error setting map style:', e);
    }
  }, [theme]);

  // Ajustar vista y renderizar marcadores cuando cambian los spots
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    renderMarkers();

    const validSpots = spots.filter((spot) => {
      const lat = Number(spot.latitude);
      const lng = Number(spot.longitude);
      return !isNaN(lat) && !isNaN(lng) && !(lat === 0 && lng === 0);
    });

    if (validSpots.length > 0) {
      const bounds = new maptilersdk.LngLatBounds();
      validSpots.forEach((s) => bounds.extend([Number(s.longitude), Number(s.latitude)]));
      map.fitBounds(bounds, {
        padding: 70,
        maxZoom: 15,
        duration: 800,
      });
    }
  }, [spots, selectedVehicleType]);

  // Actualizar selección activa
  useEffect(() => {
    renderMarkers();

    if (isInternalClickRef.current) {
      isInternalClickRef.current = false;
      return;
    }

    const map = mapRef.current;
    if (!map || !selectedId) return;

    const selectedSpot = spots.find((s) => s.id === selectedId);
    if (!selectedSpot) return;

    const lat = Number(selectedSpot.latitude);
    const lng = Number(selectedSpot.longitude);

    if (!isNaN(lat) && !isNaN(lng) && !(lat === 0 && lng === 0)) {
      map.easeTo({
        center: [lng, lat],
        duration: 500,
      });
    }
  }, [selectedId, spots, renderMarkers]);

  return <div ref={mapContainerRef} className="w-full h-full relative" />;
}

export const MapView = memo(MapViewComponent);
