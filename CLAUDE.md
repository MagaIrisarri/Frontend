# Frontend — reglas de formato

Hay **un solo sistema de interfaz** para toda la app, no un estilo por pantalla. Su fuente de verdad visual es el prototipo `docs/owner/prototipo-owner.html` (se abre directo en el navegador; no necesita servidor ni datos), portado a `src/styles/owner.scss` con alcance `.owner`. Home y los paneles del cliente usan ese mismo sistema; lo que el prototipo no trae vive en `src/styles/ui.scss` (componentes compartidos) y lo propio del mapa en `src/styles/home.scss`. Si hay dudas, se abre el prototipo y se copia lo que hace. Las reglas de negocio y las limitaciones del dueño están en `docs/owner/owner-turnos-notas.md`.

## Estándar de interfaz (rige para toda pantalla nueva o migrada)

- **Un sistema, tres archivos**: `owner.scss` (prototipo, no se le agrega nada que no esté en él), `ui.scss` (componentes compartidos: tarjetas y filas de lista, opciones elegibles, resumen de costo, panel lateral con navegación, 44 px en móvil) y `home.scss` (solo mapa y barra flotante de Home). **Prohibido crear un `.scss` por pantalla**: si falta algo, se agrega a `ui.scss` con un nombre genérico y se reutiliza.
- **Alcance**: todo se monta dentro de `<OwnerShell>` (`bare` cuando va sobre otra pantalla). `OwnerShell` importa `owner.scss` y `ui.scss`, así que cualquier panel o modal que lo use ya tiene los estilos.
- **Qué componente usar**: listas, formularios y flujos por pasos → `Drawer` (`components/Owner/ui/Layer.tsx`; `left` para navegación, `onBack` para volver dentro del mismo panel, `size="md"` (680 px) para formularios largos con mapa, `wide` para tablas); confirmaciones → `ConfirmModal` (`danger` si destruye, `busy` mientras corre); avisos → `useToast`. **Todo `Drawer` y `ConfirmModal` anima la entrada y la salida**: va dentro de `Presence` (si lo controla un booleano) o de `Shown` (si se monta con un valor, p. ej. `<Shown when={empleado}>{e => <Panel e={e} />}</Shown>`, que conserva el último valor mientras dura la salida); nunca `x && <Drawer/>`, que lo desmonta sin animar (`check-standard` lo falla). Un panel **no abre otro**: las acciones (alta, edición, siguiente paso) cambian la vista dentro del mismo panel. Nunca un modal hecho a mano (`fixed inset-0`), nunca `alert()`/`confirm()`.
- **Pantallas del cliente son paneles de Home**, no páginas: Favoritos, Mis reservas, Mis vehículos (lista, alta y edición), Facturación y pagos, Notificaciones, Ayuda, Acceso (iniciar sesión / crear cuenta), Reserva por pasos y Mi perfil. Las rutas `/reservations`, `/vehicles`, `/vehicles/new`, `/vehicles/:id/edit` e `/invoices` solo abren Home con el panel puesto (`useHomePage`) y al cerrarlo vuelven a `/`. **No existe la página Mi perfil ni `/profile`**: es el panel `ProfileDrawer` (`useOpenProfile()`).
- **Íconos de vehículo**: los del dueño, desde `components/Owner/ui/vehicles.ts` (`VICON[AUTO|MOTO|CAMIONETA]`, `vehicleKey()`); nombres, capacidades y plazas libres desde la tabla `VT` de `owner.lib.ts`. No se importan `Car`/`Bike`/`Truck` de lucide en pantallas migradas (el chequeo lo marca).
- **Filtros**: toda lista filtrable usa `FilterBar` (`components/Owner/ui/FilterBar.tsx`: búsqueda opcional, controles `.seg` / `select.sel` y "Limpiar filtros" cuando hay algo aplicado). Si no queda nada, el estado "sin resultados" repite la acción. Períodos con `utils/period.ts`. Toda búsqueda de texto usa `matchesQuery` (`utils/search.ts`: sin tildes ni mayúsculas y todas las palabras); las cocheras se buscan por nombre, dirección, **barrio** (`neighborhood`, p. ej. Centro), localidad y **provincia**: la localidad es la ciudad, el barrio es lo que la gente escribe. El texto filtra y el mapa se encuadra sobre los resultados; si el cliente mueve o acerca el mapa a mano aparece **"Buscar en esta zona"** (`MapView` → `mapArea` en `useHomePage`), que limita el listado a lo visible sin volver a encuadrar; escribir en el buscador o "Limpiar filtros" descarta la zona. Hoy: listado de cocheras (orden y precio máximo; afectan también al mapa), Mis reservas (texto, estado, período) y Facturación (texto, estado de pago, período).
- **Píldora del mapa** (`MapView.tsx`, estilos `.pin` en `home.scss`): con vehículo elegido muestra su ícono y su tarifa; sin vehículo, "desde" el menor precio; "Completo" y "Sin tarifa" se dicen con texto, no solo con color.
- **Direcciones** (patrón de Baymard, Google Places, Airbnb y Uber): un solo buscador con sugerencias **mientras se escribe**, sin botón "Buscar"; elegir una sugerencia completa los datos y mueve el pin; el pin se arrastra para confirmar el punto. Tres pasos numerados a la vista: 1 Buscá la dirección (**Provincia** y **Ciudad o localidad** arriba, y debajo la calle y altura), 2 Confirmá el punto en el mapa, 3 Revisá los datos. **La localidad no se escribe libre: se elige de la lista** (`searchLocalities`, Georef `localidades-censales` de esa provincia; el departamento desambigua homónimas), así no existe "Rosario, Chaco"; tocar el texto la des-confirma y, mientras no esté confirmada, la búsqueda de calles está deshabilitada y el alta no se guarda. Cambiar de provincia o de ciudad vacía calle, barrio y código postal. **Nada de datos escondidos**: calle y altura, barrio y código postal están siempre visibles y editables en el paso 3 (como en un checkout); no hay "Corregir a mano" ni "No encuentro mi dirección". `LocationPicker` recibe un `PlaceValue` (provincia, localidad, barrio, calle, código postal, punto) y devuelve parches `onChange`; es el único lugar donde se editan, no se agregan campos sueltos de dirección a otros formularios. Geocodificación en `services/geocoding.ts`: Georef (API oficial de Argentina, resuelve calle y altura), MapTiler (autocompleta; el barrio solo si lo conoce) y OpenStreetMap solo para la geocodificación inversa de respaldo; para toda Argentina pero cada búsqueda acotada a la provincia y localidad elegidas (Georef `provincia` + `localidad_censal`; MapTiler por cercanía al centroide, ~30 km) y rankeado con las que tienen la altura primero. Cada sugerencia tiene dos líneas (como Google Maps, Uber y Cabify): la dirección con altura en negrita y debajo "localidad, provincia". Con altura escrita solo se ofrecen direcciones reales con esa altura, sin calles sueltas ni repetidas; sin altura se ofrecen calles ("Calle · escribí la altura") que completan el nombre y no ubican nada. Georef se consulta siempre con `aplanar=true` (sin eso la ubicación llega anidada y se pierde). Teclado: flechas, Enter y Escape (en las dos listas).
- **Plazas**: la capacidad de cada tipo crea esas plazas con código correlativo (A-01…, M-01…, C-01…); el formulario de sucursal no trae cantidades precargadas.
- **Tailwind**: solo utilidades de layout (`relative`, `absolute`, `inset-0`, `w-full`, `h-screen`, `overflow-hidden`, `z-*`). Nada de colores, radios, sombras, tipografía ni `dark:` de Tailwind en pantallas migradas; el tema sale de los tokens.
- **Móvil/tablet**: los paneles ocupan todo el ancho y los controles miden 44 px bajo 720 px (regla de `ui.scss` para todo lo que monta `OwnerShell bare`); en escritorio miden 34 px.
- **Pantallas pendientes de migrar** (siguen en Tailwind, no copiar su estilo): `/parkings/:id/reservar` (mapa de plazas), `/my-parkings/:id/spaces` (plazas) y `/parkings/:id/metrics`; el listado, el alta y la edición de sucursales viven solo en `/owner`. Al migrar una, se agrega a `scripts/standard.json`.

## Arnés de verificación (`pnpm verify`)

Cada paso de una migración se cierra con `pnpm verify`; si falla, el paso no está terminado. Corre, en orden y cortando en el primer error:

1. `scripts/check-standard.mjs` — recorre las pantallas listadas en `scripts/standard.json` y falla ante colores/radios/sombras/tipografía de Tailwind, `dark:`, hex sueltos, `fixed inset-0`, `alert/confirm/prompt`, clases de animación sin plugin; verifica que `/profile` no exista y que las rutas de panel rendericen `<HomePage />`.
2. `pnpm build` — tipos (`tsc --noEmit`) y bundle.
3. e2e de Playwright (`e2e/`, local y sin versionar; se omite si la carpeta no existe). `pnpm verify --fast` los omite.

Regla de trabajo: una pantalla migrada se agrega a `scripts/standard.json` **en el mismo paso** y lleva su prueba e2e; un archivo borrado se quita del manifiesto (el chequeo falla si lista uno que no existe).

## Cómo está armado

- Rutas del dueño bajo `/owner` (`src/pages/Owner/OwnerLayout.tsx`): Panel, Reservas, Tarifas, Servicios, Personal, Turnos. Los datos compartidos viven en `OwnerContext` (`useOwner()`); cada vista llama `refresh()` después de guardar.
- Componentes del prototipo en `src/components/Owner/ui/`: `Drawer` y `ConfirmModal` (`Layer.tsx`), `Menu`, `Field`/`Input`/`Password`, `Toasts` (`useToast`), `PageHead`/`Empty`/`ErrorBox`/`SkeletonRows` (`Page.tsx`), `OwnerShell`. Se reutilizan; no se crean variantes. `components/Shared/ConfirmDialog` es un envoltorio de `ConfirmModal` para las pantallas aún no migradas.
- Lógica sin React en `src/pages/Owner/owner.lib.ts`.
- "Mi perfil" no es una página: es el panel lateral `ProfileDrawer`, que se abre con `useOpenProfile()` (`src/context/ProfileContext.tsx`) desde cualquier pantalla (menú de cuenta de Home y del panel del dueño). No volver a crear una ruta `/profile`; las pantallas que antes volvían ahí vuelven al mapa (`/`).
- Paneles del cliente en Home (`components/Home/HomeModalManager.tsx`): `FavoritesDrawer`, `ReservationsDrawer`, `VehiclesDrawer`, `InvoicesDrawer`, `NotificationsDrawer`, `AuthDrawer`, `ReservationBookingDrawer`, `SupportModal` (un `Drawer`). El estado de cuál está abierto vive en `src/hooks/useHomePage.ts`.
- **No** poner un `owner.html` en la raíz de `Frontend/`: el servidor de desarrollo lo sirve en `/owner` y tapa la app. Por eso el prototipo vive en `docs/owner/` con otro nombre.

## Estilos

- Clases del prototipo (`.panel`, `.btn`, `.btn.pri`, `.icon-btn`, `.tbl`, `.seg`, `.st`, `.fs`, `.drawer`, `.toast`…) y de `ui.scss` (`.pcard`, `.rcard`, `.opt`, `.grid2`, `.tag.mute`…), no Tailwind, dentro de `.owner`. El tema sale de la clase `.light` / `.dark` que `ThemeContext` pone en `<html>`.
- Colores solo con tokens (`var(--ac)`, `--surface`, `--raised`, `--hover`, `--line`, `--soft`, `--tx`, `--tx2`, `--tx3`, `--ok`, `--warn`, `--err`). Nada de hex sueltos. Radios `--r-sm/md/lg`, alto de control `--ctl` (34 px).
- Fuente Geist, 14 px, números tabulares. Íconos de `lucide-react` con la clase `i` (16 px) o `i sm` (14 px). Estado en color + ícono + texto, nunca solo color.
- Estados de estado: `st ok` (verde), `st warn` (ámbar), `st mute` (gris), `st ac` (azul). Barras de ocupación `bar-t` con `warn` desde 90 % y `err` al 100 %.
- Responsive: tablas pasan a tarjetas con `data-label`; el cajón ocupa todo el ancho en móvil.

## Patrones de pantalla

- Encabezado con `PageHead` (eyebrow opcional, título, subtítulo, acción a la derecha). Un solo botón primario (`btn pri`) por zona.
- Toda lista tiene los cuatro estados: carga (`SkeletonRows`), error (`ErrorBox` con "Reintentar"), vacío (`Empty` con una acción) y sin resultados (con "Limpiar filtros").
- Altas y ediciones en `Drawer` (formulario `dbody`, pie `dfoot` con "Cancelar" y el botón primario, secciones `fs`); confirmaciones destructivas en `ConfirmModal` con `danger`. Nunca `alert()` ni `confirm()` del navegador.
- Edición en línea para precios (input con `$`, Enter guarda, Escape cancela).
- Avisos con `useToast`: `ok` para éxito, `info` para neutro, `err` para error. Las acciones reversibles ofrecen "Deshacer".
- Menús contextuales con `Menu` (`⋯`), separados por `sep`, acciones destructivas con `danger`.

## Accesibilidad (no negociable)

- Todo botón de solo ícono lleva `aria-label`; los tooltips usan `data-tip`.
- Campos con etiqueta, `aria-invalid` y error en `role="alert"` ligado por `aria-describedby` (`Field` ya lo hace).
- Capas con foco inicial, Escape que cierra solo la de arriba y foco devuelto al abridor (`Layer.tsx`).
- Tablas con `aria-sort` en encabezados ordenables; calendario operable con teclado (flechas mueven, Suprimir quita).
- Respetar `prefers-reduced-motion` (ya está en `owner.scss`).

## Texto

- Español rioplatense, voseo y tono directo: "Revisá los campos marcados.", "Ingresá el nombre…", "Reasignalas desde Reservas".
- Errores dicen qué pasó y qué hacer. Mensajes de éxito nombran el objeto: "Sucursal “X” creada con 40 plazas. Falta cargar sus tarifas."
- Plurales con `plural(n, 'uno', 'varios')`; dinero con `money()` (`$1.800`, es-AR); horas `HH:mm`; fechas con `fmtD`.

## Convenciones de código

- Atajos y deuda: `// shortcut: L-xx, <límite>, <cuándo mejorar>`. `grep -rn "shortcut:"` debe coincidir con las filas abiertas de `docs/owner/owner-turnos-notas.md`.
- Códigos de las notas: **R-** reglas de negocio, **L-** limitaciones, **D-** decisiones. Al resolver uno, se actualiza su estado en las notas con el hash del commit. Los mensajes de commit citan los códigos (`feat: turnos — R-02, R-03, R-04`).
- Las reglas de negocio se validan en el backend; el frontend solo las anticipa (L-05).
- Las pruebas (`tests/`, `e2e/`, `playwright.config.ts`) no se versionan: son locales; el arnés (`scripts/verify.mjs`, `check-standard.mjs`, `standard.json`) sí. Todo cambio visible se compara con la misma pantalla del prototipo y se cierra con `pnpm verify`.
- Pruebas desactualizadas: cuando un cambio modifica a propósito un comportamiento (etiqueta, regla, ruta o permiso), las pruebas que lo cubren se actualizan en el mismo paso; no se deja una prueba que verifique lo anterior. Como no se versionan, cada uno tiene su copia: después de mergear la rama de otro, se corre `pnpm verify` completo (con e2e) y, ante cada fallo, se decide si es una regresión (se arregla el código) o una prueba vieja (se actualiza a la regla nueva, citando su código: R-18, etc.). Nunca se borra ni se saltea una prueba para que pase.
