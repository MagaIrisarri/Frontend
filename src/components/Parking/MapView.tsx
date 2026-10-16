import { createElement, useEffect, useRef, memo, useCallback, useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as maptilersdk from '@maptiler/sdk';
import '@maptiler/sdk/dist/maptiler-sdk.css';
import type { Parking } from '../../types/parking.types';
import type { VehicleFilterType } from '../../types/mapFilters.types';
import { formatSpotPrice, getUnavailableReason } from '../../utils/parkingPriceUtils.js';
import { iconOf } from '../Owner/ui/vehicles';
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM, getMapStyle } from '../../config/map.js';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../Owner/ui/Toasts';
import type { LngLat } from '../../utils/distance';

interface MapViewProps {
  spots: Parking[];
  selectedId: string | null;
  onSelect?: (id: string) => void;
  selectedVehicleType?: VehicleFilterType | null;
  fit?: boolean; // encuadrar los pines cuando cambian (no, si la lista sale de la zona que el usuario está mirando)
  onSearchArea?: (bounds: [number, number, number, number]) => void; // [oeste, sur, este, norte]
  onViewChange?: (bounds: [number, number, number, number]) => void; // lo que se ve, al cargar y tras cada movimiento
  onLocate?: (pos: LngLat) => void; // el usuario tocó "Mi ubicación" y el navegador la dio
}

const toArea = (b: maptilersdk.LngLatBounds): [number, number, number, number] => [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()];

function MapViewComponent({
  spots,
  selectedId,
  onSelect,
  selectedVehicleType = null,
  fit = true,
  onSearchArea,
  onViewChange,
  onLocate,
}: MapViewProps) {
  const { theme } = useTheme();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maptilersdk.Map | null>(null);
  const activeMarkersRef = useRef<maptilersdk.Marker[]>([]);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const onViewChangeRef = useRef(onViewChange);
  onViewChangeRef.current = onViewChange;
  const onLocateRef = useRef(onLocate);
  onLocateRef.current = onLocate;
  const toast = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;
  const centeredIdRef = useRef<string | null>(null);
  const fittedKeyRef = useRef<string | null>(null);
  const [searching, setSearching] = useState(false);
  const searchTimerRef = useRef<number | undefined>(undefined);
  useEffect(() => () => clearTimeout(searchTimerRef.current), []);
  const [moved, setMoved] = useState(false); // el usuario movió o acercó el mapa: se ofrece "Buscar en esta zona"

  // Helper para generar el contenido HTML de un pin individual
  const getSingleMarkerHtml = useCallback((spot: Parking, isSelected: boolean) => {
    const spotPrice = formatSpotPrice(spot, selectedVehicleType);
    const reason = selectedVehicleType ? getUnavailableReason(spot, selectedVehicleType.id) : null;
    const isUnavailable = !spotPrice.isAvailable || reason !== null;

    // Con filtro: ícono de la categoría (los mismos del panel del dueño) y precio de esa categoría; sin filtro: "desde" el menor.
    // Completo / sin tarifa se dicen con texto, no solo con color. Estilos en styles/home.scss (.pin).
    const icon = selectedVehicleType ? renderToStaticMarkup(createElement(iconOf(selectedVehicleType.name), { className: 'i sm', 'aria-hidden': true })) : '';
    const label =
      reason === 'NO_SPACE' ? 'Completo'
      : reason === 'NO_PRICE' || spotPrice.price === null ? (selectedVehicleType ? 'Sin tarifa' : 'Consultar')
      : `${selectedVehicleType ? '' : '<small>desde</small> '}$${spotPrice.price.toLocaleString('es-AR')}<small>/h</small>`;
    return `<div class="pin${isSelected ? ' sel' : ''}${isUnavailable ? ' na' : ''}">${icon}<span>${label}</span></div>`;
  }, [selectedVehicleType]);

  // Helper para generar el contenido HTML de un Cluster
  const getClusterHtml = (count: number) => {
    return `
      <div class="cluster">
        <span class="dot"></span>
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
            duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 600,
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
      geolocateControl: false, // se agrega abajo para escuchar sus eventos
      locale: { // etiquetas accesibles de los controles del mapa, en español
        'GeolocateControl.FindMyLocation': 'Mi ubicación',
        'GeolocateControl.LocationNotAvailable': 'Ubicación no disponible',
        'NavigationControl.ZoomIn': 'Acercar',
        'NavigationControl.ZoomOut': 'Alejar',
        'NavigationControl.ResetBearing': 'Orientar al norte',
        'AttributionControl.ToggleAttribution': 'Créditos del mapa',
      },
      attributionControl: { compact: true }, // botón ⓘ que se despliega; la atribución de OSM y MapTiler es obligatoria por licencia y no se quita
    });

    // "Mi ubicación": el permiso se pide solo al tocar el botón. Al ubicarse se ofrece "Buscar en esta zona" y el listado pasa a "Más cercanas".
    const locate = new maptilersdk.GeolocateControl({ positionOptions: { enableHighAccuracy: true, timeout: 10000 }, trackUserLocation: false });
    map.addControl(locate, 'bottom-right');
    locate.on('geolocate', (e: any) => {
      onLocateRef.current?.([e.coords.longitude, e.coords.latitude]);
      setMoved(true);
    });
    locate.on('error', (e: any) => {
      toastRef.current(e?.code === 1
        ? 'No pudimos acceder a tu ubicación. Activala en los permisos del navegador.'
        : 'No pudimos obtener tu ubicación. Intentá de nuevo.', 'err');
    });
    // en modo compacto MapLibre arranca con los créditos abiertos hasta que se toca el mapa: se dejan cerrados desde el principio y al cargar
    const closeCredits = () => {
      const credits = map.getContainer().querySelector('.maplibregl-ctrl-attrib');
      credits?.classList.remove('maplibregl-compact-show');
      credits?.removeAttribute('open');
    };
    closeCredits();
    map.once('load', closeCredits);
    // un toque fuera del botón cierra los créditos (MapLibre solo los cierra al mover el mapa)
    const closeOutside = (e: PointerEvent) => {
      const credits = map.getContainer().querySelector('.maplibregl-ctrl-attrib');
      if (credits && !credits.contains(e.target as Node)) closeCredits();
    };
    document.addEventListener('pointerdown', closeOutside);
    map.on('styleimagemissing', () => {});
    map.on('load', () => {
      renderMarkersRef.current();
      onViewChangeRef.current?.(toArea(map.getBounds()));
    });
    map.on('style.load', () => renderMarkersRef.current());
    map.on('styledata', () => renderMarkersRef.current());
    map.on('zoomend', () => renderMarkersRef.current());
    map.on('moveend', (e) => {
      renderMarkersRef.current();
      onViewChangeRef.current?.(toArea(map.getBounds()));
      if (e.originalEvent) setMoved(true); // solo arrastre, rueda o botones de zoom; los encuadres por código no traen evento
    });

    mapRef.current = map;

    return () => {
      document.removeEventListener('pointerdown', closeOutside);
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

    // Encuadrar solo si cambian los pines: refrescar los datos de uno (p. ej. lugares libres de la elegida) no debe alejar el mapa
    const key = validSpots.map((s) => s.id).sort().join(); // sin importar el orden: reordenar el listado no debe volver a encuadrar
    if (!fit) fittedKeyRef.current = null;
    if (fit && validSpots.length > 0 && key !== fittedKeyRef.current) {
      fittedKeyRef.current = key;
      setMoved(false);
      const bounds = new maptilersdk.LngLatBounds();
      validSpots.forEach((s) => bounds.extend([Number(s.longitude), Number(s.latitude)]));
      map.fitBounds(bounds, {
        padding: 70,
        maxZoom: 15,
        duration: 800,
      });
    }
  }, [spots, selectedVehicleType, fit]);

  const searchArea = () => {
    const b = mapRef.current?.getBounds();
    if (!b || !onSearchArea) return;
    onSearchArea(toArea(b));
    // shortcut: L-26, elfiltro es local e instantáneo; el spinner dura un mínimo fijo para que se perciba, cuando la búsqueda sea remota atarlo a la carga real
    setSearching(true);
    searchTimerRef.current = window.setTimeout(() => {
      setSearching(false);
      setMoved(false);
    }, 500);
  };

  // Actualizar selección activa
  useEffect(() => {
    renderMarkers();

    if (!selectedId) centeredIdRef.current = null;
    const map = mapRef.current;
    // Centrar solo cuando cambia la selección: si cambian los spots (p. ej. "Buscar en esta zona") el mapa no debe saltar al pin elegido
    if (!map || !selectedId || centeredIdRef.current === selectedId) return;

    const selectedSpot = spots.find((s) => s.id === selectedId);
    if (!selectedSpot) return;

    const lat = Number(selectedSpot.latitude);
    const lng = Number(selectedSpot.longitude);

    if (!isNaN(lat) && !isNaN(lng) && !(lat === 0 && lng === 0)) {
      centeredIdRef.current = selectedId;
      // Acercar a la sucursal (desde la lista o su pin); si el usuario ya está más cerca, no alejar
      map.flyTo({
        center: [lng, lat],
        zoom: Math.max(map.getZoom(), 16),
        duration: 800,
      });
    }
  }, [selectedId, spots, renderMarkers]);

  return (
    <>
      <div ref={mapContainerRef} className="w-full h-full relative" />
      {moved && onSearchArea && (
        <button type="button" className="btn hfloat areabtn" onClick={searchArea} disabled={searching} aria-busy={searching}>
          {searching ? <Loader2 className="i sm spin" aria-hidden="true" /> : <Search className="i sm" aria-hidden="true" />}
          {searching ? 'Buscando…' : 'Buscar en esta zona'}
        </button>
      )}
    </>
  );
}

export const MapView = memo(MapViewComponent);
