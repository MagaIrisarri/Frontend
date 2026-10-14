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
| Vehículos | Sí | No | No | No | Igual | Ninguno |
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
| RA-11 | Marcas y modelos son solo lectura (salvo el CSV, RA-14). Cada modelo pertenece a una marca y a un tipo; el tipo no depende de la marca. Los tipos de vehículo tienen ABM (`VehicleType.Service.ts`, 409 en cada caso): el nombre es único sin mayúsculas, tildes ni espacios de más; AUTO, MOTO y CAMIONETA son la base (el CSV les asigna los modelos por nombre) y no se renombran ni se dan de baja; un tipo con modelos o vehículos activos no se da de baja ni se renombra a otra categoría. La categoría con la que se cobra y estaciona la calcula el backend (`categorizeVehicleType`) y la pantalla solo la muestra. |
| RA-12 | Seguros: solo listar y agregar. Una aseguradora ya elegida por clientes no se edita ni se borra. |
| RA-13 | Servicios: nombre de al menos 2 caracteres y descripción de al menos 5. Eliminar no afecta lo que ya lo usa. |
| RA-14 | Actualizar con CSV solo agrega marcas y modelos que faltan; nunca borra ni edita lo existente. Es idempotente: cargar dos veces el mismo archivo agrega 0 la segunda. |
| RA-15 | El archivo se lee en el navegador (hasta 25 MB). Se toman marca, modelo y tipo de automotor (`automotor_marca_descripcion`, `automotor_modelo_descripcion`, `automotor_tipo_descripcion`), se deduplican y se pide una vista previa (`dryRun`) antes de confirmar. Si faltan columnas, se avisa cuáles. |
| RA-16 | Marca y modelo se comparan sin distinguir mayúsculas ni tildes. Una marca o modelo dado de baja que vuelve a aparecer en el archivo se reactiva. El tipo sale de `categorizeVehicleType`. |
| RA-17 | Se omiten los tipos que no son de pasajeros (acoplados, semirremolques, tractores, chasis, ómnibus, minibuses) y se cuentan como omitidos en la vista previa. Solo un administrador puede importar (el servidor lo comprueba con el token). |
| RA-19 | Cocheras es de solo lectura: alta, edición, pausa y tarifas son del dueño. La lista trae todas, activas y pausadas, y se filtra por texto (nombre, dirección, barrio o dueño), por localidad con su provincia (hay localidades homónimas) y por estado. |
| RA-20 | Estado en texto además de color: "Activa", "Pausada" o "Falta tarifa" (activa, pero sin tarifa vigente para algún tipo con plazas: esos clientes no pueden reservar). |
| RA-21 | El detalle muestra dueño, horario y reglas de reserva, personal activo de la sucursal, plazas por tipo (en servicio, ocupadas, en mantenimiento) con su tarifa por hora, y el movimiento (reservas por estado y facturado). Las métricas se piden al abrir la cochera, no por fila. |
| RA-18 | Un empleado con turnos o reservas activas no cambia de sucursal (409), igual que la baja (RA-05). |
| RA-22 | Usuarios y Cocheras se cargan por páginas de 25 (hasta 100) y las resuelve el servidor: búsqueda sin tildes ni mayúsculas (todas las palabras), filtros, conteos que rotulan cada filtro y, en cocheras, la lista de localidades. Sin `page`, los endpoints devuelven todo, como antes. Al cambiar un filtro la lista vuelve a la página 1. Si una baja vacía la última página, se vuelve a la anterior. |
| RA-23 | Usuarios es lista + detalle: el detalle muestra los datos y, según el rol, vehículos y reservas del cliente, cocheras y empleados del dueño, o sucursal y dueño del empleado, con enlaces a Cocheras y a Usuarios. Editar y dar de baja o reactivar están en el detalle; el administrador no tiene acciones sobre su propio usuario (RA-06). |
| RA-24 | Marcas y modelos no se pagina: `GET /api/models?brandId=` trae todos los modelos de la marca (hay marcas con cientos). El detalle los muestra en una lista con scroll, con buscador y filtro por tipo. |

## Limitaciones y decisiones abiertas

| Código | Qué | Estado |
| --- | --- | --- |
| LA-01 | El backend no permite crear administradores y no se agrega: el administrador sale de la siembra (`userSeeder`) y el alta de la interfaz ofrece solo cliente, dueño y empleado. | Cerrada por decisión. |
| LA-02 | Hay dos rutas de alta: `POST /api/users` (cliente y dueño) y `POST /api/users/:ownerId/employee` (empleado, con `parkingId`). El formulario elige la ruta según el rol. | Resuelta en el diseño. |
| LA-03 | No hay restablecer contraseña desde el admin: `PUT /api/users/:id` no acepta `password` y `PATCH /api/users/:id/password` pide la contraseña actual. | Abierta (DA-02). |
| LA-04 | Cambiar la sucursal de un empleado que tiene turnos o reservas en la actual dejaba turnos huérfanos: el servidor solo validaba que la sucursal fuera del dueño. | Resuelta por RA-18. |
| LA-05 | El listado de usuarios trae solo `ownerId` y `parkingId`. El nombre del dueño sale de la misma lista; el de la sucursal hay que pedirlo (`getParkingsByOwner`). | Abierta (DA-03). |
| LA-06 | `getModels(brandId)` devuelve todos los modelos de la marca, sin paginar, con `brand` y `vehicleType`. Verificado en `Model.Repository.ts`. | Cerrada. |
| LA-07 | No había autenticación: las rutas de usuarios las podía llamar cualquiera y la identidad viajaba en `x-user-id`, que se podía falsificar. | Cerrada (Backend `a183668`, Frontend `82162df`): el login devuelve un JWT y las rutas del panel exigen `auth(ADMINISTRADOR)`. Cada recurso se controla además contra su dueño (L-37, notas del dueño). |
| DA-01 | Mover un empleado a otro dueño: el servidor no lo permite y el prototipo tampoco. | Sin decidir. |
| DA-02 | ¿Restablecer contraseña del usuario desde el admin? | Sin decidir. |
| DA-03 | Nombre de la sucursal en el listado: ¿lo trae el endpoint o se pide aparte? | Sin decidir. |
| DA-04 | Marcas y modelos: el backend ya expone alta, edición y baja. Se decidió solo lectura salvo la ampliación con el CSV del DNRPA; si cambia, hay que diseñar esos formularios. | Decidido. |
| LA-09 | (L-35 en las notas del dueño) El selector de dueños del alta de empleado trae hasta 100 dueños activos. | Abierta: pasar a un buscador si hay más. |
| LA-08 | (L-33 en las notas del dueño) La importación omite los tipos que no son de pasajeros con una lista fija de palabras (acoplado, tractor, chasis…). `vehiculos.json` ya trajo algunos de esos como AUTO y no se limpian. | Abierta: limpiar el catálogo sembrado. |

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
