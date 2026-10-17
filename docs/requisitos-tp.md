# Requisitos de la cátedra — TP DSW, instanciados para Estacionamiento COM 301

Qué pide la cátedra, aplicado a este proyecto (4 integrantes, Backend y Frontend separados), con el estado de cada punto. Es parte del arnés: los `CLAUDE.md` de los dos repos apuntan acá.

- **Revisado el 2026-10-16:** `main` (Backend, `8971f3b`, PR [MagaIrisarri/Backend#10](https://github.com/MagaIrisarri/Backend/pull/10)) y `master` (Frontend, `57d2e5b`, PR [MagaIrisarri/Frontend#14](https://github.com/MagaIrisarri/Frontend/pull/14)), con las ramas prueba-valen-* mergeadas. Se corrieron las pruebas de la cátedra y las e2e locales (53/53).
- **No repite** [revision-alcance.md](revision-alcance.md), que tiene cada CRUD, listado y CUU del proposal con su evidencia. Acá van los requisitos técnicos, las reglas de la FAQ, las entregas, la documentación, la gestión y la guía de estilo.
- Al cerrar una fila, se actualiza su estado con el hash del commit, como en las notas del dueño.

## Resumen

- **Regularidad:** lo técnico cumple (mobile-first y la pantalla de TipoVehículo, Frontend `82162df`). Lo funcional cumple (revision-alcance.md), también la regla de la FAQ del detalle que pide datos al backend. La regularidad está completa, con los PR [MagaIrisarri/Backend#10](https://github.com/MagaIrisarri/Backend/pull/10) y [MagaIrisarri/Frontend#14](https://github.com/MagaIrisarri/Frontend/pull/14).
- **Aprobación directa:** la autenticación con rutas protegidas ya está (JWT, Backend `a183668`, Frontend `82162df`). Los tests de la cátedra están en `tests-catedra/` de cada repo: 5 unitarias y 1 de integración del backend, 1 de componente y 1 e2e del frontend. La evidencia está en `Backend/docs/tests.md`. Faltan la documentación de la API, el deploy y el video.

## Fuentes

| Fuente | Qué se toma |
|---|---|
| [proposal.md](https://github.com/MagaIrisarri/TPDSW/blob/main/proposal.md) | Grupo, tema, modelo y alcance (regularidad, aprobación y voluntario) |
| [utnfrrodsw/tp](https://github.com/utnfrrodsw/tp) | Requisitos técnicos (3.1), funcionales (3.2), entregas (3.3), documentación (3.4), gestión (4) y evaluación (5) |
| [docs.md](https://github.com/utnfrrodsw/tp/blob/main/docs.md) | Formato y contenido mínimo de la documentación |
| [FAQ.md](https://github.com/utnfrrodsw/tp/blob/main/FAQ.md) | Definiciones (CRUD simple y dependiente, detalle, CUU), base de datos, repositorio y grupos |
| [desarrollo-de-software](https://github.com/utnfrrodsw/desarrollo-de-software) | Puntajes de regularidad y aprobación, fechas |
| [airbnb/javascript](https://github.com/airbnb/javascript) | Guía de estilo sugerida (3.1.2) |
| [gitlabhq](https://github.com/gitlabhq) | GitLab: la cátedra acepta GitHub o GitLab (sección 3, punto 5). El grupo usa GitHub, así que donde dice MR se lee PR |

## El TP para este grupo

- **4 integrantes** (ver proposal), comisión 301. Repos: [Backend](https://github.com/MagaIrisarri/Backend) (`main`) y [Frontend](https://github.com/MagaIrisarri/Frontend) (`master`).
- **El Backend y el Frontend se califican por separado.** Regularidad: 40 + 40 de 150 puntos, junto con la PoC (30) y el parcial (40). Aprobación directa: 35 + 35 de 100, con el parcial (30). En los dos casos hace falta el 60 %. Lo que falta de un lado baja la nota de ese lado.
- **Mínimos funcionales con 4 integrantes** (3.2):
  - Regularidad: 4 CRUD simples, 2 CRUD dependientes, 2 listados con filtro y detalle, 2 CUU o epics.
  - Aprobación: CRUD de todas las clases de negocio y 4 CUU (uno por integrante), con al menos 2 relacionados: lo que registra uno es entrada del otro.
  - El proposal llega a esos números (4, 2, 2 y 2; 9 CRUD y 4 CUU).
- **Fechas 2026:**
  - Primera entrega de regularidad o AD: del 12/10 al 16/10 (**esta semana**).
  - Primer globalizador y recuperatorio: del 26/10 al 30/10.
  - Segundo globalizador y recuperatorio: del 9/11 al 13/11 (el repo de la cátedra lo fecha en 2025; el del TP no dice año).
  - La defensa del TP es antes del 13/11.
  - La entrega de aprobación va por el form https://kutt.to/DSWEntregaSistemaFinal.

## Requisitos técnicos — Backend (3.1.1)

| Etapa | Requisito | Estado | Evidencia | Qué falta |
|---|---|---|---|---|
| Reg. | Desarrollarse en JavaScript | Cumple | TypeScript compilado a JS (`pnpm build`); el material de la cátedra ([material-be](https://github.com/utnfrrodsw/material-be)) también usa TypeScript | — |
| Reg. | Framework web extensible con middlewares | Cumple | Express 5: `cors`, `express.json`, `RequestContext`, `validateSchema` por ruta y `errorHandler` | — |
| Reg. | API web | Cumple | REST bajo `/api/*` | — |
| Reg. | Base persistente como servicio externo, no embebida | Cumple | MySQL 8 por red (`DB_HOST`, `DB_PORT`) | La FAQ pide además que no requiera correr en local: el deploy necesita un MySQL hospedado |
| Reg. | Persistencia con ORM | Cumple | MikroORM 7 (`*.Entity.ts`) | — |
| Reg. | Capas | Cumple | Route → Controller → Service → Repository en cada módulo | — |
| Reg. | Validar entradas e informar errores por la API | Cumple | zod con `validateSchema`; `AppError` y `errorHandler` (409 por datos únicos, 500 sin stack en producción) | — |
| Reg. | Dependencias de ejecución, desarrollo y test registradas | Cumple | `package.json` y `pnpm-lock.yaml`; `tsx` corre las pruebas | `pnpm test` (unitarias) y `pnpm test:integration` (con `DB_NAME=<base>_test`) |
| Apr. | 1 test automatizado por integrante (4) | Cumple | 5 unitarias sin base en `Backend/tests-catedra/unit/`: `Schedule.test.ts` (turnos), `billing.test.ts` (cobro de la salida: mínimo 1 h, gracia de 10 min y horas extra, R-14), `vehicleTypes.test.ts` (tipo base y prefijo de plaza), `plate.test.ts` (patente y año) y `search.test.ts` (nombres y búsqueda). `pnpm test` | Repartir la autoría: un integrante por archivo |
| Apr. | 1 test de integración | Cumple | `Backend/tests-catedra/integration/Reservation.db.test.ts`: reserva, ingreso, extender, servicios y salida con factura contra MySQL. `DB_NAME=<base>_test pnpm test:integration` | |
| Apr. | Login con autenticación propia o de terceros, con 2 niveles de acceso o más | Cumple (Backend `a183668`, Frontend `82162df`) | `POST /api/users/login` verifica la contraseña (argon2) y devuelve un JWT firmado con `JWT_SECRET`, vigente 8 h (`signToken` en `src/Shared/middlewares/auth.ts`). 4 roles. El frontend lo manda en `Authorization: Bearer` desde una sola instancia de axios (`src/services/api.ts`) | — |
| Apr. | Proteger las rutas según el nivel de acceso | Cumple (Backend `a183668`, Frontend `82162df`) | `auth(...roles)` en cada ruta protegida: 401 sin token o con uno inválido o de un usuario dado de baja, 403 con otro rol. `self(campo)` exige que el id del propio usuario en la ruta o el body sea el del token, salvo el administrador. Pertenencia (L-37): `ownParking`, `ownVehicle`, `ownReservation` y `staffOfInvoice` exigen que la cochera, el vehículo, la reserva o la factura sean del usuario. Públicas: registro, login y las lecturas del mapa. Lo prueban `src/Shared/middlewares/auth.db.test.ts` (token vencido, adulterado y de un usuario dado de baja) y `e2e/audit.api.spec.ts` (test 26), las dos locales | — |
| Apr. | Ambientes (environment del framework o `.env`) | Cumple, con matiz | Variables de entorno con valores por defecto y `NODE_ENV`, documentadas en el README de `main` | No hay `.env.example` ni se carga un `.env` (Node 22 lo trae con `--env-file`) |

## Requisitos técnicos — Frontend (3.1.2)

| Etapa | Requisito | Estado | Evidencia | Qué falta |
|---|---|---|---|---|
| Reg. | Framework de frontend | Cumple | React 19 con Vite | — |
| Reg. | HTML5 | Cumple | — | — |
| Reg. | CSS según una biblioteca, guía o framework | Cumple | SCSS con un solo sistema de interfaz, y Tailwind solo para layout ([CLAUDE.md](../CLAUDE.md)) | — |
| Reg. | Mobile-first | Cumple (Frontend `82162df`) | Los estilos base son los del teléfono y MD/LG se agregan con `min-width` ([_breakpoints.scss](../src/styles/_breakpoints.scss), `base.scss`, `ui.scss`, `home.scss` e `index.css`). `check-standard` rechaza `max-width` en una media query. Se comparó el estilo calculado de 35 pantallas en 7 anchos y en táctil, antes y después: no cambia nada visible, salvo la fila de total del resumen mensual, que en escritorio quedaba apretada en la primera columna (choque con `.tot` de `ui.scss`) y ahora es una fila de tabla | — |
| Reg. | 3 cortes: SM, MD y LG | Cumple | `src/styles/_breakpoints.scss` (720 y 1000 px) | — |
| Reg. | UX/UI que no requiera manual | Cumple | Reglas de interfaz en `CLAUDE.md`; se juzga en la defensa | — |
| Reg. | Eventos, errores amigables, reactividad, input y output property | Cumple | Por ejemplo, `LocationPicker` recibe un `PlaceValue` (input) y devuelve `onChange` (output); los errores se muestran con `useToast` y `ErrorBox` | — |
| Reg. | Al menos un servicio | Cumple | `src/services/*.service.ts` | — |
| Reg. | Modelos con clases, interfaces o tipos propios | Cumple | `src/types/*.types.ts` | — |
| Reg. | Patrón de diseño OO, si es posible | Sin relevar | — | Es opcional |
| Reg. | Dependencias de ejecución, desarrollo y test registradas | Cumple | `package.json`: `@playwright/test`, `vitest`, `@testing-library/react`, `@testing-library/dom` y `jsdom` | |
| Apr. | 1 test unitario de un componente | Cumple | `tests-catedra/unit/Pager.test.tsx` (Vitest y Testing Library): rango visible, anterior y siguiente, bordes, estado ocupado y sin paginador con una sola página. `pnpm test` | |
| Apr. | 1 test end-to-end | Cumple | `tests-catedra/e2e/search.spec.ts` con `playwright.config.ts`: abre la app en el navegador, busca por ciudad o barrio, filtra el listado y encuadra el mapa, con la API simulada dentro de la spec. `pnpm test:e2e` | Las 16 specs de `tests/e2e/` siguen locales |
| Apr. | Login y acceso según el nivel de usuario | Cumple | `ProtectedRoute allowedRoles` en [App.tsx](../src/App.tsx): CLIENTE, DUEÑO, EMPLEADO y ADMINISTRADOR | Protege la navegación; el backend controla lo mismo en cada ruta (ver la tabla anterior) |
| Apr. | Ambientes | Cumple, con matiz | `.env` con `VITE_API_URL` y `VITE_MAPTILER_API_KEY` | El `.env` está versionado (en `master`) aunque `.gitignore` lo excluye, y no hay `.env.example`. La key de MapTiler es de navegador: conviene restringirla por dominio |

## Requisitos funcionales: lo que agrega la FAQ

El estado de cada CRUD, listado y CUU está en revision-alcance.md (todo cumple). La FAQ fija reglas que esa revisión no mira:

| Regla | Estado | Evidencia | Qué falta |
|---|---|---|---|
| El detalle de un listado pide datos al backend y muestra al menos 2 clases de negocio, o lleva al CRUD | Cumple | Estacionamientos: [ParkingSpaceMap.tsx](../src/pages/ParkingSpace/ParkingSpaceMap.tsx) pide la cochera, las plazas y la disponibilidad. Reservas por fecha: el panel de [OwnerReservations.tsx](../src/pages/Owner/OwnerReservations.tsx) pide `GET /api/reservations/:id` al abrirse (reserva, cliente, vehículo, plaza, empleados y factura, en cualquier estado). (Backend `b9ed4f9`, Frontend `1ddad85`) | — |
| Los CRUD mínimos se usan desde la app (front y back) | Cumple (Frontend `82162df`) | TipoVehículo, CRUD simple de regularidad, tiene pantalla en el panel del administrador: [AdminVehicleTypes.tsx](../src/pages/Admin/AdminVehicleTypes.tsx) (`/admin/vehicle-types`, RA-11 en [admin-permisos-notas.md](admin/admin-permisos-notas.md)) | — |
| Al menos 2 CUU relacionados | Cumple | Reservar → registrar el ingreso (check-in) → registrar el uso de servicios → facturar: cada uno usa lo que registró el anterior. Sin confirmación de reservas desde D-10 (Backend `aa56d66`, Frontend `66e80c5`): el proposal todavía nombra "Registrar confirmación de reserva" y hay que cambiarlo por "Registrar check-in" | — |

## Entregas y documentación (3.3, 3.4 y docs.md)

**Formato:**
- Una carpeta `docs/` en la raíz de cada repo, con `docs/README.md` como entrada, enlazado desde el README del proyecto.
- Los textos van en markdown, y los diagramas en Mermaid o como imágenes que GitHub muestre.
- PDF solo para lo que una herramienta no exporta a markdown. No se aceptan `.doc`, `.odt`, `.rtf` ni `.txt`.

| Entregable | Reg. | Apr. | Estado | Qué falta |
|---|:-:|:-:|---|---|
| `docs/README.md` enlazado desde el README | X | X | Backend: en `main` [MagaIrisarri/Backend#9](https://github.com/MagaIrisarri/Backend/pull/10). Frontend: en `master` [MagaIrisarri/Frontend#13](https://github.com/MagaIrisarri/Frontend/pull/14) | — |
| README con instalación y ejecución por scripts | X | X | Cumple en `main` y en `master` | — |
| Proposal actualizada con los links a los PR | X | X | Cumple: el proposal enlaza los repos y los PR | — |
| Links a los PR/MR en la documentación | X | X | Cumple: los `docs/README.md` enlazan los PR concretos | — |
| Minutas de reunión y avance | X | X | Cumple: 8 minutas, del 18/04 al 14/10, en el `docs/README.md` del Backend | — |
| Seguimiento de features, bugs e issues | X | X | Cumple: tablero de Notion enlazado en el `docs/README.md` del Backend | — |
| Documentación de la API | | X | No hay (ni OpenAPI ni un listado de endpoints) | Documentar los endpoints |
| Evidencia de los tests automáticos | | X | [Backend `docs/tests.md`](https://github.com/MagaIrisarri/Backend/blob/main/docs/tests.md): tabla con autor, comandos y la salida de las 4 corridas (16/10/2026) | — |
| Video de demostración | | X | No hay. Solo para la aprobación directa | Grabarlo |
| Deploy, con links y credenciales | TBD | X | No hay configuración de deploy | Deploy con un MySQL hospedado. Las credenciales pueden ser las de la siembra (`password123`) |
| Contacto para coordinar la defensa | | X | — | Va en el form |

**Repositorio:** la FAQ pide crear el repo como fork de `utnfrrodsw/tp` y entregar por PR/MR. `TPDSW` no es un fork y no hay ningún PR a `utnfrrodsw/tp`, pero 3.3 dice que se entrega por el form. Confirmado con el docente (16/10/2026): se entrega por el formulario, sin fork.

## Gestión y evaluación (4 y 5)

- **Gestión** (la cátedra la marca "en revisión"): pide declarar una metodología ágil (Scrum, XP u otra), minutas y seguimiento de features y bugs. La herramienta es libre si se enlaza. Hoy se usan Notion y ramas por feature con PR ([`docs/README.md` del Backend](https://github.com/MagaIrisarri/Backend/blob/main/docs/README.md)). La metodología quedó nombrada (Kanban) en el `docs/README.md` del Backend, pendiente de que el grupo la confirme.
- **Evaluación:** se miran los requisitos de la etapa, UX/UI y buenas prácticas, el uso apropiado de la tecnología, la documentación, **la participación de cada integrante**, **el uso de git**, la defensa oral, la gestión y la innovación.

## Guía de estilo (Airbnb, sugerida)

La cátedra la sugiere en 3.1.2. No es obligatoria, pero entra en "buenas prácticas". En código nuevo de los dos repos (entre paréntesis, el número de regla de Airbnb):

- `const`, y `let` solo si se reasigna; nunca `var` (2.1, 2.2).
- Comillas simples, y template strings en vez de concatenar (6.1, 6.3).
- Arrow functions en los callbacks (8.1), shorthand de objetos (3.3, 3.4) y destructuring al usar varias propiedades (5.1).
- `===` y `!==` (15.1); ternarios sin anidar (15.6).
- 2 espacios, coma final en listas multilínea y punto y coma (19.1, 20.2, 21.1).
- `camelCase` para variables y funciones, y `PascalCase` para clases y componentes. MAYÚSCULAS solo para constantes exportadas que no cambian, como las de `src/Shared/constants/` (23.2, 23.3, 23.10).

Donde el proyecto se aparta de Airbnb, manda su convención:
- Exports con nombre en archivos como `X.Entity.ts` o `X.Service.ts`. Airbnb prefiere un export default y que el archivo se llame como él (10.6, 23.6).
- Hay líneas de más de 100 caracteres (19.13).

**Lint:**
- El ESLint del Frontend solo mira `**/*.{js,jsx}`, así que no revisa nada de `src/`: `npx eslint src/main.tsx` responde "File ignored because no matching configuration was supplied".
- El Backend no tiene linter.
- Para hacer cumplir la guía sin dependencias nuevas, alcanza con cambiar ese `files` a `**/*.{ts,tsx}` y activar las reglas de ESLint que cita cada punto: `prefer-const`, `no-var`, `quotes`, `prefer-template`, `prefer-arrow-callback`, `object-shorthand`, `eqeqeq`, `no-nested-ternary`, `semi` y `comma-dangle`.

## Reglas para el arnés

1. **Pruebas de la cátedra:** se versionan en `tests-catedra/` de cada repo (decidido el 16/10/2026); `tests/` sigue local, en `.gitignore`. Ya se resolvieron mobile-first (el CSS se escribe con `min-width`) y la pantalla de TipoVehículo.
2. **Antes de dar algo por cumplido**, se verifica en el código y en la sección citada. Al cerrar una fila, se actualiza con el hash.
3. **Documentación nueva:** en markdown, dentro de `docs/` y enlazada desde `docs/README.md`. Los diagramas, en Mermaid.
4. **Git es evidencia**, porque se evalúan la participación y el uso de git. Cada commit lleva a su autor real, y no se reescribe historia compartida ni se aplastan aportes de otros.

