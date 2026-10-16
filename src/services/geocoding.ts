import * as maptilersdk from '@maptiler/sdk';
import { MAPTILER_API_KEY } from '../config/map';

// Geocodificación del selector de ubicación, para toda Argentina y con dos fuentes; cada búsqueda va acotada a la provincia y localidad elegidas.
// - Georef (API oficial de datos.gob.ar, gratis y sin clave) conoce calle y altura de Argentina: "Urquiza 843" cae en su lugar.
// - MapTiler sirve para escribir de a poco (autocompleta calles) y para el barrio; muchas veces no conoce la altura.
export interface GeoPlace {
  kind: 'address' | 'street'; // dirección con altura, o solo la calle (todavía falta la altura)
  source: 'georef' | 'maptiler';
  street: string;
  lat: number;
  lng: number;
  address: string; // calle y altura
  neighborhood: string; // barrio o zona
  locality: string;
  province?: string;
  postalCode: string;
}

// Dónde se busca: provincia y localidad elegidas, con su centro [lng, lat] (centroide de Georef o el punto ya cargado).
export interface GeoArea { province: string; locality: string; center: [number, number]; detail?: string }

// ~30 km alrededor del centro: más lejos ya no es esa localidad (y MapTiler no se acota por nombre de localidad).
export const nearArea = (area: GeoArea, lng: number, lat: number) => Math.abs(lng - area.center[0]) < 0.3 && Math.abs(lat - area.center[1]) < 0.3;

// Las 24 jurisdicciones con el nombre que usa Georef (el parámetro `provincia` lo espera así).
export const PROVINCES = [
  'Buenos Aires', 'Catamarca', 'Chaco', 'Chubut', 'Ciudad Autónoma de Buenos Aires', 'Córdoba', 'Corrientes', 'Entre Ríos',
  'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza', 'Misiones', 'Neuquén', 'Río Negro', 'Salta', 'San Juan', 'San Luis',
  'Santa Cruz', 'Santa Fe', 'Santiago del Estero', 'Tierra del Fuego, Antártida e Islas del Atlántico Sur', 'Tucumán',
];
const GEOREF = 'https://apis.datos.gob.ar/georef/api';
const enc = encodeURIComponent;

// "Rosario Centro" → "Centro"
const cleanHood = (t?: string) => (t ?? '').replace(/^rosario\s+/i, '').trim();
const digits = (t?: string) => (t ?? '').replace(/\D/g, '');
const typeOf = (f: any, type: string) => (f.place_type ?? []).includes(type);

// Dirección de un punto (para cuando el dueño mueve el pin o marca el mapa).
export async function reverseGeocode(lng: number, lat: number): Promise<Partial<GeoPlace>> {
  const out: Partial<GeoPlace> = {};
  try {
    if (MAPTILER_API_KEY) {
      const res: any = await maptilersdk.geocoding.reverse([lng, lat], { language: ['es'] });
      const fs: any[] = res?.features ?? [];
      const addr = fs.find((f) => typeOf(f, 'address'));
      if (addr) out.address = [addr.text, addr.address].filter(Boolean).join(' ').trim();
      const hood = fs.find((f) => typeOf(f, 'neighbourhood')) ?? fs.find((f) => typeOf(f, 'place'));
      if (hood) out.neighborhood = cleanHood(hood.text);
      const postal = fs.find((f) => typeOf(f, 'postal_code'));
      if (postal) out.postalCode = digits(postal.text);
      const city = fs.find((f) => typeOf(f, 'municipal_district') || typeOf(f, 'municipality'));
      if (city) out.locality = String(city.text).replace(/^municipio de\s+/i, '');
      const region = fs.find((f) => typeOf(f, 'region'));
      if (region) out.province = String(region.text).replace(/^provincia de\s+/i, '');
    } else {
      const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&accept-language=es&lat=${lat}&lon=${lng}`);
      const a = (await r.json())?.address ?? {};
      out.address = [a.road ?? a.pedestrian, a.house_number].filter(Boolean).join(' ');
      out.neighborhood = cleanHood(a.suburb ?? a.neighbourhood ?? a.city_district);
      out.postalCode = digits(a.postcode);
      out.locality = a.city ?? a.town ?? a.village ?? '';
      out.province = String(a.state ?? '').replace(/^provincia de\s+/i, '');
    }
  } catch (e) {
    console.error('Error en geocodificación inversa:', e);
  }
  return out;
}

// Localidades de una provincia que empiezan o contienen lo escrito ("san nic" → San Nicolás de los Arroyos), con su centroide.
export async function searchLocalities(province: string, name: string): Promise<GeoArea[]> {
  const url = `${GEOREF}/localidades-censales?provincia=${enc(province)}&nombre=${enc(name)}&max=8&aplanar=true&campos=nombre,centroide,departamento.nombre`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Georef ${res.status}`);
  const data = await res.json();
  // El departamento distingue homónimas dentro de una provincia (hay varias "San Martín").
  return (data?.localidades_censales ?? []).map((l: any): GeoArea => ({
    province, locality: l.nombre, center: [Number(l.centroide_lon), Number(l.centroide_lat)],
    detail: [l.departamento_nombre !== l.nombre ? l.departamento_nombre : '', province].filter(Boolean).join(', '),
  }));
}

async function searchMapTiler(q: string, area: GeoArea): Promise<GeoPlace[]> {
  const res: any = await maptilersdk.geocoding.forward(q, {
    country: ['ar'], proximity: area.center, language: ['es'], limit: 5,
  });
  return (res?.features ?? [])
    .filter((f: any) => (typeOf(f, 'address') || typeOf(f, 'poi')) && f.text)
    .map((f: any): GeoPlace => ({
      kind: f.address ? 'address' : 'street', source: 'maptiler', street: f.text,
      lat: f.center[1], lng: f.center[0],
      address: [f.text, f.address].filter(Boolean).join(' ').trim(),
      neighborhood: '', locality: area.locality, province: area.province, postalCode: '',
    }));
}

const title = (t: string) =>
  t.toLowerCase().replace(/(^|\s)(\p{L})/gu, (_m, sp, ch) => sp + ch.toUpperCase()).replace(/\s(De|Del|La|Las|Los|Y)\s/g, (m) => m.toLowerCase());

// Normalizador oficial de direcciones de Argentina. `aplanar=true` es necesario: sin él la ubicación llega anidada (ubicacion.lat) y no se lee.
async function searchGeoref(q: string, area: GeoArea): Promise<GeoPlace[]> {
  const locality = area.locality ? `&localidad_censal=${enc(area.locality)}` : '';
  const url = `${GEOREF}/direcciones?direccion=${enc(q)}&provincia=${enc(area.province)}${locality}&max=5&aplanar=true`;
  const data = await (await fetch(url)).json();
  return (data?.direcciones ?? [])
    .filter((d: any) => d.calle_nombre)
    .map((d: any): GeoPlace => {
      const street = title(String(d.calle_nombre));
      const hasNumber = d.altura_valor != null && d.ubicacion_lat != null && d.ubicacion_lon != null;
      return {
        kind: hasNumber ? 'address' : 'street', source: 'georef', street,
        lat: Number(d.ubicacion_lat ?? area.center[1]), lng: Number(d.ubicacion_lon ?? area.center[0]),
        address: hasNumber ? `${street} ${d.altura_valor}` : street,
        neighborhood: '', locality: area.locality, province: area.province, postalCode: '',
      };
    });
}

const key = (t: string) => t.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();
// Sin tildes ni "Avenida", "Peatonal"…: "Cordoba 1240" y "Avenida Córdoba 1240" son la misma dirección
const core = (t: string) => key(t).replace(/\b(avenida|av|peatonal|calle|bulevar|bv|boulevard|pasaje|pje|diagonal)\.?\s+/g, '');
const trailingNumber = (t: string) => t.match(/(\d{1,5})\s*$/)?.[1];

// Sugerencias para lo que escribe el dueño, como en Google Maps o Uber:
// - con altura ("urquiza 843"): solo direcciones reales con esa altura, sin calles sueltas ni repetidas;
// - sin altura ("urquiza"): las calles, para que complete el número.
export async function searchAddress(query: string, area: GeoArea): Promise<GeoPlace[]> {
  const q = query.trim();
  if (q.length < 3) return [];
  const number = trailingNumber(q);

  // Georef primero: ante dos iguales se queda con la suya (conoce la altura exacta)
  const sources = [searchGeoref(q, area), MAPTILER_API_KEY ? searchMapTiler(q, area) : Promise.resolve([] as GeoPlace[])];
  const found = (await Promise.allSettled(sources)).flatMap((r) => (r.status === 'fulfilled' ? r.value : []));

  const words = key(q).split(/\s+/).filter(Boolean);
  const wanted = number
    ? found.filter((p) => p.kind === 'address' && trailingNumber(p.address) === number && nearArea(area, p.lng, p.lat))
    : found.filter((p) => p.kind === 'street' && words.every((w) => key(p.street).includes(w))); // sin coincidencias difusas ("Miglierini" para "urquiza")

  // El mismo lugar puede venir de las dos fuentes ("San Martin 750" / "Peatonal San Martín 750"): una sola fila,
  // con el punto de Georef (exacto en la altura) y el nombre de MapTiler (con tildes y "Avenida", "Peatonal"…).
  const out: GeoPlace[] = [];
  for (const p of wanted) {
    const same = out.find((o) => core(o.address) === core(p.address) || (number ? Math.abs(o.lat - p.lat) < 0.0004 && Math.abs(o.lng - p.lng) < 0.0004 : key(o.street) === key(p.street)));
    if (!same) out.push({ ...p });
    else if (p.source === 'maptiler') {
      same.address = p.address;
      same.street = p.street;
    }
  }
  return out
    .slice(0, 5);
}
