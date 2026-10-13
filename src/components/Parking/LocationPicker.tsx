import { useCallback, useEffect, useId, useRef, useState } from 'react';
import * as maptilersdk from '@maptiler/sdk';
import '@maptiler/sdk/dist/maptiler-sdk.css';
import { Locate, MapPin, Route, Search } from 'lucide-react';
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM, getMapStyle } from '../../config/map.js';
import { useTheme } from '../../context/ThemeContext';
import { Field, Input } from '../Owner/ui/Field';
import { PROVINCES, nearArea, reverseGeocode, searchAddress, searchLocalities, type GeoArea, type GeoPlace } from '../../services/geocoding';
import { norm } from '../../utils/search';
import '../../styles/base.scss';
import '../../styles/ui.scss';

// Todo lo que describe dónde está una cochera. El selector lo muestra y lo edita; el formulario lo guarda.
export interface PlaceValue {
  province: string;
  locality: string; // vacía = todavía sin confirmar (hay que elegirla de la lista)
  neighborhood: string;
  address: string;
  postalCode: string;
  lat: number;
  lng: number;
}

interface LocationPickerProps {
  value: PlaceValue;
  onChange: (patch: Partial<PlaceValue>) => void;
  errors?: Partial<Record<'locality' | 'address' | 'postalCode', string>>;
  className?: string;
}

// Selector de ubicación del estándar, en tres pasos a la vista:
// 1) provincia, localidad (se elige de la lista, así no existe "Rosario, Chaco") y calle y altura con sugerencias mientras se escribe;
// 2) confirmar el punto en el mapa (el pin se arrastra);
// 3) revisar los datos: calle, barrio y código postal siempre visibles y editables (sin "corregir a mano" escondido).
// Funciona dentro y fuera del panel del dueño (root .owner).
export function LocationPicker({ value, onChange, errors, className = '' }: LocationPickerProps) {
  const { theme } = useTheme();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maptilersdk.Map | null>(null);
  const markerRef = useRef<maptilersdk.Marker | null>(null);
  const valueRef = useRef(value);
  valueRef.current = value;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const { lat, lng, province, locality } = value;
  const initialLng = lng && !isNaN(lng) && lng !== 0 ? Number(lng) : DEFAULT_MAP_CENTER[0];
  const initialLat = lat && !isNaN(lat) && lat !== 0 ? Number(lat) : DEFAULT_MAP_CENTER[1];
  const center = useRef<[number, number]>([initialLng, initialLat]); // centro de la localidad confirmada

  // ── Localidad ──
  const [locText, setLocText] = useState(locality);
  const [locOpts, setLocOpts] = useState<GeoArea[]>([]);
  const [locActive, setLocActive] = useState(-1);
  const [locStatus, setLocStatus] = useState<'idle' | 'empty' | 'error'>('idle');
  const locReq = useRef(0);
  const locListId = useId();
  // El pin pudo cambiar la localidad: el texto la sigue. Se ajusta al renderizar (no en un efecto) para no pisar lo que se está escribiendo.
  const [seenLocality, setSeenLocality] = useState(locality);
  if (locality !== seenLocality) {
    setSeenLocality(locality);
    if (locality) setLocText(locality);
  }

  // ── Dirección ──
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeoPlace[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'empty'>('idle');
  const inputRef = useRef<HTMLInputElement>(null);
  const [active, setActive] = useState(-1); // opción resaltada con las flechas
  const picked = useRef(''); // texto que vino de elegir una opción: no vuelve a buscar
  const request = useRef(0); // descarta respuestas viejas
  const [locating, setLocating] = useState(false);

  const resetResults = () => {
    request.current++;
    setResults([]);
    setStatus('idle');
  };

  // Completa lo que falte (barrio, código postal) con la geocodificación inversa del punto.
  // Si el punto cae en la localidad confirmada se respeta esa elección; si el pin se fue a otra, manda la geocodificación inversa.
  const locate = useCallback(async (newLng: number, newLat: number, preset?: Partial<GeoPlace>) => {
    const rev = await reverseGeocode(newLng, newLat);
    const v = valueRef.current;
    const area: GeoArea = { province: v.province, locality: v.locality, center: center.current };
    const inArea = !!v.locality && nearArea(area, newLng, newLat);
    if (!inArea) center.current = [newLng, newLat];
    const patch: Partial<PlaceValue> = {
      lat: Number(newLat.toFixed(6)),
      lng: Number(newLng.toFixed(6)),
      province: inArea ? v.province : PROVINCES.find((p) => norm(p) === norm(rev.province)) ?? v.province,
      locality: inArea ? v.locality : rev.locality || preset?.locality || '',
    };
    const text = { address: preset?.address || rev.address, neighborhood: preset?.neighborhood || rev.neighborhood, postalCode: preset?.postalCode || rev.postalCode };
    for (const [k, t] of Object.entries(text)) if (t) (patch as Record<string, unknown>)[k] = t; // no pisa lo que ya había con un vacío
    onChangeRef.current(patch);
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    const map = new maptilersdk.Map({
      container: mapContainerRef.current,
      style: getMapStyle(theme),
      center: [initialLng, initialLat],
      zoom: DEFAULT_MAP_ZOOM,
      navigationControl: 'bottom-right',
    });
    map.on('styleimagemissing', () => {});

    const accent = getComputedStyle(mapContainerRef.current).getPropertyValue('--ac-h').trim();
    const marker = new maptilersdk.Marker({ draggable: true, ...(accent ? { color: accent } : {}) })
      .setLngLat([initialLng, initialLat])
      .addTo(map);

    marker.on('dragend', () => {
      const p = marker.getLngLat();
      locate(p.lng, p.lat);
    });
    map.on('click', (e) => {
      marker.setLngLat(e.lngLat);
      locate(e.lngLat.lng, e.lngLat.lat);
    });

    mapRef.current = map;
    markerRef.current = marker;
    return () => {
      try {
        marker.remove();
        map.remove();
      } catch {
        // desmontaje seguro
      }
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Sincroniza coordenadas externas (al abrir una sucursal existente)
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;
    if (!lat || !lng || isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) return;
    const cur = markerRef.current.getLngLat();
    if (Math.abs(cur.lat - lat) > 0.0001 || Math.abs(cur.lng - lng) > 0.0001) {
      markerRef.current.setLngLat([lng, lat]);
      mapRef.current.flyTo({ center: [lng, lat], zoom: 15, duration: 800 });
    }
  }, [lat, lng]);

  // Tema del mapa (el primer render ya lo recibe en el constructor)
  const firstTheme = useRef(true);
  useEffect(() => {
    if (firstTheme.current) {
      firstTheme.current = false;
      return;
    }
    try {
      mapRef.current?.setStyle(getMapStyle(theme));
    } catch {
      // se está desmontando
    }
  }, [theme]);

  // ── Provincia y localidad ──
  const changeProvince = (p: string) => {
    setLocText('');
    setLocOpts([]);
    setLocStatus('idle');
    resetResults();
    onChange({ province: p, locality: '' });
  };

  const onLocText = (t: string) => {
    setLocText(t);
    if (locality && norm(t) !== norm(locality)) { // tocó el texto: la localidad deja de estar confirmada
      resetResults();
      onChange({ locality: '' });
    }
  };

  const chooseLocality = (o: GeoArea) => {
    const changed = norm(o.locality) !== norm(locality) || norm(o.province) !== norm(province);
    center.current = o.center;
    setLocText(o.locality);
    setLocOpts([]);
    setLocStatus('idle');
    resetResults();
    markerRef.current?.setLngLat(o.center);
    mapRef.current?.flyTo({ center: o.center, zoom: DEFAULT_MAP_ZOOM, duration: 800 });
    // Otra ciudad = otra dirección: no se arrastran calle, barrio ni código postal de la anterior.
    onChange({ province: o.province, locality: o.locality, lat: o.center[1], lng: o.center[0], ...(changed ? { address: '', neighborhood: '', postalCode: '' } : {}) });
    setQuery('');
    picked.current = '';
  };

  // Localidades de la provincia mientras se escribe ("san nic" → San Nicolás de los Arroyos)
  useEffect(() => {
    const q = locText.trim();
    if (q.length < 2 || (locality && norm(q) === norm(locality))) {
      setLocOpts([]);
      setLocStatus('idle');
      return;
    }
    const id = ++locReq.current;
    const t = setTimeout(async () => {
      try {
        const opts = await searchLocalities(province, q);
        if (id !== locReq.current) return;
        setLocOpts(opts);
        setLocActive(-1);
        setLocStatus(opts.length ? 'idle' : 'empty');
      } catch {
        if (id === locReq.current) { setLocOpts([]); setLocStatus('error'); }
      }
    }, 300);
    return () => clearTimeout(t);
  }, [locText, province, locality]);

  const onLocKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (!locOpts.length) return;
      e.preventDefault();
      setLocActive((i) => (e.key === 'ArrowDown' ? (i + 1) % locOpts.length : (i - 1 + locOpts.length) % locOpts.length));
    } else if (e.key === 'Enter') {
      e.preventDefault(); // el selector vive dentro del formulario de la sucursal: Enter no debe enviarlo
      e.stopPropagation();
      const choice = locOpts[locActive] ?? locOpts[0];
      if (choice) chooseLocality(choice);
    } else if (e.key === 'Escape' && locOpts.length) {
      e.stopPropagation();
      setLocOpts([]);
    }
  };

  // ── Dirección: sugerencias mientras se escribe (con una pausa para no consultar en cada tecla) ──
  useEffect(() => {
    const q = query.trim();
    if (q === picked.current) return;
    if (q.length < 3 || !locality) {
      setResults([]);
      setStatus('idle');
      return;
    }
    const t = setTimeout(async () => {
      const id = ++request.current;
      setStatus('loading');
      const found = await searchAddress(q, { province, locality, center: center.current });
      if (id !== request.current) return;
      setResults(found);
      setActive(-1);
      setStatus(found.length ? 'idle' : 'empty');
    }, 350);
    return () => clearTimeout(t);
  }, [query, province, locality]);

  const pick = (p: GeoPlace) => {
    if (p.kind === 'street') {
      // Solo la calle: se completa el nombre y se sigue escribiendo la altura (no se elige ningún punto todavía)
      picked.current = p.street;
      request.current++;
      setResults([]);
      setStatus('idle');
      setQuery(`${p.street} `);
      inputRef.current?.focus();
      return;
    }
    mapRef.current?.flyTo({ center: [p.lng, p.lat], zoom: 17, duration: 800 });
    markerRef.current?.setLngLat([p.lng, p.lat]);
    picked.current = p.address;
    request.current++;
    setResults([]);
    setStatus('idle');
    setQuery(p.address);
    locate(p.lng, p.lat, p);
  };

  const geolocate = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        mapRef.current?.flyTo({ center: [longitude, latitude], zoom: 16, duration: 800 });
        markerRef.current?.setLngLat([longitude, latitude]);
        locate(longitude, latitude);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (!results.length) return;
      e.preventDefault();
      setActive((i) => (e.key === 'ArrowDown' ? (i + 1) % results.length : (i - 1 + results.length) % results.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      const choice = results[active] ?? results[0];
      if (choice) pick(choice);
    } else if (e.key === 'Escape' && results.length) {
      e.stopPropagation();
      setResults([]);
    }
  };

  const locQ = locText.trim();
  return (
    <div className={`owner bare lp ${className}`}>
      <section className="lpstep" aria-labelledby="lp-step1">
        <h4 className="eyebrow" id="lp-step1">1. Buscá la dirección</h4>
        <div className="g2">
          <Field label="Provincia">
            {(id) => (
              <select id={id} className="sel" value={province} onChange={(e) => changeProvince(e.target.value)}>
                {!PROVINCES.includes(province) && <option value={province}>{province || 'Elegí la provincia'}</option>}
                {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            )}
          </Field>
          <Field label="Ciudad o localidad" error={errors?.locality}>
            {(id, aria) => (
              <input
                id={id}
                className="inp"
                role="combobox"
                aria-expanded={locOpts.length > 0}
                aria-controls={locListId}
                aria-activedescendant={locActive >= 0 ? `${locListId}-${locActive}` : undefined}
                aria-autocomplete="list"
                autoComplete="off"
                spellCheck={false}
                placeholder="Ej. Rosario"
                value={locText}
                onChange={(e) => onLocText(e.target.value)}
                onKeyDown={onLocKey}
                {...aria}
              />
            )}
          </Field>
        </div>

        {locStatus === 'empty' && <p className="ctx" role="status">No encontramos “{locQ}” en {province}. Revisá el nombre o la provincia.</p>}
        {locStatus === 'error' && <p className="ctx" role="status">No pudimos consultar las localidades. Revisá tu conexión e intentá de nuevo.</p>}
        {locOpts.length > 0 && (
          <ul className="optlist" id={locListId} role="listbox" aria-label="Localidades encontradas">
            {locOpts.map((o, i) => (
              <li key={`${o.locality}-${o.detail}`}>
                <button type="button" id={`${locListId}-${i}`} role="option" aria-selected={i === locActive} className="opt" onClick={() => chooseLocality(o)}>
                  <MapPin className="i" aria-hidden="true" />
                  <span className="grow">{o.locality}<small>{o.detail}</small></span>
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="lpbar">
          <div className="search">
            <Search className="i" aria-hidden="true" />
            <input
              type="text"
              className="inp"
              role="combobox"
              aria-label="Calle y altura a buscar"
              aria-expanded={results.length > 0}
              aria-controls="lp-results"
              aria-activedescendant={active >= 0 ? `lp-opt-${active}` : undefined}
              aria-autocomplete="list"
              placeholder={locality ? 'Buscar calle y altura' : 'Elegí primero la ciudad'}
              autoComplete="off"
              spellCheck={false}
              disabled={!locality}
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKey}
            />
          </div>
          <button type="button" className="icon-btn" data-tip="Usar mi ubicación" aria-label="Usar mi ubicación" onClick={geolocate} disabled={locating}>
            <Locate className={`i${locating ? ' spin' : ''}`} />
          </button>
        </div>

        {status === 'loading' && <p className="ctx" role="status">Buscando…</p>}
        {status === 'empty' && (
          <p className="ctx" role="status">
            No encontramos esa dirección en {locality}. Revisá la calle y la altura, marcá el punto en el mapa o escribila en el paso 3.
          </p>
        )}

        {results.length > 0 && (
          <ul className="optlist" id="lp-results" role="listbox" aria-label="Direcciones encontradas">
            {results.map((p, i) => (
              <li key={`${p.lat},${p.lng},${i}`}>
                <button type="button" id={`lp-opt-${i}`} role="option" aria-selected={i === active} className="opt" onClick={() => pick(p)}>
                  {p.kind === 'street' ? <Route className="i" aria-hidden="true" /> : <MapPin className="i" aria-hidden="true" />}
                  <span className="grow">
                    {p.address}
                    <small>{p.kind === 'street' ? 'Calle · escribí la altura' : [p.locality, p.province].filter(Boolean).join(', ')}</small>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="lpstep" aria-labelledby="lp-step2">
        <h4 className="eyebrow" id="lp-step2">2. Confirmá el punto en el mapa</h4>
        <div className="lpmap" aria-label="Mapa para ubicar la cochera">
          <div ref={mapContainerRef} className="lpcanvas" />
        </div>
        <div className="lpfoot">
          <span><MapPin className="i sm" aria-hidden="true" />{lat && lng ? `${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}` : 'Sin fijar'}</span>
          <span>Arrastrá el pin hasta la entrada del local</span>
        </div>
      </section>

      <section className="lpstep" aria-labelledby="lp-step3">
        <h4 className="eyebrow" id="lp-step3">3. Revisá los datos</h4>
        <Input label="Calle y altura" placeholder="Ej. Av. Pellegrini 1540" autoComplete="off" value={value.address} onChange={(e) => onChange({ address: e.target.value })} error={errors?.address} />
        <div className="g2">
          <Input label="Barrio o zona (opcional)" placeholder="Ej. Centro, Pichincha" hint="Es lo que los clientes buscan en el mapa." value={value.neighborhood} onChange={(e) => onChange({ neighborhood: e.target.value })} />
          <Input label="Código postal" placeholder="2000 o S2000ABC" maxLength={8} autoCapitalize="characters" autoComplete="postal-code" value={value.postalCode} onChange={(e) => onChange({ postalCode: e.target.value })} error={errors?.postalCode} />
        </div>
      </section>
    </div>
  );
}
