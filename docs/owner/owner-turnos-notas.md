# Owner · Turnos y feriados — limitaciones y notas de implementación

Oct 10, 2026 · documento vivo: se actualiza al resolver cada código

## Alcance

Este documento junta lo que el prototipo `docs/owner/prototipo-owner.html` resuelve de forma simplificada, para que el código real lo tenga en cuenta. Cubre turnos, feriados, reservas y resúmenes del rol dueño.

Cada regla tiene un código para citarla en tareas: **R-** reglas de negocio, **L-** limitaciones, **D-** decisiones abiertas.

**Cómo mantenerlo:** al resolver un L-xx o cerrar un D-xx, actualizar su columna Estado con el hash del commit. En el código, todo atajo se marca `// shortcut: L-xx, <límite>, <cuándo mejorar>`; `grep -rn "shortcut:" Backend/src Frontend/src` debe coincidir con las filas abiertas de este documento.

Estado al 10/10/2026: fases 1 a 3 implementadas, **sin commit todavía** (se completa el hash al commitear).

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
| R-06 | No se puede quitar, mover ni recortar el turno de un empleado con reservas activas o pendientes en ese horario. Excepción: si otro empleado lo reemplaza, las reservas se transfieren en un solo paso con confirmación, y solo si quedan dentro del nuevo turno. | Implementada: 409 con detalle + confirmación "Transferir y aplicar". Cambios entre días distintos no ofrecen transferencia. La edición fila por fila de `/api/shifts/:id` no la revisa (`shortcut: R-06`). |
| R-07 | Toda reserva tiene un empleado asignado ("Registrada por"), editable mientras está en curso o reservada. | Parcial: editable en el detalle de la reserva. No es obligatorio: las reservas online y las ya guardadas tienen `attendedBy` nulo hasta el check-in. |
| R-08 | Aviso de jornada: ámbar por encima de 8 h por día y rojo por encima de 12 h. No bloquea. | Implementada en frontend. |
| R-09 | Las fechas pasadas son de solo lectura. Hoy y el futuro se editan hasta unos 6 meses adelante. | Implementada (backend y frontend). Horizonte en `PLANNING_HORIZON_MONTHS`, ver D-06. |
| R-10 | Los feriados son una lista general del dueño. Cada sucursal cierra por defecto y guarda solo lo que cambia. No se cierra un feriado con reservas activas o pendientes. | Implementada. |
| R-11 | Cambiar la semana tipo no pisa las excepciones por fecha ya cargadas. | Implementada (probada en `Schedule.db.test.ts`). |
| R-12 | Una excepción idéntica a la semana tipo se descarta sola. | Implementada. |

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
| L-07 | Transferencia de reservas | No verifica que el destino esté libre ni avisa a nadie. | Validar disponibilidad y notificar. | Abierta. |
| L-08 | Reservas largas | Las validaciones miran solo la fecha de inicio. | Usar el intervalo completo, contemplar medianoche. | Parcial: dentro del día se usa el intervalo completo; las que cruzan medianoche se miden solo en su fecha de inicio. |
| L-09 | Medianoche | "23:59" hace de 24:00; no hay turnos nocturnos. | Minutos o fecha de fin. | Abierta. |
| L-10 | Granularidad | Bloques fijos de 30 minutos. | Definir si se parametriza. | Abierta. |
| L-11 | Excepción por fecha | Es una copia del día. | Decidir copia o diferencias (D-02). | Decidida: copia. |
| L-12 | Feriados | Fechas de ejemplo; traslados manuales. | Fuente oficial, ajustes, revisión anual. | Parcial: seed 2026 con 16 feriados nacionales (date.nager.at, contrastado con argentinadatos.com) + alta manual. Faltan puentes y 2027. Verificar contra el Boletín Oficial. Plan: el administrador carga y actualiza la lista oficial (feriados, traslados, puentes) y los dueños solo eligen qué hace cada sucursal; hoy el dueño los agrega a mano. Para después. |
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
| L-23 | Roles | Solo existe el rol dueño. | Permisos y dashboard de empleado. | Abierta. Las pantallas de empleado (check-in/out) y de administración (catálogo, tipos de vehículo) se eliminaron del frontend por estar mal hechas; el backend conserva sus endpoints. Hay que rehacerlas. |
| L-24 | Horizonte | 52 semanas atrás y 26 adelante. | Acordar con negocio. | Abierta (mismos valores). |
| L-25 | Empleados | Un empleado pertenece a una sola sucursal. | Confirmar rotación. | Parcial: el frontend no cambia de sucursal a quien tiene turnos o reservas pendientes. |

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

## Pendiente respecto del proposal

Sin cambios: estacionamientos por localidad, vehículos por tipo (marca, modelo, seguro), motivo de cancelación y reembolso, confirmar reserva y registrar uso de servicio, recordatorio por email, facturación de la estadía.

## Diferencias con el prototipo

- "Mi perfil" es un panel lateral para todos los roles (`src/components/Profile/ProfileDrawer.tsx`, abierto con `useOpenProfile()`); la página `/profile` ya no existe. Los datos fiscales y las notificaciones del dueño se guardan en el navegador, porque el backend no los tiene.
- Alta y edición de sucursal reutilizan las pantallas existentes (`/my-parkings/...`); el prototipo las tenía en un panel lateral.
- El alta de empleado exige sucursal (el backend la requiere); no existe "Quitar de sucursal".
- Personal suma "Dados de baja" con "Reactivar", que la app ya tenía.
- El resumen mensual no tiene columna "Tipo" (física/virtual): ese dato no existe.

## Pruebas

Las pruebas de reglas (backend y frontend) y las e2e son locales y no se versionan en el repo.
