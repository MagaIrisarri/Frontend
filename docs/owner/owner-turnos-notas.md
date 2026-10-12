# Owner · Turnos y feriados — limitaciones y notas de implementación

Oct 10, 2026 · documento vivo: se actualiza al resolver cada código

## Alcance

Este documento junta lo que el prototipo `docs/owner/prototipo-owner.html` resuelve de forma simplificada, para que el código real lo tenga en cuenta. Cubre turnos, feriados, reservas y resúmenes del rol dueño.

Cada regla tiene un código para citarla en tareas: **R-** reglas de negocio, **L-** limitaciones, **D-** decisiones abiertas.

**Cómo mantenerlo:** al resolver un L-xx o cerrar un D-xx, actualizar su columna Estado con el hash del commit. En el código, todo atajo se marca `// shortcut: L-xx, <límite>, <cuándo mejorar>`; `grep -rn "shortcut:" Backend/src Frontend/src` debe coincidir con las filas abiertas de este documento.

Estado al 10/10/2026: fases 1 a 3 implementadas. Commits: Backend `d8e7c10` (rama prueba-valen-bk), Frontend `fa0cdc9` (rama prueba-valen-fr). Los códigos R-01 a R-12, D-01, D-04, D-05, D-06, L-05 y L-22 quedan resueltos con esos commits; los marcados "Parcial" o "Abierta" siguen pendientes. Después: Backend `a23eec2` (rama prueba-valen-bk) y Frontend `60f4c27` (rama recuperar-admin-empleado) implementan R-13 a R-20 y avanzan L-23 (paneles de empleado y administrador).

## Estados de un feriado

Decidido (D-01): dos estados por sucursal, **Cerrada** (por defecto) y **Abre** (con los turnos de ese día de la semana). Editar el día en "Por fecha" crea una excepción y el calendario lo marca **Modificado ↺** (restablecer vuelve a la semana tipo). La opción "Horario especial" del prototipo no se implementó.

| Aspecto | Cerrada | Abre |
| --- | --- | --- |
| Qué se guarda | Nada (es el valor por defecto) | Fila `HolidayParking` |
| Si cambia la semana tipo | No aplica | El feriado cambia con ella, salvo que tenga excepción |
| Etiqueta en el calendario | Feriado | Feriado · abre / Modificado ↺ |
| Cerrar con reservas activas o pendientes | Se rechaza (R-10) | — |

## Reglas de negocio

| Código | Regla | Estado |
| --- | --- | --- |
| R-01 | Cada franja del horario de la sucursal necesita al menos un empleado. Las horas sin cobertura no admiten reservas. | Implementada. Backend: `ScheduleService.assertCovered` al crear reservas; solo si la sucursal ya tiene turnos (`shortcut: R-01`). Frontend: huecos y % de cobertura. |
| R-02 | Los turnos no se solapan. Al mover o estirar un turno sobre otro, el movido se queda con el horario y el otro se recorta, se divide o desaparece. | Implementada. Frontend `place()`; backend rechaza solapes (`normalizeDay`, `findOverlappingInParking`). |
| R-03 | Soltar un empleado sobre un turno lo divide 50/50 (el nuevo toma la mitad donde se soltó). Sobre un hueco, lo cubre entero. | Implementada en frontend (`dropOn`). |
| R-04 | Los turnos contiguos del mismo empleado se fusionan. | Implementada en frontend y backend. |
| R-05 | "Cerrado" se coloca igual que un empleado. Se rechaza si hay reservas activas o pendientes, de cualquier empleado, en ese horario. | Implementada (día, semana tipo y cierre suelto). |
| R-06 | No se puede quitar, mover ni recortar el turno de un empleado con reservas activas o pendientes en ese horario. Excepción: si otro empleado lo reemplaza, las reservas se transfieren en un solo paso con confirmación, y solo si quedan dentro del nuevo turno. | Implementada: 409 con detalle + confirmación "Transferir y aplicar". Cambios entre días distintos no ofrecen transferencia. La edición fila por fila de `/api/shifts/:id` guarda a través de la semana tipo con las mismas reglas, sin transferencia: si deja reservas sin su empleado responde 409 (Backend `da0b04b`). |
| R-07 | Toda reserva tiene un empleado asignado ("Registrada por"), editable mientras está en curso o reservada. | Parcial: editable en el detalle de la reserva, solo por el personal de la sucursal y con un empleado de esa sucursal (Backend `e1ea225`). Un empleado con turnos cargados o reservas activas asignadas no se da de baja (409, Backend `da0b04b`). No es obligatorio: las reservas online y las ya guardadas tienen `attendedBy` nulo hasta el check-in. |
| R-08 | Aviso de jornada: ámbar por encima de 8 h por día y rojo por encima de 12 h. No bloquea. | Implementada en frontend. |
| R-09 | Las fechas pasadas son de solo lectura. Hoy y el futuro se editan hasta unos 6 meses adelante. | Implementada (backend y frontend). Horizonte en `PLANNING_HORIZON_MONTHS`, ver D-06. |
| R-10 | Los feriados son una lista general del dueño. Cada sucursal cierra por defecto y guarda solo lo que cambia. No se cierra un feriado con reservas activas o pendientes. | Implementada. El alta de un feriado se rechaza (409 con `details.conflicts`) si alguna sucursal tiene reservas activas o pendientes ese día (Backend `da0b04b`). |
| R-11 | Cambiar la semana tipo no pisa las excepciones por fecha ya cargadas. | Implementada (probada en `Schedule.db.test.ts`). |
| R-12 | Una excepción idéntica a la semana tipo se descarta sola. | Implementada. |
| R-13 | No se registra el ingreso (check-in) de una reserva cuyo horario ya terminó. | Implementada (Backend `a23eec2`, Frontend `60f4c27`). Backend: `ReservationService.checkIn` responde 400 "La reserva ya venció". Frontend: la terminal del empleado no lista pendientes ni confirmadas vencidas. |
| R-14 | En el check-out se cobran las horas reservadas aunque el cliente se retire antes; si se queda más, se suman las horas extra. Cada hora empezada cuenta entera, con 10 min de gracia después del fin reservado. Los servicios se suman aparte. | Implementada (Backend `a23eec2`, Frontend `60f4c27`). Backend: `ReservationService.checkOut` cobra `max(1, horas reservadas, horas desde el inicio)` × tarifa activa. La factura guarda el detalle (`reservedHours`, `extraHours`, `hourlyRate` vigente al cobrar y `servicesAmount`) y se muestra en el detalle de la reserva del empleado y del dueño y en "Mis facturas". Las facturas anteriores al detalle muestran solo el total. Servicios (Backend `54c16f1`, Frontend `e72f90c`): se asocian a la reserva por la tarifa del servicio en esa cochera (`ServicePrice.id`). Antes el alta mandaba el id del catálogo y el backend los descartaba sin avisar, así que no se cobraban ni se veían. Ahora el alta rechaza (400) un servicio que no sea una tarifa vigente de la cochera; "Mis reservas", "Mis facturas" y los detalles del empleado y del dueño listan cada servicio con su precio. Gracia de salida (Backend `020a8ac`): `CHECKOUT_GRACE_MINUTES` (10) en `src/Shared/constants/schedule.ts`; pasada la gracia, la hora extra se cuenta desde el fin reservado. La terminal no la muestra todavía. |
| R-16 | Tampoco se registra el ingreso antes del inicio reservado (sin tolerancia). Las horas previas no se cobran porque no se permiten. | Implementada (Backend `a23eec2`, Frontend `60f4c27`). Backend: `ReservationService.checkIn` responde 400 "La reserva empieza a las HH:mm". Frontend: "Registrar ingreso" deshabilitado con aviso hasta el inicio. Sin tolerancia en la entrada (decidido); la gracia está en la salida (R-14). |
| R-17 | Una reserva pendiente o confirmada cuyo horario de fin pasó sin ingreso se cancela sola. | Implementada (Backend `a23eec2`, Frontend `60f4c27`). Backend: al arrancar y cada `EXPIRED_RESERVATIONS_CHECK_MINUTES` (5) minutos, `ReservationService.cancelExpired` (`index.ts`, `shortcut: R-17`: tarea en memoria del proceso, pasar a un job programado si el backend corre en varias instancias). No se distingue "cancelada por vencimiento" de "cancelada por el cliente". |
| R-18 | El dueño gestiona las plazas de cada sucursal desde su panel (Plazas): agrega, pasa a mantenimiento, vuelve a habilitar y da de baja. No se saca de servicio una plaza con un vehículo adentro (reserva en curso, aunque se haya pasado de hora, o marcada ocupada a mano) ni con reservas vigentes o programadas. Las plazas en mantenimiento no cuentan como libres ni ocupadas. Agregar o dar de baja ajusta la capacidad de la sucursal. | Implementada (Backend `a23eec2`, Frontend `60f4c27`). Backend: `ParkingSpaceService.assertCanTakeOutOfService` y `adjustCapacity`; `maintenance*Spaces` en la respuesta de la sucursal. Frontend: `/owner/spaces` (reemplaza la pantalla vieja `/my-parkings/:id/spaces`, que ahora redirige). Los permisos sobre las rutas de plazas siguen pendientes (L-23). |
| R-19 | Al pasar una plaza a mantenimiento o darla de baja, sus reservas futuras (pendientes o confirmadas) se pasan a otra plaza libre del mismo tipo sin choque de horario (con el margen de la sucursal). El dueño ve la lista con la plaza propuesta para cada una y confirma; si alguna no tiene lugar, no se hace nada. La capacidad de la sucursal ya no se edita en "Editar sucursal": solo se carga al crearla y después la ajustan las altas y bajas de plazas. | Implementada (Backend `a23eec2`, Frontend `60f4c27`). Backend: `ParkingSpaceRepository.takeOutOfService` (una transacción; 409 con `details.conflicts` y `relocate` para confirmar); `updateParkingSchema` descarta las capacidades. Frontend: `RelocateModal` en Plazas; `ParkingDrawer` y `ParkingForm` sin capacidades al editar. |
| R-20 | El administrador ve todos los usuarios, los da de baja o los reactiva y da de alta dueños. La baja (la pida el administrador o el propio usuario desde su perfil) no se permite a un cliente con reservas pendientes, confirmadas o en curso, ni a un dueño con sucursales activas. El administrador no puede darse de baja a sí mismo desde el panel. | Implementada (Backend `a23eec2`, Frontend `60f4c27`). Backend: `UserService.remove` (409). Frontend: `/admin/users` (`AdminUsers.tsx`), con el detalle de cocheras de cada dueño (datos, ocupación, reservas finalizadas y facturado). Inicio del administrador (`/admin`, `AdminDashboard.tsx`): usuarios, cocheras y plazas hoy; reservas y facturación de los últimos `STATS_PERIOD_DAYS` (30) días contra los 30 anteriores, y ranking de cocheras por facturación (`GET /api/stats/summary`, módulo `Stats` del Backend). Además: Vehículos (listado por tipo con patente, marca, modelo, seguro y detalle del cliente), Marcas (solo listar) y Seguros (listar y agregar). El registro público sigue permitiendo elegir "dueño". |
| R-15 | El empleado puede cambiar la plaza de una reserva pendiente, confirmada o en curso, con las mismas reglas que al reservar: misma sucursal, tipo de vehículo compatible, plaza libre y activa, y sin otra reserva en el horario (con el margen de la sucursal). Si el vehículo ya entró, se libera la plaza anterior y se ocupa la nueva. | Implementada (Backend `a23eec2`, Frontend `60f4c27`). Backend: `PATCH /api/reservations/:id/space` (`ReservationRepository.changeSpace`). Frontend: selector de plaza en el detalle de la reserva del empleado. |
| R-21 | Si el cliente se queda más tiempo de lo reservado, su vehículo sigue ocupando la plaza. Al registrar el ingreso de la reserva siguiente de esa plaza, la reserva pasa sola a la primera plaza libre del mismo tipo (R-22) y entra ahí; si no hay ninguna, no se registra el ingreso. La salida no deja libre una plaza donde ya hay otro vehículo. La lista de hoy del empleado incluye a quien sigue adentro desde un día anterior y lo marca "Se pasó de hora"; las horas extra se cobran en la salida (R-14). El empleado puede cambiar la plaza a mano en el detalle de la reserva (R-15). | Implementada (Backend `54c16f1`, Frontend `e72f90c`). Backend: `ReservationService.checkIn` (`ReservationRepository.findInProgressOnSpace` y `freeSpacesFor`; 409 "La plaza X sigue ocupada por PATENTE, que se pasó de hora, y no hay otra plaza libre…"); `checkOut` solo libera la plaza si no hay otra reserva en curso en ella. Frontend: `EmployeeDashboard` (lista de hoy, etiqueta, aviso en el detalle y "Ingreso … registrado en la plaza A-03: la A-01 seguía ocupada"). |
| R-22 | Una plaza está libre para un horario si está activa, fuera de mantenimiento, es del tipo del vehículo y no tiene otra reserva activa en ese horario con el margen de la sucursal (un vehículo que se pasó de hora la ocupa al menos hasta ahora). Que hoy tenga un vehículo adentro solo importa si el horario ya empezó: una cochera llena ahora acepta reservas para más tarde. Es la misma regla al reservar (automática o eligiendo plaza), al cambiar la plaza (R-15), en la disponibilidad, al reubicar (R-19) y en el ingreso (R-21). | Implementada (Backend `54c16f1`). Backend: `findFreeSpaces` en `ParkingSpace.Repository.ts` (reemplaza cinco consultas que exigían la plaza libre ahora). |
| R-23 | El personal de la sucursal extiende el fin de una reserva pendiente, confirmada o en curso (p. ej. el cliente avisa que se queda más), en horas enteras y con las mismas reglas que al reservar: duración máxima, horario de atención, empleado de turno (R-01) y sin otra reserva del mismo vehículo. Las reservas de la misma plaza que todavía no entraron y chocan con el horario nuevo pasan a la primera plaza libre de su tipo (R-22); si alguna no tiene lugar o hay otro vehículo adentro, no se cambia nada. | Implementada (Backend `54c16f1`, Frontend `e72f90c`). Backend: `PATCH /api/reservations/:id/end` (`ReservationService.extend`, `ReservationRepository.extend` en una transacción; responde las reservas movidas). Frontend: "Extender…" en el detalle de la reserva del empleado (1 a 3 horas más), con aviso de las reservas que pasaron a otra plaza. |
| R-24 | El personal de la sucursal agrega o quita servicios de una reserva pendiente, confirmada o en curso; se cobran en la salida (R-14). Solo se agregan tarifas vigentes de esa cochera; los que ya estaban pedidos se conservan con su precio aunque la tarifa haya cambiado después. | Implementada (Backend `54c16f1`, Frontend `e72f90c`). Backend: `PUT /api/reservations/:id/services` (`ReservationService.setServices`, `ReservationRepository.setServices`). Frontend: servicios tildables en el detalle de la reserva del empleado. |
| R-25 | Al editar un vehículo, marca y modelo tienen que coincidir y el tipo sale del modelo, igual que en el alta. No se cambia el tipo de un vehículo con reservas pendientes, confirmadas o en curso, porque su plaza es de ese tipo. | Implementada (Backend `282e86d`, Frontend `b25da64`). Backend: `VehicleService.update` con `resolveModel` (compartido con el alta) y `VehicleRepository.countActiveReservations`; antes la edición no guardaba marca, modelo ni seguro. Probada en `Vehicle.db.test.ts`. Frontend: al editar, un seguro vacío se manda como `null` y lo quita. |
| R-26 | Cada reserva tiene un código (`cod_reserva` del DER): `R-` y 6 caracteres, único y guardado en la base. Si el que sale del id ya existe, se elige otro id. | Implementada (Backend `99802ae`, Frontend `d00ae2a`). Backend: `Reservation.code` (`reservationCode`), lo genera `createReservationAtomically`; al arrancar, `fillMissingCodes` completa las reservas anteriores con el mismo código que ya mostraba la interfaz. Frontend: `normRes` usa el `code` del backend. |
| R-27 | El cliente puede valorar, si quiere, una reserva finalizada con 1 a 5 estrellas, una sola vez. Solo la valora el cliente de esa reserva. | Implementada (Backend `99802ae`, Frontend `d00ae2a`). Backend: `PATCH /api/reservations/:id/rating` (`ReservationService.rate`). Frontend: estrellas en Mis reservas (`components/Owner/ui/Stars.tsx`); el dueño la ve en el detalle de la reserva y el promedio por sucursal en el resumen mensual. |
| R-28 | Se manda un recordatorio por email al cliente `REMINDER_HOURS_BEFORE` (2) horas antes del inicio de una reserva pendiente o confirmada, una sola vez. Una reserva creada dentro de esa ventana lo recibe en la vuelta siguiente (`REMINDER_CHECK_MINUTES`, 5 min). Si el envío falla, se reintenta en la vuelta siguiente. | Implementada (Backend `99802ae`). Backend: `ReservationService.sendReminders`, `Reservation.reminderSentAt` y `Shared/utils/mailer.ts` (SMTP con `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` y `MAIL_FROM`; sin `SMTP_HOST` el mail se escribe en la consola). Ver L-27. |
| R-29 | El empleado registra en el mostrador a un cliente sin reserva: el inicio es la hora actual sin segundos y el fin, inicio + N horas completas (mínimo 1, hasta el cierre del mismo día); la reserva nace en curso con la plaza ocupada. Un vehículo que sigue adentro en cualquier sucursal (aunque pasado de hora) no entra de nuevo. La reserva guarda quién registró el ingreso, quién la salida y la hora real de salida. El empleado carga nombre, apellido, DNI y email del cliente (teléfono opcional): si el email no tiene cuenta, se crea una con el DNI como contraseña. El cliente entra con email y DNI y no puede registrar vehículos ni reservar hasta cambiarla por una de 6 caracteres o más que no sea su DNI (403; el perfil se abre solo y lo pide); nacimiento y teléfono los completa cuando quiera; si la tiene, el vehículo queda a su nombre. | Backend implementado (`020a8ac`; cuenta con el DNI: ver el commit siguiente): `POST /api/reservations/walk-in`, `checkedInBy`/`checkedOutBy`/`checkedOutAt`, extender en horas completas desde el inicio. Frontend pendiente. Diseño en `docs/employee/diseno-empleado-mostrador.md`. |

## Modelo de datos

Orden de lectura de un día: excepción de esa fecha si existe; si no, feriado cerrado; si no, la semana tipo.

| Entidad del documento | Implementación | Notas |
| --- | --- | --- |
| TurnoEmpleado (semana tipo) | `EmployeeShift` (existente) | Una fila por día; `PUT /api/shifts/template/:parkingId/:dayOfWeek` reemplaza el día entero. |
| CierrePlantilla | `ShiftClosure` | |
| ExcepcionDia + ExcepcionTurno / ExcepcionCierre | `DayException` con `shifts` y `closures` en JSON | Copia completa del día (D-02). Sin "creada por / creada en" (ver L-16). |
| Feriado | `Holiday` | `origin`: oficial o manual. |
| FeriadoSucursal | `HolidayParking` | Solo existe si la sucursal abre. |
| Reserva | `Reservation.attendedBy` | Ver R-07. |
| AuditoriaTurno | No implementada | Ver L-16. |

## Limitaciones

| Código | Área | Limitación del prototipo | Qué hacer al implementar | Estado |
| --- | --- | --- | --- | --- |
| L-01 | Historial | No guarda cómo era la semana tipo en el pasado. | Versionar la plantilla con vigencia o guardar los turnos de cada fecha al terminar el día. | Abierta. Las horas del mes usan la plantilla de hoy. |
| L-02 | Horas trabajadas | Son horas programadas, no asistencia real. | Fichaje o ajuste manual auditado. | Abierta (D-07). |
| L-03 | Hoy | Se puede editar hoy aunque ya pasaron horas. | Bloquear las franjas anteriores a la hora actual. | Abierta. |
| L-04 | Zona horaria | "Hoy" sale del reloj del navegador. | Calcular en el servidor con la zona de la sucursal. | Parcial: el backend valida con su reloj (`TZ=America/Argentina/Buenos_Aires`); el frontend sigue usando el navegador. |
| L-05 | Validación | Todas las reglas corren en el frontend. | Replicarlas en el backend. | Resuelta: el backend valida y el frontend anticipa. |
| L-06 | Concurrencia | No hay control de ediciones simultáneas. | Control optimista por sucursal y fecha; transacción única al transferir. | Parcial: transferencia y cambio van en un solo flush (una transacción). Falta control optimista. |
| L-07 | Transferencia de reservas | No verifica que el destino esté libre ni avisa a nadie (el aviso en la app: L-30). | Validar disponibilidad y notificar. | Abierta. |
| L-08 | Reservas largas | Las validaciones miran solo la fecha de inicio. | Usar el intervalo completo, contemplar medianoche. | Parcial: dentro del día se usa el intervalo completo; las que cruzan medianoche se miden solo en su fecha de inicio. |
| L-09 | Medianoche | "23:59" hace de 24:00; no hay turnos nocturnos. | Minutos o fecha de fin. | Abierta. |
| L-10 | Granularidad | Bloques fijos de 30 minutos. | Definir si se parametriza. | Abierta. |
| L-11 | Excepción por fecha | Es una copia del día. | Decidir copia o diferencias (D-02). | Decidida: copia. |
| L-12 | Feriados | Fechas de ejemplo; traslados manuales. | Fuente oficial, ajustes, revisión anual. | Parcial: seed 2026 con 16 feriados nacionales (date.nager.at, contrastado con argentinadatos.com) + alta manual. Faltan puentes y 2027. Verificar contra el Boletín Oficial. Plan: el administrador carga y actualiza la lista oficial (feriados, traslados, puentes) y los dueños solo eligen qué hace cada sucursal; hoy el dueño los agrega a mano. Fuente evaluada para esa carga: argentinadatos.com (ver «Fuente de feriados para el administrador»). Para después. |
| L-13 | Feriado parcial | Cerrado cierra todo el día. | Confirmar "cerrar desde la hora X". | Abierta: hoy se abre el día y se agrega un "Cerrado". |
| L-14 | Jornada laboral | Topes fijos de 8 y 12 h; no bloquean. | Parametrizar según convenio. | Abierta. |
| L-15 | Deshacer | Vive en el navegador. | Acciones compensatorias o historial. | Abierta: "Deshacer" vuelve a guardar el estado anterior. |
| L-16 | Auditoría | No registra quién cambió qué. | Usuario, fecha, antes y después. | Abierta. |
| L-17 | Importes | Neto = importe / 1,21. | Neto e IVA de la facturación real. | Parcial: el importe ya sale de la factura (`amount`); el neto sigue siendo /1,21. |
| L-18 | Descargas | CSV en el navegador. | Servidor si crece; XLSX si se pide. | Abierta. |
| L-19 | Móvil y táctil | Mover y estirar solo con mouse. | Alternativa táctil. | Abierta (en táctil se tocan empleados de la paleta). |
| L-20 | Accesibilidad | Sin prueba con lector de pantalla. | Auditoría WCAG. | Abierta: hay teclado (flechas, Suprimir, Escape, menús). |
| L-21 | Modo claro | No revisado en vista por fecha, feriados y resumen. | Revisar contrastes. | Abierta. |
| L-22 | Datos | Ids de ejemplo en memoria. | Ids del servidor. | Resuelta. |
| L-23 | Roles | Solo existe el rol dueño. | Permisos y dashboard de empleado. | Parcial (Backend `a23eec2`, Frontend `60f4c27`, rama Frontend `recuperar-admin-empleado`). Se rehicieron con el estilo y los componentes del panel del dueño (`PanelBar` compartida). Empleado (`/employee`): reservas de su sucursal por fecha, con filtros y detalle en cajón para confirmar, registrar ingreso y salida, cambiar la plaza (R-15), cancelar y cobrar (también una factura que quedó por cobrar). Administrador (`/admin`): ABM de tipos de vehículo y del catálogo de servicios (`AdminCatalog`). Cada rol ve solo su panel. Backend: confirmación, ingreso, salida y cambio de plaza solo los hace un empleado activo de la sucursal o su dueño (`ReservationService.assertStaffOf`, 403; la confirmación desde Backend `cbf17d7`, Frontend `6fe87fc`). Falta: autenticación real (hoy el usuario llega en `x-user-id` sin token) y permisos en cobrar y los ABM del administrador. |
| L-24 | Horizonte | 52 semanas atrás y 26 adelante. | Acordar con negocio. | Abierta (mismos valores). |
| L-25 | Empleados | Un empleado pertenece a una sola sucursal. | Confirmar rotación. | Parcial: el frontend no cambia de sucursal a quien tiene turnos o reservas pendientes. |
| L-26 | Buscar en esta zona | El filtro del mapa es local e instantáneo; el spinner dura un mínimo fijo (500 ms) para que se perciba. | Atarlo a la carga real si la búsqueda pasa al servidor. | Abierta. |
| L-27 | Recordatorios | La tarea de recordatorios (R-28) corre en memoria del proceso cada `REMINDER_CHECK_MINUTES`, como la de vencidas (R-17); no hay cola ni reintento con espera. | Pasar a un job programado o una cola si el backend corre en varias instancias. | Abierta (Backend `99802ae`, `src/index.ts`). |
| L-28 | Año del vehículo | `vehiculos.json` no trae años por modelo y el DNRPA no ofrece API pública: el año es opcional y solo se acota entre 1960 y el año próximo (`MIN_VEHICLE_YEAR`, duplicado en `Backend/src/Vehicle/Vehicle.Schema.ts` y `Frontend/src/utils/plate.ts`). | Cargar los años de producción de cada modelo en el catálogo y validar contra ellos. | Abierta. |
| L-29 | Notificaciones (reubicación) | Al extender una reserva (R-23), las reservas siguientes que se pasan a otra plaza (`moved`) no avisan a sus clientes; solo se avisa al de la reserva extendida. | Devolver el cliente en `moved` y notificarlo. | Abierta. |
| L-30 | Notificaciones (transferencias) | Las transferencias de reservas por turnos o feriados no notifican al empleado destino (ver L-07). | Notificar al empleado asignado en `Schedule.Service`. | Abierta. |
| L-31 | Notificaciones (entrega) | Se piden por polling cada 30 s (pausado con la pestaña oculta) y se listan las últimas 50 por usuario, sin purga ni paginación. | Pasar a SSE si hace falta inmediatez; purgar o paginar con uso real. | Abierta. |
| L-32 | Notificaciones (recordatorio) | El aviso en la app del recordatorio (R-28) sale junto con el mail: un cliente sin email, o con el envío fallando, no lo recibe. | Separar el aviso del mail en `sendReminders`. | Abierta. |
| L-33 | Catálogo del DNRPA (tipos) | La importación omite los tipos que no son de pasajeros con una lista fija de palabras (acoplado, semirremolque, tractor, chasis, ómnibus, minibús…). `vehiculos.json` ya trajo algunos como AUTO y no se limpian. | Revisar la lista si el DNRPA cambia sus descripciones; limpiar el catálogo sembrado. | Abierta. |
| L-35 | Alta de empleado (dueños) | El selector de dueños del panel del administrador trae hasta 100 dueños activos. | Pasar a un buscador si hay más. | Abierta. |
| L-36 | Cuenta creada en el mostrador | El email que carga el empleado no se verifica (no hay mails ni SMS) y la contraseña inicial es el DNI, que conoce quien tenga los datos del cliente. Un email mal escrito deja la cuenta con un email ajeno; el administrador puede corregirlo. | Verificar el email con un enlace cuando haya envío de mails. El cambio de contraseña ya se exige antes de cargar vehículos o reservar (`mustChangePassword`). | Abierta (`Reservation.Repository.createWalkIn`). |
| L-34 | Catálogo del DNRPA (permiso) | `POST /api/catalog/import` comprueba que `x-user-id` sea un administrador activo, pero ese header se puede falsificar: no hay autenticación (ver `revision-alcance.md`). | Sesión o token firmado. | Abierta. |

## Decisiones

| Código | Decisión | Recomendación | Estado |
| --- | --- | --- | --- |
| D-01 | Unificar "Abre con turnos del día" y "Horario especial" | Dos estados y etiqueta "Modificado" | Decidido e implementado |
| D-02 | Excepción como copia o diferencias | Copia | Decidido (recomendación) |
| D-03 | Corregir fechas pasadas | Solo lectura; ajuste manual auditado | Decidido (solo lectura implementado; ajuste pendiente) |
| D-04 | Reservas de un turno reemplazado | Transferir en un paso con confirmación | Decidido e implementado |
| D-05 | Feriados | Lista general y excepciones por sucursal | Decidido e implementado |
| D-06 | Horizonte de planificación | Unos 6 meses | Decidido: 6 meses (confirmado 10/10/2026). Una sola constante: `src/Shared/constants/schedule.ts` (repo Backend) |
| D-07 | Horas del resumen mensual | Programadas ahora; fichaje después | Decidido (recomendación) |
| D-08 | Fuente de los feriados | Calendario oficial + edición manual | Decidido (recomendación). Siguiente paso acordado: que los feriados oficiales y puentes los mantenga el rol administrador (ver L-12). Para después. |

## Fuente de feriados para el administrador (L-12, D-08)

Revisado el 11/10/2026. `GET https://api.argentinadatos.com/v1/feriados/{año}` sirve para que el administrador importe la lista oficial. El dueño no la consulta: sigue leyendo los feriados del backend.

- Sin autenticación. Cada fila es `{ fecha, tipo, nombre }`, con `tipo` `inamovible`, `trasladable` o `puente`. Los traslados ya vienen aplicados (Güemes el 15/6, Soberanía el 23/11).
- 2026: 20 fechas; el seed tiene 16. Faltan los puentes del 23/3, el 10/7 y el 7/12 y la visita papal del 9/11.
- 2027: ya publicado, 16 fechas y todavía sin puentes (se decretan más adelante).
- Límites: la fuente es La Nación, no el Boletín Oficial. Es un servicio gratuito, sin garantía de disponibilidad y sin límites de uso publicados. Por eso se consulta solo al importar un año, nunca en un pedido del dueño, y se reimporta cuando salen decretos nuevos.
- Encaje: `Holiday.origin` ya distingue `oficial` y `manual`, y la fecha es única. Importar un año es un alta por fecha con `origin: 'oficial'` que no toca los `manual`. El dueño sigue con `GET /api/holidays` y `PUT /api/holidays/:id/parkings/:parkingId`, sin cambios.

Decidir antes de implementar:

1. **Puentes.** Son días no laborables, optativos para el sector privado. Con R-10 cada sucursal cierra por defecto, así que importar un puente cerraría todas las cocheras ese día. Opciones: no importarlos, o guardar el `tipo` y que en los puentes las sucursales abran por defecto.
2. **Reservas existentes.** `HolidayService.create` no revisa reservas: un feriado nuevo cierra todas las sucursales aunque tengan reservas activas ese día, en contra de R-10. Ya pasa con el alta manual; una importación de 20 fechas lo vuelve mucho más probable. La importación debería responder 409 con `details.conflicts`, como el resto de los feriados.
3. **Fechas que cambian.** Si un trasladable cambia de fecha, el alta por fecha deja cargada la anterior. Mostrar al administrador las diferencias (fechas nuevas y fechas que ya no aparecen) en vez de borrar solo.
4. **Permisos.** `/api/holidays` no tiene control de rol (L-23). Para que solo el administrador cargue la lista oficial hace falta.

## Pendiente respecto del proposal

Confirmar reserva y facturación de la estadía: implementadas en la terminal del empleado (ver L-23, R-13 y R-14; Backend `a23eec2`, Frontend `60f4c27`).

Sin cambios: estacionamientos por localidad, vehículos por tipo (marca, modelo, seguro), motivo de cancelación y reembolso, registrar uso de servicio, recordatorio por email.

## Diferencias con el prototipo

- "Mi perfil" es un panel lateral para todos los roles (`src/components/Profile/ProfileDrawer.tsx`, abierto con `useOpenProfile()`); la página `/profile` ya no existe. Los datos fiscales y las preferencias de aviso del dueño se guardan en el navegador, porque el backend no los tiene. Los avisos en sí vienen de `GET /api/notifications` (campana en Home y en la barra de los paneles, `NotificationsProvider`).
- Alta y edición de sucursal reutilizan las pantallas existentes (`/my-parkings/...`); el prototipo las tenía en un panel lateral.
- El alta de empleado exige sucursal (el backend la requiere); no existe "Quitar de sucursal".
- Personal suma "Dados de baja" con "Reactivar", que la app ya tenía.
- El resumen mensual no tiene columna "Tipo" (física/virtual): ese dato no existe.

## Pruebas

Las pruebas de reglas (backend y frontend) y las e2e son locales y no se versionan en el repo.
