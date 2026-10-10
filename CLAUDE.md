# Frontend — reglas de formato

La fuente de verdad visual del rol dueño es el prototipo `docs/owner/prototipo-owner.html` (se abre directo en el navegador; no necesita servidor ni datos). Su CSS está portado a `src/styles/owner.scss`, con alcance `.owner`. Todo lo nuevo del rol dueño se ve y se comporta como ese prototipo. Si hay dudas, se abre el prototipo y se copia lo que hace. Las reglas de negocio y las limitaciones están en `docs/owner/owner-turnos-notas.md`.

## Cómo está armado

- Rutas del dueño bajo `/owner` (`src/pages/Owner/OwnerLayout.tsx`): Panel, Reservas, Tarifas, Servicios, Personal, Turnos. Los datos compartidos viven en `OwnerContext` (`useOwner()`); cada vista llama `refresh()` después de guardar.
- Componentes del prototipo en `src/components/Owner/ui/`: `Drawer` y `ConfirmModal` (`Layer.tsx`), `Menu`, `Field`/`Input`/`Password`, `Toasts` (`useToast`), `PageHead`/`Empty`/`ErrorBox`/`SkeletonRows` (`Page.tsx`), `OwnerShell`. Se reutilizan; no se crean variantes.
- Lógica sin React en `src/pages/Owner/owner.lib.ts`.
- "Mi perfil" no es una página: es el panel lateral `ProfileDrawer`, que se abre con `useOpenProfile()` (`src/context/ProfileContext.tsx`) desde cualquier pantalla (menú de cuenta de Home y del panel del dueño). No volver a crear una ruta `/profile`; las pantallas que antes volvían ahí vuelven al mapa (`/`).
- **No** poner un `owner.html` en la raíz de `Frontend/`: el servidor de desarrollo lo sirve en `/owner` y tapa la app. Por eso el prototipo vive en `docs/owner/` con otro nombre.

## Estilos

- Clases del prototipo (`.panel`, `.btn`, `.btn.pri`, `.icon-btn`, `.tbl`, `.seg`, `.st`, `.fs`, `.drawer`, `.toast`…), no Tailwind, dentro de `.owner`. El tema sale de la clase `.light` / `.dark` que `ThemeContext` pone en `<html>`.
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
- Las pruebas (`tests/`, `e2e/`, `playwright.config.ts`) no se versionan: son locales. Todo cambio visible del dueño se compara con la misma pantalla del prototipo.
