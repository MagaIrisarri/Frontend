import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as maptilersdk from '@maptiler/sdk';
import '@maptiler/sdk/dist/maptiler-sdk.css';
import { Search, MapPin, Locate, Loader2 } from 'lucide-react';
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM, getMapStyle, MAPTILER_API_KEY } from '../../config/map.js';
import { useTheme } from '../../context/ThemeContext';

export interface LocationData {
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
  className?: string;
}

export function LocationPicker({
  lat,
  lng,
  onChangeLocation,
  className = '',
}: LocationPickerProps) {
  const { theme } = useTheme();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maptilersdk.Map | null>(null);
  const markerRef = useRef<maptilersdk.Marker | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isGeolocating, setIsGeolocating] = useState(false);

  // Posición inicial válida [lng, lat]
  const initialLng = lng && !isNaN(lng) && lng !== 0 ? Number(lng) : DEFAULT_MAP_CENTER[0];
  const initialLat = lat && !isNaN(lat) && lat !== 0 ? Number(lat) : DEFAULT_MAP_CENTER[1];

  // Geocodificación inversa (de coordenadas a dirección)
  const handlePositionChange = useCallback(
    async (newLng: number, newLat: number) => {
      let address = '';
      let locality = '';
      let postalCode = '';

      try {
        if (MAPTILER_API_KEY) {
          const result = await maptilersdk.geocoding.reverse([newLng, newLat]);
          if (result && result.features && result.features.length > 0) {
            const feat = result.features[0];
            address = feat.place_name || feat.text || '';
            const context = feat.context || [];
            const placeContext = context.find(
              (c: any) => c.id?.startsWith('place') || c.id?.startsWith('municipality')
            );
            const postalContext = context.find((c: any) => c.id?.startsWith('postal_code'));
            locality = placeContext?.text || '';
            postalCode = postalContext?.text || '';
          }
        } else {
          // Fallback a Nominatim si no hay key configurada
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${newLat}&lon=${newLng}`
          );
          const data = await response.json();
          if (data && data.address) {
            address = data.address.road
              ? `${data.address.road} ${data.address.house_number || ''}`.trim()
              : data.display_name?.split(',')[0] || '';
            locality =
              data.address.city ||
              data.address.town ||
              data.address.village ||
              data.address.municipality ||
              '';
            postalCode = data.address.postcode || '';
          }
        }
      } catch (error) {
        console.error('Error en geocodificación inversa:', error);
      }

      onChangeLocation({
        lat: Number(newLat.toFixed(6)),
        lng: Number(newLng.toFixed(6)),
        address,
        locality,
        postalCode,
      });
    },
    [onChangeLocation]
  );

  // Inicializar mapa
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new maptilersdk.Map({
      container: mapContainerRef.current,
      style: getMapStyle(theme),
      center: [initialLng, initialLat],
      zoom: DEFAULT_MAP_ZOOM,
      navigationControl: 'top-right',
    });

    map.on('styleimagemissing', () => {});

    const marker = new maptilersdk.Marker({
      draggable: true,
      color: '#2563eb',
    })
      .setLngLat([initialLng, initialLat])
      .addTo(map);

    marker.on('dragend', () => {
      const lngLat = marker.getLngLat();
      handlePositionChange(lngLat.lng, lngLat.lat);
    });

    map.on('click', (e) => {
      marker.setLngLat(e.lngLat);
      handlePositionChange(e.lngLat.lng, e.lngLat.lat);
    });

    mapRef.current = map;
    markerRef.current = marker;

    return () => {
      try {
        marker.remove();
        map.remove();
      } catch {
        // Safe unmount
      }
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Sincronizar coordenadas externas
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;
    if (!lat || !lng || isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) return;

    const currentPos = markerRef.current.getLngLat();
    if (
      Math.abs(currentPos.lat - lat) > 0.0001 ||
      Math.abs(currentPos.lng - lng) > 0.0001
    ) {
      markerRef.current.setLngLat([lng, lat]);
      mapRef.current.flyTo({ center: [lng, lat], zoom: 15, duration: 800 });
    }
  }, [lat, lng]);

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
    } catch {
      // Ignore style change error if unmounting
    }
  }, [theme]);

  // Búsqueda de dirección (Geocodificación directa)
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim() || !mapRef.current || !markerRef.current) return;

    setIsSearching(true);
    try {
      if (MAPTILER_API_KEY) {
        const result = await maptilersdk.geocoding.forward(searchQuery, {
          country: ['ar'],
          bbox: [-73.5, -55.0, -53.5, -21.5],
        });
        if (result && result.features && result.features.length > 0) {
          const [foundLng, foundLat] = result.features[0].center;
          mapRef.current.flyTo({ center: [foundLng, foundLat], zoom: 16, duration: 1000 });
          markerRef.current.setLngLat([foundLng, foundLat]);
          handlePositionChange(foundLng, foundLat);
        }
      } else {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            searchQuery
          )}&countrycodes=ar&limit=1`
        );
        const data = await response.json();
        if (data && data.length > 0) {
          const foundLat = parseFloat(data[0].lat);
          const foundLng = parseFloat(data[0].lon);
          mapRef.current.flyTo({ center: [foundLng, foundLat], zoom: 16, duration: 1000 });
          markerRef.current.setLngLat([foundLng, foundLat]);
          handlePositionChange(foundLng, foundLat);
        }
      }
    } catch (error) {
      console.error('Error al buscar dirección:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Botón Mi Ubicación
  const handleGeolocation = () => {
    if (!navigator.geolocation || !mapRef.current || !markerRef.current) return;

    setIsGeolocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLat = pos.coords.latitude;
        const userLng = pos.coords.longitude;
        mapRef.current?.flyTo({ center: [userLng, userLat], zoom: 16, duration: 1000 });
        markerRef.current?.setLngLat([userLng, userLat]);
        handlePositionChange(userLng, userLat);
        setIsGeolocating(false);
      },
      (err) => {
        console.error('Error al obtener geolocalización:', err);
        setIsGeolocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div className={`w-full flex flex-col gap-3 ${className}`}>
      {/* Barra de búsqueda sobre el mapa */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar calle y altura en el mapa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors shadow-sm"
          />
        </div>
        <button
          type="submit"
          disabled={isSearching}
          className="px-3.5 py-2 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 cursor-pointer shadow-sm flex items-center gap-1.5"
        >
          {isSearching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Buscar'}
        </button>
        <button
          type="button"
          onClick={handleGeolocation}
          disabled={isGeolocating}
          title="Usar mi ubicación actual"
          className="p-2 text-slate-600 dark:text-zinc-300 bg-white dark:bg-zinc-950 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 rounded-xl transition-colors disabled:opacity-50 inline-flex items-center justify-center cursor-pointer shadow-sm"
        >
          <Locate className={`h-4 w-4 ${isGeolocating ? 'animate-spin text-blue-500' : ''}`} />
        </button>
      </form>

      {/* Contenedor del mapa interactivo */}
      <div className="h-72 lg:h-80 w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-zinc-800 relative z-0 shadow-sm">
        <div ref={mapContainerRef} className="w-full h-full" />
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400 px-1">
        <span className="flex items-center gap-1">
          <MapPin className="h-3 w-3 text-blue-500" />
          {lat && lng ? `${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}` : 'Sin fijar'}
        </span>
        <span className="italic">Arrastrá el pin para ajustar</span>
      </div>
    </div>
  );
}
