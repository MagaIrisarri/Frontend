export type LngLat = [number, number];

// Distancia en km entre dos puntos [lng, lat] (haversine).
export function distanceKm([lng1, lat1]: LngLat, [lng2, lat2]: LngLat): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const a = Math.sin(rad(lat2 - lat1) / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lng2 - lng1) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
}

// "a 400 m" por debajo del kilómetro, "a 2,3 km" por encima.
export function formatDistance(km: number): string {
  if (km < 1) return `a ${Math.max(10, Math.round((km * 1000) / 10) * 10)} m`;
  return `a ${km.toLocaleString('es-AR', { maximumFractionDigits: 1 })} km`;
}
