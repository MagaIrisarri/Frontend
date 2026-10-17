# Admin · Permisos, reglas y notas de implementación

Oct 11, 2026

## Alcance

Este documento salió de un prototipo HTML del panel, que se retiró del repo. Define qué puede hacer el administrador en cada vista, las reglas que el código real debe respetar y qué hay que cambiar en el frontend y el backend actuales. Los códigos siguen la convención de las notas del dueño, con sufijo A para no chocar con ellas: **RA-** reglas de negocio, **LA-** limitaciones, **DA-** decisiones abiertas.

Las pantallas usan las clases del sistema de interfaz (`.panel`, `.tbl`, `.seg`, `.st`, `.drawer`, `.dbody`, `.dfoot`, `.fs`, `.fh`, `.btn`, `.icon-btn`, `.inp`, `.sel`, `.field`) y los tokens de `base.scss`. Lo único nuevo es la lista + detalle de Marcas (`.split`, `.side`, `.main`, `.bi`, `.gh`, `.mr`).

## Qué puede hacer el administrador

| Vista | Ver | Alta | Edición | Baja | Estado en el frontend actual | Cambio |
| --- | --- | --- | --- | --- | --- | --- |
| Panel | Sí | No | No | No | Igual | Ninguno |
| Usuarios | Sí | Cliente, dueño y empleado (el administrador sale de la siembra) | Datos personales y email; sucursal del empleado | Baja lógica y reactivación | Alta solo de dueños, sin edición | Lista + detalle por rol, alta por rol, edición, empleado con dueño y sucursal |
| Cocheras | Sí | No | No | No | No existe (solo "Ver cocheras" dentro de cada dueño) | Vista nueva: lista + detalle con filtros |
| Vehículos | Sí | No | No | No | Igual | Columnas ordenables con clic en el encabezado y columna "Alta" (RA-28) |
| Marcas y modelos | Sí | Solo con el CSV del DNRPA (agrega las que faltan) | No | No | Marcas solo lectura, sin modelos | Lista + detalle de modelos agrupados por tipo, con filtro; pestaña "Actualizar con CSV" |
| Tipos de vehículo | Sí | Sí | Sí, salvo los tipos base | Sí, salvo los base y los que están en uso | `AdminVehicleTypes.tsx` sobre `AdminCatalog` (RA-11, 2026-10-13, Frontend `82162df`) | Era la vista que se había quitado: vuelve porque TipoVehículo es un CRUD simple de regularidad y la cátedra lo pide en front y back |
| Seguros | Sí | Sí | No | No | Igual | Ninguno |
| Servicios | Sí | Sí | Sí | Sí | Igual | Ninguno |
| Feriados | Sí (los nacionales) | Sí, nacionales (D-09) | No | Sí (abre las sucursales que cerraban) | Vista nueva `AdminHolidays` (Frontend `82162df`) | Lista del año, alta y baja. No ve los propios de cada dueño, ni elige qué sucursales cierran: eso es del dueño |

## Reglas de negocio a replicar

Las valida el servidor; el frontend solo las anticipa.

| Código | Regla |
| --- | --- |
| RA-01 | Un empleado depende de un dueño y está vinculado a una sucursal de ese dueño (`ownerId`, `parkingId`). Al crearlo, el dueño tiene que estar activo y la sucursal tiene que ser suya (400 si no). En el formulario, la sucursal queda deshabilitada hasta elegir dueño y solo lista las de ese dueño. |
| RA-02 | Un empleado no cambia de dueño. Sí puede cambiar de sucursal, solo entre las de su dueño. |
| RA-03 | No se da de baja a un cliente con reservas pendientes o en curso (409). |
| RA-04 | No se da de baja a un dueño con sucursales activas (409): primero se pausan. |
| RA-05 | No se da de baja a un empleado con turnos cargados o reservas activas asignadas (409): primero se lo saca de los turnos y se reasignan sus reservas. |
| RA-06 | El administrador no se da de baja a sí mismo: su fila no tiene menú de acciones. |
| RA-07 | La baja es lógica (`status` BAJA) y la reactivación la revierte. El usuario dado de baja no puede iniciar sesión. |
| RA-08 | Email, DNI y teléfono son únicos (409), tanto en el alta como en la edición, para cualquier rol. |
| RA-09 | DNI de 7 u 8 dígitos; nombre y apellido de al menos 2 caracteres; teléfono de 6 a 15 dígitos; contraseña de al menos 6; mayor de 18 años. |
| RA-10 | El rol no se edita. |
| RA-11 | Marcas y modelos son solo lectura (salvo el CSV, RA-14). Cada modelo pertenece a una marca y a un tipo; el tipo no depende de la marca. Los tipos de vehículo tienen ABM (`VehicleType.Service.ts`, 409 en cada caso): el nombre es único sin mayúsculas, tildes ni espacios de más; AUTO, MOTO y CAMIONETA son la base (el CSV les asigna los modelos por nombre) y no se renombran ni se dan de baja; un tipo con modelos, vehículos o plazas activas, o tarifas vigentes, no se da de baja; renombrarlo se permite. Cada tipo tiene sus propias plazas y tarifas (R-30 en las notas del dueño): la pantalla muestra en cuántas cocheras tiene plazas y avisa si no tiene ninguna, porque entonces sus vehículos no pueden reservar. |
| RA-12 | Seguros: solo listar y agregar. Una aseguradora ya elegida por clientes no se edita ni se borra. |
| RA-13 | Servicios: nombre de al menos 2 caracteres y descripción de al menos 5. Eliminar no afecta lo que ya lo usa. |
| RA-14 | Actualizar con CSV solo agrega marcas y modelos que faltan; nunca borra ni edita lo existente, salvo completar la descripción del DNRPA de un modelo que no la tiene. Es idempotente: cargar dos veces el mismo archivo agrega 0 la segunda. |
| RA-15 | El archivo se lee en el navegador (hasta 25 MB). Se toman marca, modelo y tipo de automotor (`automotor_marca_descripcion`, `automotor_modelo_descripcion`, `automotor_tipo_descripcion`), se deduplican y se pide una vista previa (`dryRun`) antes de confirmar. Si faltan columnas, se avisa cuáles. La vista previa lista todos los modelos nuevos de a 20 por página (`newModels`), cada uno con una casilla: los destildados no se agregan (ni su marca, si no le queda otro) y quedan no admitidos (RA-27). |
| RA-16 | Marca y modelo se comparan sin distinguir mayúsculas ni tildes. Una marca o modelo dado de baja que vuelve a aparecer en el archivo se reactiva. El tipo de cada modelo nuevo sale de la tabla descripción → tipo (RA-26). |
| RA-17 | Se omiten los modelos de las descripciones del DNRPA no admitidas (lo que no entra en una cochera: camiones, acoplados, semirremolques, tractores, chasis, ómnibus, casas rodantes, remolques…) y los modelos no admitidos (RA-27), y se cuentan como omitidos en la vista previa. La lista no es fija: son filas de la tabla descripción → tipo sin tipo (`DnrpaTypeMap.vehicleType` nulo). La siembra carga 33 (`NOT_ADMITTED_DESCRIPTIONS`, `Backend/src/Shared/constants/dnrpa.ts`) y el administrador la edita: en la vista previa, "No admitir" en una descripción nueva (sugerido si tiene palabras como camión o remolque, `suggestNotAdmitted`); en Tipos de vehículo, "No admitir" en la lista de cada tipo y "Descripciones no admitidas" para volver a admitirlas. Dejar de admitir una descripción no toca sus modelos ya cargados. Solo un administrador puede importar (el servidor lo comprueba con el token). |
| RA-19 | Cocheras es de solo lectura: alta, edición, pausa y tarifas son del dueño. La lista trae todas, activas y pausadas, y se filtra por texto (nombre, dirección, barrio o dueño), por localidad con su provincia (hay localidades homónimas) y por estado. |
| RA-20 | Estado en texto además de color: "Activa", "Pausada" o "Falta tarifa" (activa, pero sin tarifa vigente para algún tipo con plazas: esos clientes no pueden reservar). |
| RA-21 | El detalle muestra dueño, horario y reglas de reserva, personal activo de la sucursal, plazas por tipo (en servicio, ocupadas, en mantenimiento) con su tarifa por hora, y el movimiento (reservas por estado y facturado). Las métricas se piden al abrir la cochera, no por fila. |
| RA-18 | Un empleado con turnos o reservas activas no cambia de sucursal (409), igual que la baja (RA-05). |
| RA-22 | Usuarios y Cocheras se cargan por páginas de 25 (hasta 100) y las resuelve el servidor: búsqueda sin tildes ni mayúsculas (todas las palabras), filtros, conteos que rotulan cada filtro y, en cocheras, la lista de localidades. Sin `page`, los endpoints devuelven todo, como antes. Al cambiar un filtro la lista vuelve a la página 1. Si una baja vacía la última página, se vuelve a la anterior. |
| RA-23 | Usuarios es lista + detalle: el detalle muestra los datos y, según el rol, vehículos y reservas del cliente, cocheras y empleados del dueño, o sucursal y dueño del empleado, con enlaces a Cocheras y a Usuarios. Editar y dar de baja o reactivar están en el detalle; el administrador no tiene acciones sobre su propio usuario (RA-06). |
| RA-26 | Cada modelo guarda su descripción del DNRPA ("PICK-UP CABINA DOBLE") y una tabla dice a qué tipo va cada descripción; se compara sin mayúsculas, tildes, guiones ni espacios ("PICK-UP" y "PICK UP" son la misma). Se configura una vez: la vista previa del CSV solo pregunta por las descripciones nuevas, con el tipo sugerido elegido (el tipo creado cuyo nombre aparece en la descripción; si no, el base). Una descripción que ya tiene modelos conserva el tipo que tienen. Desde Tipos de vehículo, "Descripciones del DNRPA" asigna descripciones a un tipo (al crearlo se abre solo, con las sugeridas tildadas): se reasignan sus modelos y sus vehículos, y las que se destildan vuelven a la sugerencia. Con reservas activas de esos vehículos no se puede (409, D-12). Al dar de baja un tipo, sus descripciones vuelven a la sugerencia. Backend `5513158`, Frontend `39773a6`. Cada fila de la lista de tipos tiene un desplegable con sus descripciones y los modelos de cada una, con "No admitir" (RA-17); el botón "Descripciones no admitidas" muestra solo esas, y destildar una la vuelve a admitir al tipo sugerido, con sus modelos (`GET`/`PUT /api/vehicle-types/not-admitted/descriptions`). |
| RA-27 | Un modelo destildado en la vista previa del CSV queda no admitido (`ExcludedModel`, por marca y modelo comparados sin mayúsculas ni tildes): las importaciones siguientes lo omiten sin mostrarlo. La pestaña "Actualizar con CSV" lista los no admitidos ("Modelos no admitidos", de a 20) con "Volver a admitir", que lo trae como nuevo en la próxima importación (`GET /api/catalog/excluded-models`, `DELETE /api/catalog/excluded-models/:id`). Si se destilda todo, el botón pasa a "Guardar" para registrar las exclusiones. Backend `015b46b`, Frontend `a053b33`. Prueba: `tests/catalog/Catalog.db.test.ts`. |
| RA-28 | Alta y última modificación: usuarios, sucursales y vehículos guardan `createdAt` y `updatedAt` (la modificación se actualiza sola en cada cambio). Se muestran en el detalle del usuario (Usuarios), en el detalle de la cochera (Cocheras y el panel del dueño) y en la columna "Alta" de Vehículos, con "Modificado" debajo si cambió, en hora de Argentina (`formatStamp`, `utils/date.ts`). Las filas anteriores a esas columnas muestran "Sin dato". La demo las carga anteriores a la actividad de cada uno, y a los dueños con sus datos fiscales. Vehículos ordena por cualquier columna con clic en el encabezado (`useSortable`, como Personal y Reservas del dueño). Backend `ff30304`, Frontend `a053b33`. |
| RA-25 | La API tampoco escribe marcas ni modelos: `/api/brands` y `/api/models` son solo `GET` (Backend `5513158`). El único camino de escritura es el CSV (RA-14). Así un modelo no cambia de tipo ni de marca, y el tipo que copia cada vehículo de su modelo no se desincroniza. |
| RA-24 | Marcas y modelos no se pagina: `GET /api/models?brandId=` trae todos los modelos de la marca (hay marcas con cientos). El detalle los muestra en una lista con scroll, con buscador y filtro por tipo. |

## Limitaciones y decisiones abiertas

| Código | Qué | Estado |
| --- | --- | --- |
| LA-01 | El backend no permite crear administradores y no se agrega: el administrador sale de la siembra (`userSeeder`) y el alta de la interfaz ofrece solo cliente, dueño y empleado. | Cerrada por decisión. |
| LA-02 | Hay dos rutas de alta: `POST /api/users` (cliente y dueño) y `POST /api/users/:ownerId/employee` (empleado, con `parkingId`). El formulario elige la ruta según el rol. | Resuelta en el diseño. |
| LA-03 | No hay restablecer contraseña desde el admin: `PUT /api/users/:id` no acepta `password` y `PATCH /api/users/:id/password` pide la contraseña actual. | Resuelta (pendiente de commit): `POST /api/users/:id/reset-password` (solo el administrador, y no para otro administrador) pone una contraseña temporal y `mustChangePassword`; botón "Contraseña" en el detalle del usuario. |
| LA-04 | Cambiar la sucursal de un empleado que tiene turnos o reservas en la actual dejaba turnos huérfanos: el servidor solo validaba que la sucursal fuera del dueño. | Resuelta por RA-18. |
| LA-05 | El listado de usuarios trae solo `ownerId` y `parkingId`. El nombre del dueño sale de la misma lista; el de la sucursal hay que pedirlo (`getParkingsByOwner`). | Resuelta (pendiente de commit): la página de `GET /api/users` trae `parkingName` y el listado lo muestra junto al rol. |
| LA-06 | `getModels(brandId)` devuelve todos los modelos de la marca, sin paginar, con `brand` y `vehicleType`. Verificado en `Model.Repository.ts`. | Cerrada. |
| LA-07 | No había autenticación: las rutas de usuarios las podía llamar cualquiera y la identidad viajaba en `x-user-id`, que se podía falsificar. | Cerrada (Backend `a183668`, Frontend `82162df`): el login devuelve un JWT y las rutas del panel exigen `auth(ADMINISTRADOR)`. Cada recurso se controla además contra su dueño (L-37, notas del dueño). |
| DA-01 | Mover un empleado a otro dueño: el servidor no lo permite y el prototipo tampoco. | Decidido el 16/10/2026: no se mueve a otro dueño, porque su historial (turnos y reservas atendidas) es del dueño anterior. Se da de baja y el dueño nuevo le crea otra cuenta. Dentro del mismo dueño cambia de sucursal (L-25). |
| DA-02 | ¿Restablecer contraseña del usuario desde el admin? | Decidido el 16/10/2026: sí, con una contraseña temporal que el usuario cambia al entrar (LA-03). El alta, la edición y la baja de clientes, dueños y empleados ya estaban. |
| DA-03 | Nombre de la sucursal en el listado: ¿lo trae el endpoint o se pide aparte? | Decidido el 16/10/2026: lo trae el endpoint (LA-05). |
| DA-04 | Marcas y modelos: el backend ya expone alta, edición y baja. Se decidió solo lectura salvo la ampliación con el CSV del DNRPA; si cambia, hay que diseñar esos formularios. | Decidido. |
| LA-09 | (L-35 en las notas del dueño) El selector de dueños del alta de empleado trae hasta 100 dueños activos. | Abierta: pasar a un buscador si hay más. |
| LA-08 | (L-33 en las notas del dueño) La importación omite los tipos que no son de pasajeros con una lista fija de palabras (acoplado, tractor, chasis, camión, casa rodante, remolque…). `vehiculos.json` está revisado (17/10/2026) y no trae esos tipos: solo 3 minivans de pasajeros y 2 utilitarios chicos, que quedan como AUTO. | Resuelta (Backend `015b46b`, Frontend `a053b33`): la lista se edita desde Tipos de vehículo ("Descripciones no admitidas") y desde la vista previa del CSV ("No admitir"); la siembra carga las de hoy. |

## Cambios sobre el frontend actual

| Archivo | Cambio |
| --- | --- |
| `pages/Admin/AdminPanel.tsx` y `App.tsx` | "Tipos de vehículo" vuelve a `VIEWS` y a las rutas (`/admin/vehicle-types`), después de Marcas y modelos. |
| `pages/Admin/AdminVehicleTypes.tsx` y `AdminCatalog.tsx` | Envoltorio de `AdminCatalog` con `services/vehicleType.service.ts`. Las filas `locked` (tipos base) no tienen menú. Los dos están en `scripts/standard.json`; su prueba es `e2e/admin.vehicle-types.spec.ts`. |
| `pages/Admin/AdminBrands.tsx` | Reemplazar `AdminCatalog` por la vista lista + detalle. Cargar marcas con `getBrands` y modelos con `getModels(brandId)` al elegir una. `Model.vehicleType` ya existe en `types/vehicle.types.ts`. Dos pestañas: catálogo y "Actualizar con CSV" (`components/Admin/CatalogImport.tsx` y `utils/dnrpaCsv.ts`). |
| `pages/Admin/AdminParkings.tsx`, `AdminPanel.tsx`, `App.tsx` y `services/parking.service.ts` | Vista nueva "Cocheras" (de 6 a 7 vistas): `FilterBar` arriba, lista a la izquierda y detalle a la derecha con las clases de lista + detalle de Marcas. Agregar `getAllParkings`. Reusa `owner.lib` (`VT`, `capOf`, `svcOf`, `occOf`, `priceOf`, `missing`, `hrs`). No reusa el panel "Ver cocheras" de Usuarios, que queda como está. |
| `hooks/usePagedList.ts`, `hooks/useAsync.ts`, `components/Owner/ui/Pager.tsx`, `utils/layout.ts` | Lista paginada en el servidor con respuestas descartables y paginador "26–50 de 120"; carga de datos de apoyo con sus cuatro estados; `revealOnMobile` lleva el detalle a la vista en pantallas angostas. |
| `pages/Admin/AdminUsers.tsx` | "Nuevo dueño" pasa a "Nuevo usuario". `OwnerDrawer` pasa a un formulario con rol; con empleado, selects de dueño y sucursal dependientes. Agregar el panel de edición. Mostrar sucursal y dueño en la fila del empleado. |
| `services/user.service.ts` y `services/vehicle.service.ts` | Agregar `createUser(type, datos)` para cliente y dueño (hoy `createOwner` fija `DUEÑO`), `createEmployee(ownerId, datos)`, `updateEmployee(ownerId, id, datos)` e `importCatalog(items, dryRun)`. `updateUser`, `removeUser` y `reactivateUser` ya existen y sirven también para empleados. |
| `styles/ui.scss` | Agregar las clases de lista + detalle con nombres genéricos. No crear un `.scss` por pantalla. |
| `scripts/standard.json` y `tests/e2e/` | Agregar las pantallas nuevas o migradas y su prueba e2e. Cerrar con `pnpm verify`. |

Reglas del estándar que el prototipo simplifica:
- Todo `Drawer` y `ConfirmModal` va dentro de `Presence` o `Shown`: el prototipo los monta y desmonta sin animar.
- Un panel no abre otro: alta y edición cambian la vista dentro del mismo panel.
- Toda lista tiene cuatro estados: carga, error con "Reintentar", vacío y sin resultados. El prototipo muestra solo vacío y sin resultados, porque no hay red.
- Las búsquedas de texto usan `matchesQuery` y los filtros usan `FilterBar`; el prototipo trae versiones propias.
- Las tablas pasan a tarjetas con `data-label` en móvil; el prototipo solo las deja con scroll horizontal.
- Textos en voseo, errores con qué pasó y qué hacer, plurales con `plural()` y dinero con `money()`.

## Endpoints

| Uso | Endpoint |
| --- | --- |
| Listar usuarios | `GET /api/users` |
| Alta de cliente o dueño | `POST /api/users` |
| Alta de empleado | `POST /api/users/:ownerId/employee` |
| Editar datos | `PUT /api/users/:id` |
| Editar empleado (incluye sucursal) | `PUT /api/users/:ownerId/employee/:id` |
| Dar de baja y reactivar | `DELETE /api/users/:id` y `POST /api/users/:id/reactivate` |
| Cocheras de un dueño | `GET /api/parkings/owner/:ownerId` y `GET /api/parkings/:id/metrics` |
| Marcas y modelos | `GET /api/brands` y `GET /api/models?brandId=` |
| Actualizar con CSV | `POST /api/catalog/import` con `{ dryRun, items: [{ brand, model, type }] }` |
| Vehículos | `GET /api/vehicles` |
| Seguros | `GET /api/insurances` y `POST /api/insurances` |
| Servicios | `GET`, `POST`, `PATCH` y `DELETE /api/service-catalog` |
| Panel | `GET /api/stats/summary` |
| Cocheras | `GET /api/parkings?page=&limit=&q=&province=&locality=&status=on\|off` (devuelve `meta` con total, conteos por estado y localidades) y, al abrir una, `GET /api/parkings/:id/metrics`; el personal sale de `GET /api/users/:ownerId/employee` |
| Usuarios (lista y detalle) | `GET /api/users?page=&limit=&q=&role=&status=` (devuelve `meta` con total y conteos por rol y estado), `GET /api/users/:id`, `GET /api/vehicles/client/:id`, `GET /api/reservations/client/:id`, `GET /api/parkings/owner/:ownerId`, `GET /api/users/:ownerId/employee` |

## Accesibilidad

Botones de solo ícono con `aria-label`; campos con etiqueta, `aria-invalid` y error en `role="alert"` ligado por `aria-describedby`; foco inicial al abrir una capa, Escape que cierra y foco devuelto al abridor; estado en texto además de color; controles de 44 px bajo 720 px. El prototipo no atrapa el foco dentro de las capas: el código real lo resuelve con `Layer.tsx`.
