# Revisión de alcance — Estacionamiento COM 301

Revisión del 2026-10-11 contra el [proposal](https://github.com/MagaIrisarri/TPDSW/blob/main/proposal.md). Se leyó el código local, sin ejecutar la app ni las pruebas:

- Backend: rama `prueba-valen-bk` (commit `25e9aa4`), 15 commits adelante de `origin/main`, con cambios sin commitear en `Reservation`, `ParkingSpace` e `Invoice`.
- Frontend: rama `prueba-valen-fr` (commit `afb326b`), con cambios sin commitear.

Lo que ve la cátedra en `main` puede no tener parte de lo que figura acá como hecho. Los números de línea son del momento de la revisión.

**Stack**
- **Backend:** Express 5, TypeScript, MikroORM 7 sobre MySQL y zod. Un módulo por entidad (`Entity/Schema/Repository/Service/Controller/Route`), montado en `src/index.ts`.
- **Frontend:** React 19 con Vite, React Router 7, axios y zustand. Pantallas por rol: cliente en Home/drawers, y Admin, Owner y Employee en `src/pages/`.

## 1. Regularidad

| Requisito | Estado | Evidencia | Qué falta |
|---|---|---|---|
| CRUD Usuario | Cumple | Backend: [User.Route.ts:25-42](../../Backend/src/User/User.Route.ts#L25-L42) (alta, login, edición, contraseña, baja lógica, reactivar). Frontend: registro en [AuthDrawer.tsx:161](../src/components/Auth/AuthDrawer.tsx#L161), edición y baja propias en [ProfileDrawer.tsx](../src/components/Profile/ProfileDrawer.tsx), listado, baja y alta de dueño en [AdminUsers.tsx](../src/pages/Admin/AdminUsers.tsx) | — |
| CRUD Estacionamiento | Cumple | Backend: [Parking.Route.ts:18-26](../../Backend/src/Parking/Parking.Route.ts#L18-L26). Frontend: alta y edición en [ParkingDrawer.tsx](../src/pages/Owner/ParkingDrawer.tsx), baja y reactivación en [OwnerDashboard.tsx](../src/pages/Owner/OwnerDashboard.tsx) | — |
| CRUD Servicio | Cumple | Backend: [ServiceCatalog.Route.ts:16-21](../../Backend/src/ServiceCatalog/ServiceCatalog.Route.ts#L16-L21). Frontend: [AdminService.tsx](../src/pages/Admin/AdminService.tsx) | — |
| CRUD TipoVehículo | Cumple | Backend: [VehicleType.Route.ts:16-21](../../Backend/src/Vehicle/VehicleType/VehicleType.Route.ts#L16-L21). Frontend: [AdminVehicleTypes.tsx](../src/pages/Admin/AdminVehicleTypes.tsx) | Le falta el atributo `descripcion` del DER. La baja es lógica y no revisa si hay modelos que usan el tipo |
| CRUD Vehículo (depende de TipoVehículo) | **Parcial** | El alta valida cliente activo, que el modelo exista y que marca y modelo coincidan. El tipo se toma del modelo ([Vehicle.Service.ts:20-48](../../Backend/src/Vehicle/Vehicle.Service.ts#L20-L48); `Model.vehicleType` es FK). Frontend: [VehiclesDrawer.tsx:138-168](../src/components/Vehicle/VehiclesDrawer.tsx#L138-L168) | **La edición está rota.** En [Vehicle.Schema.ts:17](../../Backend/src/Vehicle/Vehicle.Schema.ts#L17), `.partial()` solo vuelve opcional `body`, así que sus campos siguen obligatorios. Además, [Vehicle.Service.ts:51](../../Backend/src/Vehicle/Vehicle.Service.ts#L51) pasa `brandId/modelId/insuranceId` sin convertirlos en relaciones ni validarlos. Lo más probable es que cambiar marca, modelo o seguro no se guarde (visto en el código, no ejecutado). El tipo se hereda del modelo y no se puede elegir directo |
| CRUD Ubicacion_playa (depende de Estacionamiento) | Cumple | Backend: [ParkingSpace.Route.ts:25-35](../../Backend/src/ParkingSpace/ParkingSpace.Route.ts#L25-L35). Valida que la cochera esté activa en [ParkingSpace.Service.ts:27](../../Backend/src/ParkingSpace/ParkingSpace.Service.ts#L27). Frontend: [OwnerSpaces.tsx](../src/pages/Owner/OwnerSpaces.tsx) (alta masiva, edición, baja con reubicación) | La UI usa el alta masiva (PUT), no el POST individual |
| Listado de estacionamientos por localidad → detalle de Ubicacion_playa | Cumple, con matiz | Búsqueda en [useHomePage.ts:163](../src/hooks/useHomePage.ts#L163) (incluye `locality`). La dirección se ve en [ListDrawer.tsx:133](../src/components/Home/ListDrawer.tsx#L133). El detalle muestra libres y total por tipo y lleva al mapa de plazas en [ParkingSpaceMap.tsx:266](../src/pages/ParkingSpace/ParkingSpaceMap.tsx#L266) | No es un filtro por localidad: es una búsqueda de texto libre que filtra en el navegador. Si la cátedra pide un filtro literal, hay que agregar un select |
| Listado de reservas por fecha (cod_reserva, monto) → detalle del cliente | Cumple, con matiz | [OwnerReservations.tsx:84](../src/pages/Owner/OwnerReservations.tsx#L84) (filtro por fecha), [:64](../src/pages/Owner/OwnerReservations.tsx#L64) (columnas Código e Importe), [:246-248](../src/pages/Owner/OwnerReservations.tsx#L246-L248) (drawer del cliente) | `cod_reserva` no está en la base: el código es `'R-'` más 6 caracteres del UUID, armado en el frontend ([owner.lib.ts:255](../src/pages/Owner/owner.lib.ts#L255)) |
| CUU Reservar | Cumple | Flujo: [ReservationBookingDrawer.tsx:307](../src/components/Reservation/ReservationBookingDrawer.tsx#L307) → schema (fecha futura, horas enteras, inicio antes que fin) → [Service.create:84](../../Backend/src/Reservation/Reservation.Service.ts#L84) (duración mínima y máxima, horario, cobertura de turnos, que el vehículo no tenga otra reserva superpuesta) → [createReservationAtomically:162](../../Backend/src/Reservation/Reservation.Repository.ts#L162), transaccional, busca plaza libre en ese horario (409 si no hay) | — |
| CUU Registrar facturación | Cumple | El check-out en [EmployeeDashboard.tsx:197](../src/pages/Employee/EmployeeDashboard.tsx#L197) llama a [Service.checkOut:279](../../Backend/src/Reservation/Reservation.Service.ts#L279): horas reservadas más extra, por la tarifa vigente, más servicios. Crea la factura con ese detalle. El cobro está en [:198](../src/pages/Employee/EmployeeDashboard.tsx#L198) → [Invoice.Service.pay:36](../../Backend/src/Invoice/Invoice.Service.ts#L36) | — |

## 2. Aprobación directa

Los CRUD de Usuario, Estacionamiento, Servicio, TipoVehículo, Vehículo y Ubicacion_playa, y los CUU de reservar y facturar, quedan como en la tabla anterior.

| Requisito | Estado | Evidencia | Qué falta |
|---|---|---|---|
| CRUD TurnoEmpleado | Cumple | Backend: CRUD clásico más semana tipo, días especiales y cierres en [EmployeeShift.Route.ts:24-45](../../Backend/src/EmployeeShift/EmployeeShift.Route.ts#L24-L45). Frontend: [OwnerShifts.tsx](../src/pages/Owner/OwnerShifts.tsx) con saveDay, resetDay, saveTemplateDay y getRange | La UI trabaja por agenda, no sobre `/shifts/:id`. Hay que saber explicarlo en la defensa |
| CRUD PrecioVehículoHora | Cumple | Backend: [ParkingPrice.Route.ts:17-24](../../Backend/src/ParkingPrice/ParkingPrice.Route.ts#L17-L24). El alta vence la tarifa vigente ([Service:8-23](../../Backend/src/ParkingPrice/ParkingPrice.Service.ts#L8-L23)). Frontend: [OwnerTariffs.tsx:70,79](../src/pages/Owner/OwnerTariffs.tsx#L70) | — (cambiar el precio crea una versión nueva, coherente con `fecha_vigencia`) |
| CRUD PrecioServicio | Cumple, con matiz | Backend: [ServicePrice.Route.ts:17-33](../../Backend/src/ServicePrice/ServicePrice.Route.ts#L17-L33). El alta reemplaza el precio vigente ([Service:16-30](../../Backend/src/ServicePrice/ServicePrice.Service.ts#L16-L30)). Frontend: [OwnerServices.tsx:52,62,70](../src/pages/Owner/OwnerServices.tsx#L52) | No hay endpoint PUT; la modificación se hace versionando |
| CUU Registrar confirmación | Cumple | `PATCH /:id/confirm` → [Service.confirm:230](../../Backend/src/Reservation/Reservation.Service.ts#L230): solo reservas PENDIENTE y solo el personal de esa sucursal. Frontend: [EmployeeDashboard.tsx:195](../src/pages/Employee/EmployeeDashboard.tsx#L195) | — |
| CUU Registrar uso de un servicio | **Parcial** | El cliente elige servicios al reservar (`serviceIds`); `attachServices` valida que tengan precio vigente en esa cochera y se cobran en el check-out | Que el empleado registre un servicio durante la estadía solo existe en el backend (`PUT /:id/services`, [Route:33](../../Backend/src/Reservation/Reservation.Route.ts#L33), [Service.setServices:73](../../Backend/src/Reservation/Reservation.Service.ts#L73)), sin commitear y sin ninguna pantalla que lo use |

## 3. Voluntarios

| Requisito | Estado | Evidencia | Qué falta |
|---|---|---|---|
| Vehículos por tipo (patente, marca, modelo, seguro) → detalle del cliente | Cumple | [AdminVehicles.tsx:37](../src/pages/Admin/AdminVehicles.tsx#L37) (filtro por tipo), [:53](../src/pages/Admin/AdminVehicles.tsx#L53) (columnas), [:83-90](../src/pages/Admin/AdminVehicles.tsx#L83-L90) (drawer del cliente) | — |
| Resumen mensual por estado | **Parcial** | [OwnerReservations.tsx:140](../src/pages/Owner/OwnerReservations.tsx#L140) y [:177](../src/pages/Owner/OwnerReservations.tsx#L177): muestra código, desde, hasta y monto neto | El estado está fijo en `'finalizada'`, no hay filtro. `tipo_reserva` no existe en el modelo |
| Cancelación de reserva | Cumple | `DELETE /:id` → [Service.remove:157](../../Backend/src/Reservation/Reservation.Service.ts#L157): permisos, reglas por estado y anula la factura pendiente; queda en estado CANCELADA ([Repo:151](../../Backend/src/Reservation/Reservation.Repository.ts#L151)). Frontend: cliente en [useHomePage.ts:149](../src/hooks/useHomePage.ts#L149), además del dueño y el empleado. También se cancelan solas las vencidas sin ingreso (`src/index.ts` del backend) | — |
| Recordatorio por email | **Falta** | No encontrado: no hay librería de mail en el `package.json` del backend y buscar `mail\|reminder\|recordatorio` en los dos `src` no da resultados | Todo |

## Veredicto

- **Regularidad:** casi. Todo cumple salvo la edición de Vehículo, que está rota (Parcial).
- **Aprobación directa:** todavía no. De 9 CRUD, 8 cumplen y Vehículo es Parcial. De 4 CUU, 3 cumplen y "uso de un servicio" es Parcial.
- **Voluntarios:** de 4, 2 están hechos, 1 parcial y 1 sin hacer.

Antes de todo lo demás: commitear y mergear a `main`, porque la cátedra evalúa lo que está en GitHub.

## Los 5 faltantes más importantes

1. **Arreglar la edición de Vehículo** (esfuerzo bajo). Corregir el schema, convertir los ids en relaciones y validar que marca y modelo coincidan, igual que en el alta.
2. **Uso de servicio por el empleado** (esfuerzo medio). Commitear `PUT /:id/services` y agregar el selector de servicios en EmployeeDashboard.
3. **Guardar `cod_reserva`** (esfuerzo bajo a medio). Hoy se arma en el frontend a partir del UUID, así que puede repetirse y no se puede buscar en el backend.
4. **Filtro explícito por localidad** (esfuerzo bajo). Un select o un parámetro en `/parkings/active`, para cumplir el pedido al pie de la letra.
5. **Autenticación** (esfuerzo alto). No es un requisito del listado, pero es un riesgo en la defensa:
   - La identidad sale del header `x-user-id` ([Reservation.Controller.ts:61-109](../../Backend/src/Reservation/Reservation.Controller.ts#L61)), y cualquiera puede mandarlo con el id que quiera.
   - `PUT /reservations/:id` permite cambiar `status` y `attendedById` sin controlar quién lo pide.
   - Los endpoints de usuarios no tienen protección.

## Diferencias con el DER y el modelo de dominio

- **Reserva:** no tiene `cod_reserva` (es un UUID), ni `tipo_reserva`, ni `valoracion_servicio`.
- **Vehículo:** marca, modelo y seguro son entidades (`Brand`, `Model`, `Insurance`), no atributos. El tipo se toma del modelo. Se agregaron color y año.
- **TipoVehículo:** no tiene `descripcion`. Además, `ParkingSpace.vehicleType` y `ParkingPrice.vehicleType` son texto, no FK al tipo. Si se crea un tipo nuevo que no coincide con AUTO, MOTO o CAMIONETA, no tiene plazas, y el check-out falla con un 500 porque no encuentra tarifa.
- **Usuario:** los subtipos Empleado y Cliente se resuelven con un campo `type` de texto. `ownerId` y `parkingId` del empleado son texto, no FK.
- **Estacionamiento:** tiene `truckCapacity`, horarios, latitud/longitud, provincia y barrio, que no están en el DER.
- **Turno_Empleado:** en el DER, `dias_semana` es un solo atributo; en el código hay una fila por día, con FK a la cochera. Se agregaron `DayException`, `ShiftClosure` y `Holiday`.
- **Factura:** `/monto_total` es derivado en el modelo, pero se guarda (`totalAmount`) junto con el detalle del cobro.
