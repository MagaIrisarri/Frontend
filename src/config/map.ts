import * as maptilersdk from '@maptiler/sdk';
import { MapStyle } from '@maptiler/sdk';
import type { ReferenceMapStyle, MapStyleVariant } from '@maptiler/sdk';

export const MAPTILER_API_KEY = import.meta.env.VITE_MAPTILER_API_KEY || '';

if (MAPTILER_API_KEY) {
  maptilersdk.config.apiKey = MAPTILER_API_KEY;
}
maptilersdk.config.session = false;
maptilersdk.config.telemetry = false;

// Coordenadas por defecto (Rosario, Santa Fe) [lng, lat]
export const DEFAULT_MAP_CENTER: [number, number] = [-60.6393, -32.9468];
export const DEFAULT_MAP_ZOOM = 13;

export const getMapStyle = (
  theme: 'light' | 'dark' = 'light'
): string | ReferenceMapStyle | MapStyleVariant => {
  if (MAPTILER_API_KEY) {
    return theme === 'dark' ? MapStyle.STREETS.DARK : MapStyle.STREETS;
  }
  // Fallback abierto si aún no se configuró la API key
  return 'https://demotiles.maplibre.org/style.json';
};
