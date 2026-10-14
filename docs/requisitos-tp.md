# Requisitos de la cátedra — TP DSW, instanciados para Estacionamiento COM 301

Qué pide la cátedra, aplicado a este proyecto (4 integrantes, Backend y Frontend separados), con el estado de cada punto. Es parte del arnés: los `CLAUDE.md` de los dos repos apuntan acá.

- **Revisado el 2026-10-14** leyendo el código y los commits (solo se corrieron las pruebas del Backend afectadas por D-10): Backend `aa56d66` (`prueba-valen-bk`), Frontend `66e80c5` (`prueba-valen-fr`), y `main` (Backend, `1d95828`) y `master` (Frontend, `b8383d4`) en GitHub. Ninguna rama de trabajo está mergeada todavía.
- **No repite** [revision-alcance.md](revision-alcance.md), que tiene cada CRUD, listado y CUU del proposal con su evidencia. Acá van los requisitos técnicos, las reglas de la FAQ, las entregas, la documentación, la gestión y la guía de estilo.
- Al cerrar una fila, se actualiza su estado con el hash del commit, como en las notas del dueño.

## Resumen

- **Regularidad:** lo técnico cumple (mobile-first y la pantalla de TipoVehículo, Frontend `82162df`). Lo funcional cumple (revision-alcance.md), con un riesgo de la FAQ: el detalle de reservas no pide datos al backend. Para la entrega faltan las minutas, los links a los PR y el merge a `main` y `master`.
- **Aprobación directa:** la autenticación con rutas protegidas ya está (JWT, Backend `a183668`, Frontend `82162df`). Faltan los tests versionados con su evidencia (4 del backend más uno de integración; uno de componente y uno e2e del frontend), la documentación de la API, el deploy y el video.

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
| Reg. | Dependencias de ejecución, desarrollo y test registradas | Cumple, con matiz | `package.json` y `pnpm-lock.yaml`; `tsx` corre las pruebas | Falta un script `test` |
| Apr. | 1 test automatizado por integrante (4) | No cumple en el repo | 13 pruebas en `Backend/tests/**`, locales y sin versionar por convención (`CLAUDE.md`) | La cátedra no las ve ni puede atribuirlas. Versionarlas con un script `test`, y que cada integrante escriba al menos una |
| Apr. | 1 test de integración | No cumple en el repo | Las `*.db.test.ts` corren contra MySQL (p. ej. `Reservation.db.test.ts`) | Versionar al menos una |
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
| Reg. | Dependencias de ejecución, desarrollo y test registradas | Cumple, con matiz | `package.json` | Playwright está instalado pero no figura en `package.json`: un clon nuevo no puede correr las e2e |
| Apr. | 1 test unitario de un componente | No cumple | Solo está `tests/unit/owner.lib.test.ts`, que prueba lógica, no un componente, y no está versionado | Un test de componente versionado, con su dependencia en `package.json` |
| Apr. | 1 test end-to-end | No cumple en el repo | 17 specs de Playwright en `tests/e2e/` (por tema) (más `mockApi.ts`), excluidas por `.gitignore` | Versionar al menos una, con `playwright.config.ts` |
| Apr. | Login y acceso según el nivel de usuario | Cumple | `ProtectedRoute allowedRoles` en [App.tsx](../src/App.tsx): CLIENTE, DUEÑO, EMPLEADO y ADMINISTRADOR | Protege la navegación; el backend controla lo mismo en cada ruta (ver la tabla anterior) |
| Apr. | Ambientes | Cumple, con matiz | `.env` con `VITE_API_URL` y `VITE_MAPTILER_API_KEY` | El `.env` está versionado (en `master` y en esta rama) aunque `.gitignore` lo excluye, y no hay `.env.example`. La key de MapTiler es de navegador: conviene restringirla por dominio |

## Requisitos funcionales: lo que agrega la FAQ

El estado de cada CRUD, listado y CUU está en revision-alcance.md (todo cumple). La FAQ fija reglas que esa revisión no mira:

| Regla | Estado | Evidencia | Qué falta |
|---|---|---|---|
| El detalle de un listado pide datos al backend y muestra al menos 2 clases de negocio, o lleva al CRUD | Parcial | Estacionamientos: [ParkingSpaceMap.tsx](../src/pages/ParkingSpace/ParkingSpaceMap.tsx) pide la cochera, las plazas y la disponibilidad. Reservas por fecha: el panel de [OwnerReservations.tsx](../src/pages/Owner/OwnerReservations.tsx) muestra lo que ya trajo el listado y no hace un pedido propio | Que el detalle de la reserva pida `GET /api/reservations/:id`, que ya existe |
| Los CRUD mínimos se usan desde la app (front y back) | Cumple (Frontend `82162df`) | TipoVehículo, CRUD simple de regularidad, tiene pantalla en el panel del administrador: [AdminVehicleTypes.tsx](../src/pages/Admin/AdminVehicleTypes.tsx) (`/admin/vehicle-types`, RA-11 en [admin-permisos-notas.md](admin/admin-permisos-notas.md)) | — |
| Al menos 2 CUU relacionados | Cumple | Reservar → registrar el ingreso (check-in) → registrar el uso de servicios → facturar: cada uno usa lo que registró el anterior. Sin confirmación de reservas desde D-10 (Backend `aa56d66`, Frontend `66e80c5`): el proposal todavía nombra "Registrar confirmación de reserva" y hay que cambiarlo por "Registrar check-in" | — |

## Entregas y documentación (3.3, 3.4 y docs.md)

**Formato:**
- Una carpeta `docs/` en la raíz de cada repo, con `docs/README.md` como entrada, enlazado desde el README del proyecto.
- Los textos van en markdown, y los diagramas en Mermaid o como imágenes que GitHub muestre.
- PDF solo para lo que una herramienta no exporta a markdown. No se aceptan `.doc`, `.odt`, `.rtf` ni `.txt`.

| Entregable | Reg. | Apr. | Estado | Qué falta |
|---|:-:|:-:|---|---|
| `docs/README.md` enlazado desde el README | X | X | Backend: en `main`. Frontend: solo en `prueba-valen-fr`, aunque el README de `master` ya lo enlaza | Mergear `prueba-valen-fr` |
| README con instalación y ejecución por scripts | X | X | Cumple en `main` y en `master`; las ramas de trabajo tienen el README viejo | Al mergear, conservar el README de `main` y de `master` |
| Proposal actualizada con los links a los PR | X | X | El proposal enlaza los repos, no los PR | Agregar los PR de la entrega (los últimos mergeados: [Backend #7](https://github.com/MagaIrisarri/Backend/pull/7) y [Frontend #11](https://github.com/MagaIrisarri/Frontend/pull/11)) |
| Links a los PR/MR en la documentación | X | X | Los `docs/README.md` enlazan la lista de PR | Enlazar los PR concretos |
| Minutas de reunión y avance | X | X | **Vacío**: la tabla del `docs/README.md` del Backend solo tiene el encabezado | Cargar las minutas |
| Seguimiento de features, bugs e issues | X | X | Cumple: tablero de Notion enlazado en el `docs/README.md` del Backend | — |
| Documentación de la API | | X | No hay (ni OpenAPI ni un listado de endpoints) | Documentar los endpoints |
| Evidencia de los tests automáticos | | X | No hay | Guardar en `docs/` la salida de una corrida |
| Video de demostración | TBD | X | No hay | Grabarlo |
| Deploy, con links y credenciales | TBD | X | No hay configuración de deploy | Deploy con un MySQL hospedado. Las credenciales pueden ser las de la siembra (`password123`) |
| Contacto para coordinar la defensa | | X | — | Va en el form |

**Repositorio:** la FAQ pide crear el repo como fork de `utnfrrodsw/tp` y entregar por PR/MR. `TPDSW` no es un fork y no hay ningún PR a `utnfrrodsw/tp`, pero 3.3 dice que se entrega por el form. Hay que confirmar con el docente cuál rige.

## Gestión y evaluación (4 y 5)

- **Gestión** (la cátedra la marca "en revisión"): pide declarar una metodología ágil (Scrum, XP u otra), minutas y seguimiento de features y bugs. La herramienta es libre si se enlaza. Hoy se usan Notion y ramas por feature con PR ([`docs/README.md` del Backend](https://github.com/MagaIrisarri/Backend/blob/main/docs/README.md)). Faltan cargar las minutas. La metodología quedó nombrada (Kanban) en el `docs/README.md` del Backend, pendiente de que el grupo la confirme.
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

1. **Una regla del arnés choca con la cátedra:** las pruebas sin versionar (los dos `CLAUDE.md`), contra los tests de aprobación y su evidencia (3.1.1, 3.1.2 y 3.3). Sigue vigente y no se cambia sin acuerdo del equipo, pero ninguna tarea la da por cumplida. Ya se resolvieron mobile-first (el CSS se escribe con `min-width`) y la pantalla de TipoVehículo.
2. **Antes de dar algo por cumplido**, se verifica en el código y en la sección citada. Al cerrar una fila, se actualiza con el hash.
3. **Documentación nueva:** en markdown, dentro de `docs/` y enlazada desde `docs/README.md`. Los diagramas, en Mermaid.
4. **Git es evidencia**, porque se evalúan la participación y el uso de git. Cada commit lleva a su autor real, y no se reescribe historia compartida ni se aplastan aportes de otros.
5. **Hasta el 16/10** va primero lo que bloquea la entrega de regularidad (el merge a `main` y `master`, las minutas y los links a los PR), antes que cualquier mejora.
