# Revisión de alcance — Estacionamiento COM 301

Revisión contra el [proposal](https://github.com/MagaIrisarri/TPDSW/blob/main/proposal.md), hecha leyendo el código local.

- **Primera revisión (2026-10-11):** Backend `25e9aa4`, Frontend `afb326b`. Dejó la edición de Vehículo y el uso de servicio en Parcial, y el recordatorio sin hacer.
- **Actualización (2026-10-11):** se cerraron los faltantes con Backend `282e86d`, `99802ae` y Frontend `b25da64`, `d00ae2a`. El uso de servicio ya estaba resuelto en Backend `54c16f1` y Frontend `e72f90c` (R-24). Esta vez sí se corrieron las pruebas: pruebas locales del backend contra MySQL, `pnpm verify` completo y las e2e contra el backend real. Todo pasa.

Todo está en las ramas `prueba-valen-bk` y `prueba-valen-fr`, todavía no mergeadas a `main`. **Lo que ve la cátedra en `main` no tiene esto hasta el merge.** Los códigos R-, L- y D- están en [owner-turnos-notas.md](owner/owner-turnos-notas.md).

**Stack**
- **Backend:** Express 5, TypeScript, MikroORM 7 sobre MySQL y zod. Un módulo por entidad (`Entity/Schema/Repository/Service/Controller/Route`), montado en `src/index.ts`.
- **Frontend:** React 19 con Vite, React Router 7, axios y zustand. Pantallas por rol: cliente en Home/drawers, y Admin, Owner y Employee en `src/pages/`.

## 1. Regularidad

| Requisito | Estado | Evidencia | Qué falta |
|---|---|---|---|
| CRUD Usuario | Cumple | Backend: [User.Route.ts:25-42](../../Backend/src/User/User.Route.ts#L25-L42) (alta, login, edición, contraseña, baja lógica, reactivar). Frontend: registro en [AuthDrawer.tsx](../src/components/Auth/AuthDrawer.tsx), edición y baja propias en [ProfileDrawer.tsx](../src/components/Profile/ProfileDrawer.tsx), listado, alta (cliente, dueño y empleado), edición y baja en [AdminUsers.tsx](../src/pages/Admin/AdminUsers.tsx) | — |
| CRUD Estacionamiento | Cumple | Backend: [Parking.Route.ts:18-26](../../Backend/src/Parking/Parking.Route.ts#L18-L26). Frontend: alta y edición en [ParkingDrawer.tsx](../src/pages/Owner/ParkingDrawer.tsx), baja y reactivación en [OwnerDashboard.tsx](../src/pages/Owner/OwnerDashboard.tsx) | — |
| CRUD Servicio | Cumple | Backend: [ServiceCatalog.Route.ts:16-21](../../Backend/src/ServiceCatalog/ServiceCatalog.Route.ts#L16-L21). Frontend: [AdminService.tsx](../src/pages/Admin/AdminService.tsx) | — |
| CRUD TipoVehículo | Cumple | Backend: [VehicleType.Route.ts](../../Backend/src/Vehicle/VehicleType/VehicleType.Route.ts) y las reglas en [VehicleType.Service.ts](../../Backend/src/Vehicle/VehicleType/VehicleType.Service.ts): nombre único, tipos base fijos, sin dar de baja lo que está en uso (RA-11). Cada tipo tiene sus propias plazas y tarifas (R-30, rama `tipoVehiculo`, sin commit): el CRUD ya no es solo un listado de nombres, sino lo que decide dónde estaciona y cuánto paga cada vehículo. Frontend: [AdminVehicleTypes.tsx](../src/pages/Admin/AdminVehicleTypes.tsx) en el panel del administrador, con en cuántas cocheras tiene plazas cada tipo | Sin `descripcion` del DER (se decidió documentarlo, ver abajo) |
| CRUD Vehículo (depende de TipoVehículo) | Cumple | Alta y edición comparten la validación: el modelo existe, marca y modelo coinciden, y el tipo sale del modelo ([Vehicle.Service.ts:20-81](../../Backend/src/Vehicle/Vehicle.Service.ts#L20-L81)). No se cambia el tipo con reservas activas (R-25). Frontend: [VehiclesDrawer.tsx](../src/components/Vehicle/VehiclesDrawer.tsx) | — (la edición se arregló en `282e86d`) |
| CRUD Ubicacion_playa (depende de Estacionamiento) | Cumple | Backend: [ParkingSpace.Route.ts](../../Backend/src/ParkingSpace/ParkingSpace.Route.ts). Valida que la cochera esté activa en [ParkingSpace.Service.ts](../../Backend/src/ParkingSpace/ParkingSpace.Service.ts). Frontend: [OwnerSpaces.tsx](../src/pages/Owner/OwnerSpaces.tsx) (alta masiva, edición, baja con reubicación) | — |
| Listado de estacionamientos por localidad → detalle de Ubicacion_playa | Cumple | Select "Localidad" en la barra de filtros ([ListDrawer.tsx:81, 344](../src/components/Home/ListDrawer.tsx#L344)), aplicado en [useHomePage.ts:169](../src/hooks/useHomePage.ts#L169). Además, la búsqueda de texto. Se ve la dirección; el detalle muestra libres y total por tipo y lleva al mapa de plazas ([ParkingSpaceMap.tsx](../src/pages/ParkingSpace/ParkingSpaceMap.tsx)) | — |
| Listado de reservas por fecha (cod_reserva, monto) → detalle del cliente | Cumple | [OwnerReservations.tsx:85](../src/pages/Owner/OwnerReservations.tsx#L85) (fecha), [:65](../src/pages/Owner/OwnerReservations.tsx#L65) (Código e Importe), [:260](../src/pages/Owner/OwnerReservations.tsx#L260) (cliente). El código lo guarda el backend (R-26) | — |
| CUU Reservar | Cumple | [ReservationBookingDrawer.tsx:307](../src/components/Reservation/ReservationBookingDrawer.tsx#L307) → schema (fecha futura, horas enteras) → [Service.create:86](../../Backend/src/Reservation/Reservation.Service.ts#L86) (duración, horario, cobertura de turnos, que el vehículo no tenga otra reserva superpuesta) → [createReservationAtomically:212](../../Backend/src/Reservation/Reservation.Repository.ts#L212), transaccional y con la cochera bloqueada mientras elige la plaza libre del horario (409 si no hay; dos pedidos a la vez por la última plaza no la toman los dos) | — |
| CUU Registrar facturación | Cumple | El check-out del empleado llama a [Service.checkOut:333](../../Backend/src/Reservation/Reservation.Service.ts#L333): horas reservadas más extra, por la tarifa vigente (o la última del tipo si el dueño la dio de baja con el vehículo adentro), más servicios. Salida, plaza y factura se guardan en una sola transacción. El cobro pasa por [Invoice.Service.pay](../../Backend/src/Invoice/Invoice.Service.ts) | — |

## 2. Aprobación directa

Los CRUD de Usuario, Estacionamiento, Servicio, TipoVehículo, Vehículo y Ubicacion_playa, y los CUU de reservar y facturar, quedan como en la tabla anterior.

| Requisito | Estado | Evidencia | Qué falta |
|---|---|---|---|
| CRUD TurnoEmpleado | Cumple | Backend: CRUD clásico más semana tipo, días especiales y cierres en [EmployeeShift.Route.ts](../../Backend/src/EmployeeShift/EmployeeShift.Route.ts). El CRUD clásico guarda a través de la semana tipo, con las mismas reglas (R-02, R-05, R-06). Frontend: [OwnerShifts.tsx](../src/pages/Owner/OwnerShifts.tsx) | La UI trabaja por agenda, no sobre `/shifts/:id`. Hay que saber explicarlo en la defensa |
| CRUD PrecioVehículoHora | Cumple | Backend: [ParkingPrice.Route.ts](../../Backend/src/ParkingPrice/ParkingPrice.Route.ts). El alta vence la tarifa vigente. Frontend: [OwnerTariffs.tsx](../src/pages/Owner/OwnerTariffs.tsx) | — (cambiar el precio crea una versión nueva, coherente con `fecha_vigencia`) |
| CRUD PrecioServicio | Cumple, con matiz | Backend: [ServicePrice.Route.ts](../../Backend/src/ServicePrice/ServicePrice.Route.ts). El alta reemplaza el precio vigente. Frontend: [OwnerServices.tsx](../src/pages/Owner/OwnerServices.tsx) | No hay endpoint PUT; la modificación se hace versionando |
| CUU Registrar check-in (reemplaza a "Registrar confirmación", D-10) | Cumple | `POST /:id/check-in` → [Service.checkIn:360](../../Backend/src/Reservation/Reservation.Service.ts#L360): solo reservas PENDIENTE, dentro del horario reservado (R-13, R-16), solo el personal de esa sucursal, sin el vehículo adentro en otra sucursal; si la plaza sigue ocupada, la pasa a otra libre (R-21). Ocupa la plaza y la reserva pasa a EN CURSO. Frontend: "Registrar ingreso" en la terminal del empleado ([employee.lib.ts:58](../src/pages/Employee/employee.lib.ts#L58)) | Actualizar el proposal: el CUU "Registrar confirmación de reserva" pasa a "Registrar check-in" |
| CUU Registrar uso de un servicio | Cumple | El cliente los pide al reservar, y el personal los agrega o quita durante la estadía (R-24): `PUT /:id/services` → [Service.setServices:75](../../Backend/src/Reservation/Reservation.Service.ts#L75) y [EmployeeDashboard.tsx:217](../src/pages/Employee/EmployeeDashboard.tsx#L217). Se cobran en el check-out | — |

## 3. Voluntarios

| Requisito | Estado | Evidencia | Qué falta |
|---|---|---|---|
| Vehículos por tipo (patente, marca, modelo, seguro) → detalle del cliente | Cumple | [AdminVehicles.tsx](../src/pages/Admin/AdminVehicles.tsx): filtro por tipo, columnas y drawer del cliente | — |
| Resumen mensual por estado | Cumple, con matiz | [OwnerReservations.tsx:142, 180](../src/pages/Owner/OwnerReservations.tsx#L180): filtro por estado (finalizadas por defecto), código, desde, hasta y monto neto, con CSV | No muestra `tipo_reserva`, que no existe en el modelo (ver abajo) |
| Cancelación de reserva | Cumple | `DELETE /:id` → [Service.remove:170](../../Backend/src/Reservation/Reservation.Service.ts#L170): permisos (cliente, administrador o personal de esa sucursal), reglas por estado y anula la factura pendiente. Frontend: cliente, dueño y empleado. También se cancelan solas las vencidas sin ingreso (R-17) | — |
| Recordatorio de reserva | Cumple | `Service.sendReminders` ([Reservation.Service.ts](../../Backend/src/Reservation/Reservation.Service.ts)): deja una notificación en la app 2 horas antes del inicio, una sola vez, y reintenta si falla (R-28). El sistema no envía mails | Corre en memoria del proceso (L-27) |

**Agregado, fuera del listado:** el cliente puede valorar con estrellas una reserva finalizada (R-27, `valoracion_servicio` del DER). Es opcional y se hace una sola vez. El dueño ve la valoración en el detalle de la reserva y el promedio por sucursal en el resumen mensual.

## Veredicto

- **Regularidad:** cumple.
- **Aprobación directa:** cumple. Los 9 CRUD y los 4 CUU están completos.
- **Voluntarios:** los 4 están hechos. El resumen mensual tiene el matiz de `tipo_reserva`.

## Lo que queda

1. **Mergear a `main`** (esfuerzo bajo). Es lo único que bloquea que la cátedra lo vea.
2. **Autenticación** (hecha, sin commit; 3.1.1 la pide para la aprobación, ver [requisitos-tp.md](requisitos-tp.md)):
   - El login devuelve un JWT, y la identidad sale del token, no de un header ([auth.ts](../../Backend/src/Shared/middlewares/auth.ts)).
   - Cada ruta exige su rol (`auth`) y, cuando recibe el id del propio usuario, que sea el del token (`self`). `PUT /reservations/:id` solo lo usa el personal, y `assertStaffOf` sigue controlando la sucursal.
   - Cada recurso se controla contra su dueño: la cochera, el vehículo, la reserva y la factura (L-37, cerrada). Los feriados nacionales los carga el administrador y cada sucursal elige si cierra (D-09, L-38 cerrada).

## Próximas mejoras

Propuestas a partir de la valoración (R-27) y del uso del mapa. Ninguna está implementada.

1. **Valoración visible para los clientes.** Hoy solo la ven el cliente que la dejó y el dueño.
   - En la tarjeta del listado y en el detalle de la cochera, mostrar "★ 4,5 (12)".
   - `/api/parkings/active` devuelve `ratingAvg` y `ratingCount` por cochera, calculados en la consulta.
   - El promedio se muestra recién desde 3 valoraciones; antes, "Sin valoraciones suficientes", para que una sola reseña no defina la cochera.
2. **Valoración general para el dueño.** Hoy ve cada valoración en el detalle de la reserva, y el promedio por sucursal solo dentro del resumen mensual del mes elegido.
   - Agregar una columna "Valoración" por sucursal en el panel del dueño, con el promedio histórico y la cantidad.
3. **Comentario en la reseña.** Campo `ratingComment` opcional, de hasta 500 caracteres, que se carga junto con las estrellas.
   - Primero visible solo para el dueño.
   - Hacerlo público en el detalle de la cochera pide más: mostrar solo el nombre de pila, que el dueño pueda responder o reportar, y algún filtro de contenido.
4. **"Buscar en esta zona" reemplaza a los otros filtros de ubicación.** Hoy se acumula con el texto y la localidad: con "Localidad: Rosario" elegida, buscar en una zona de Funes deja el listado vacío.
   - La ubicación se elige de una sola forma a la vez, como en Airbnb o Google Maps.
   - "Buscar en esta zona" limpia el texto y la localidad.
   - Escribir o elegir una localidad descarta la zona (con el texto ya pasa; falta sumar la localidad).
   - El tipo de vehículo, el precio y el orden se mantienen.
5. **Nota para la cochera al reservar.** Campo opcional de hasta 200 caracteres (por ejemplo, "llego con portaequipajes").
   - Se ve en el panel del empleado y en el detalle del dueño.
   - Es distinta de la reseña: una es antes de la estadía y la otra después.
   - El formulario aclara que la nota no es un pedido confirmado.
   - No está en el proposal; es un agregado.

## Diferencias con el DER y el modelo de dominio

- **Reserva:** ya tiene `cod_reserva` (`code`, R-26) y `valoracion_servicio` (`rating`, R-27). No tiene `tipo_reserva`: el sistema solo tiene reservas online, así que sería siempre el mismo valor.
- **Vehículo:** marca, modelo y seguro son entidades (`Brand`, `Model`, `Insurance`), no atributos. El tipo se toma del modelo. Se agregaron color y año.
- **TipoVehículo:** no tiene `descripcion`. Con R-30, `ParkingSpace.vehicleType` y `ParkingPrice.vehicleType` son FK al tipo (antes eran texto con la categoría): un tipo que crea el administrador tiene sus propias plazas y tarifas, también en el check-out (`findForCheckout`). Probado contra MySQL con un tipo nuevo, una reserva y un check-out.
- **Usuario:** los subtipos Empleado y Cliente se resuelven con un campo `type` de texto. `ownerId` y `parkingId` del empleado son texto, no FK.
- **Estacionamiento:** la capacidad es la cantidad de plazas activas de cada tipo (R-30), no un atributo. Tiene horarios, latitud/longitud, provincia y barrio, que no están en el DER.
- **Turno_Empleado:** en el DER, `dias_semana` es un solo atributo; en el código hay una fila por día, con FK a la cochera. Se agregaron `DayException`, `ShiftClosure` y `Holiday`.
- **Factura:** `/monto_total` es derivado en el modelo, pero se guarda (`totalAmount`) junto con el detalle del cobro.
