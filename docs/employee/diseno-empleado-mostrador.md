# Terminal del empleado: diseño y cliente sin cuenta (actualizado 12/10/2026)

Base: ramas prueba-valen-fr (1ed8c11) y prueba-valen-bk (59cd593). Prototipo: artifact "Mostrador ServicioCocheras" (v38). Este documento es la referencia para implementar la maqueta.

## Lo que ya hace el empleado (código)
Confirmar, registrar ingreso/salida, cobrar (solo medio de pago), cambiar plaza (R-15), extender de a horas (R-23), agregar/quitar servicios (R-24), cancelar. Todo en `EmployeeDashboard.tsx`.
- La pantalla se actualiza solo con el botón de refrescar y después de cada acción. No hay polling (el de notificaciones sí: 30 s, `NotificationsContext`). El prototipo se actualiza sola cada 30 s y el botón es solo un icono.
- La lista es por día (selector de fecha); "Hoy" suma los vehículos de días anteriores que siguen adentro.
- Cerrar sesión existe en `PanelBar`. No hay cierre de caja ni arqueo.
- Invoice solo guarda `paymentMethod`: no hay efectivo recibido, vuelto ni comprobante.

## Lo que falta
1. Reserva en el momento (cliente de mostrador). `POST /api/reservations` exige `vehicleId`, inicio y fin en hora entera y no más de 10 min en el pasado.
2. Responsables de ingreso y de egreso (ver sección propia).
3. Ocupación por tipo a la vista, resumen por período, cierre de caja.

## Decisiones tomadas en la maqueta
- **Reasignar empleado no está en la terminal del empleado**: es ABM del dueño (R-07). El empleado no reasigna.
- **Un empleado por turno (R-01/R-07)**: el responsable sale del turno, no de un filtro. Se quitó "Mis reservas"; la lista muestra toda la sucursal.
- **Responsable de ingreso y de egreso** (dos campos, ver abajo).
- **Resumen** (antes "Planilla"): es un reporte de solo lectura, no algo que se llena. Muestra el período visto (Hoy / Semana / Mes) y se copia como TSV a una hoja de cálculo.
- **Días y límites**: el selector de día es un calendario; los días navegables están limitados (prototipo: 60 días atrás, 14 adelante) y el calendario marca los días que el empleado trabajó (lun a vie).
- **Nuevo ingreso** va arriba a la derecha, alineado con los contadores de ocupación (Autos / Motos / Camionetas); no vuelve a dibujar la lista salvo que se esté viendo otro día. En celular queda fijo abajo.
- **Tamaños estables**: filas de alto fijo, columnas de ancho fijo, lista siempre a ancho completo (`width:100%`), `scrollbar-gutter:stable` en el panel lateral. Cambiar de filtro no mueve ni redimensiona nada.
- **Sin diálogos de confirmación**: acciones con "Deshacer" (toast); solo cancelar pide confirmación.
- **Modo claro/oscuro** con botón en la barra.
- Notificación al cliente dentro del sistema (centro de notificaciones) además de SMS/email cuando corresponde.
- **Aspecto visual**: se probó una dirección basada en la chapa Mercosur (barra azul, patentes dibujadas como chapas) y se descartó. Se mantiene el aspecto anterior.
- **Componentes**: se decidió no usar shadcn en esta maqueta (descartado a pedido); la maqueta sigue con sus propios componentes.

## Paleta y textos (v28–v33)
- Contraste revisado en ambos modos (texto 4,5:1, bordes de controles 3:1). Oscuro: bordes de campos y texto secundario más claros; botón principal más oscuro al pasar el mouse. El enlace "Deshacer" del aviso usa el tono inverso del tema.
- Estados: "Se pasó de hora" en rojo, "Por cobrar" y "Pendiente" en ámbar, "Confirmada" en verde, "En curso" en violeta (desde v31; el azul queda para acciones y selección); cada etiqueta con fondo tenue del mismo color. Falta revisar daltonismo (se dejó fuera a pedido).
- Fila: "Ingresó X · Salió Y" (solo lo ya registrado) o "Sin ingreso registrado". Efectivo insuficiente: "Faltan $ N para cubrir $ M". Salir sin arqueo: "Antes de salir, contá el efectivo en Cierre de caja".
- Comprobación visual completa en escritorio y celular, claro y oscuro. En celular, servicios en una columna y tabla del Resumen con columnas reducidas.

## Bordes y paleta del modo claro (v38)
Problema: en claro todo era blanco sobre gris muy pálido y los bordes eran casi invisibles; la separación dependía de una sombra casi imperceptible (que además no se ve con sol).
Regla: el borde de un contenedor tiene que verse sin apoyarse en la sombra.
Tokens nuevos (`--edge` borde de contenedor, `--div` divisor interno, `--btn-ring` aro de botones secundarios, `--card-sh` sombra suave de 1 px):

| Rol | Claro | Oscuro |
|---|---|---|
| Fondo de página `--bg` | #e8ecf2 | (sin cambios) |
| Superficie `--surface` | #ffffff | (sin cambios) |
| Superficie secundaria `--raised` | #f3f5f9 | (sin cambios) |
| Hover `--hover` | #e6ebf2 | (sin cambios) |
| Línea `--line` | #c3cbd8 | (sin cambios) |
| Suave `--soft` | #dde3ec | (sin cambios) |
| Borde de contenedor `--edge` | #aeb8c8 | #323a47 |
| Divisor interno `--div` | #d3dae5 | #252b35 |
| Aro de botón `--btn-ring` | #aeb8c8 | transparente |
| Sombra `--card-sh` | 0 1px 3px rgba(17,21,28,.08) | ninguna |

Aplicación: contadores de ocupación, lista, estados vacíos, control segmentado y botones secundarios con borde de 1 px; resumen, notas y cajas de valor con divisor; encabezado y pie del panel lateral con `--edge`, y borde izquierdo del panel.
Roles de color (sin cambios): neutros con leve tinte azul; azul solo para acciones y selección; violeta para "En curso" (#5a2bc0 en claro, #c4b0ff en oscuro); ámbar "Por cobrar"/"Pendiente"; rojo "Se pasó de hora"; verde "Confirmada"/tarifa/vuelto. Los estados siempre llevan texto y punto, nunca solo color. Foco: 6,2:1 en claro, 8,3:1 en oscuro.
No verificado: el contraste de `--edge` (#aeb8c8) sobre blanco es de unos 2,1:1; sirve como borde de contenedor pero queda por debajo de 3:1 (WCAG 1.4.11). Si se quiere cumplirlo, oscurecer a unos #8a96aa.

## Botón de actualizar (v36–v37)
Al tocar el botón, el icono gira una vuelta (~600 ms, se puede repetir sin cortarse) para confirmar que se pidió la actualización; la actualización automática cada 30 s gira igual pero sin acento. El icono se mantiene blanco (se probó un destello verde y se descartó). Con `prefers-reduced-motion` no gira: hace un breve pulso de opacidad.

## Pulido de la pantalla principal (v30)
Punto de corte nuevo a 960 px (tablet): la barra y las filas se apilan. Estados vacíos distintos según el caso (sin reservas, sin resultados, día sin actividad). Fechas dd/mm. Patente destacada. Selección, cursor de texto y barra de desplazamiento con los colores del tema.

## Auditoría y crítica (v30 → v32)
Se revisó la pantalla principal y los paneles (Nuevo ingreso, detalle, Resumen, Cierre de caja) en claro y oscuro, escritorio y celular. Antes: auditoría 14/20, heurísticas 27/40. Cambios aplicados:
- **Foco en paneles**: al abrir uno, el foco entra al panel (a la patente en Nuevo ingreso, al título en los demás); la lista de fondo queda inactiva (`inert`) y el panel cerrado también; al cerrar, el foco vuelve al botón que lo abrió. Esc cierra.
- **Acciones bloqueadas con motivo visible**: "Registrar ingreso" antes de la hora se muestra como "Desde HH:MM" (fila) o "Ingreso desde HH:MM" (detalle), en vez de un tooltip. En Cierre de caja, "Cerrar turno y salir" avisa "Aceptá el efectivo contado para cerrar".
- **Cierre de caja ciego (v32)**: el empleado escribe el efectivo contado y lo acepta con "Aceptar" (o Enter). Recién entonces se muestran "Esperado" y "Diferencia"; "Corregir" vuelve a ocultarlos. Antes de aceptar se lee "Se muestra al aceptar". El campo no trae un número de ejemplo y "Cerrar turno y salir" queda bloqueado hasta aceptar el monto.
- **Un solo nombre por estado**: el detalle usa la misma etiqueta que la fila ("Por cobrar", "Se pasó de hora", etc.).
- **Azul solo para acciones y selección**: "En curso" pasa a violeta; "Sin cuenta" y las barras de ocupación a neutro. Contraste de las etiquetas violeta: 5,6:1 en oscuro y 6,3:1 en claro. Anillo de foco propio (`--focus`): era 2,9:1 en oscuro, ahora 8,3:1; en claro 6,2:1.
- **Texto de prueba**: las patentes de ejemplo salen del campo y quedan en una línea "Solo maqueta" al pie de Nuevo ingreso. Se quita en la app real.
- **Celular**: la barra superior deja de ser fija (ocupaba unos 300 px); "Nuevo ingreso" queda fijo abajo, al alcance del pulgar; "Salir" ya no queda solo en una línea. Con pantalla táctil los controles miden 44 px de alto y de ancho mínimo.
- **Atajos visibles**: `N` abre Nuevo ingreso (tooltip del botón) y `/` busca (se indica en el buscador).
- Sin cambios, a propósito: en escritorio con mouse los botones chicos siguen en 30 px para respetar la estructura y los tamaños ya acordados.
- No verificado: lector de pantalla real, gestos táctiles en dispositivo, zoom 200 %, modo de alto contraste, la tipografía Geist (el entorno de prueba la bloquea).

## Nuevo ingreso y cobro: más aire, textos y color (v33)
Los paneles estaban amontonados porque todos los grupos pesaban igual y se separaban poco.
- **Espacio**: 26 px entre grupos (antes 18), 12 px dentro de cada grupo, 20 px de margen del panel. Se eliminaron los scrolls internos (servicios e importe): el panel entero hace scroll.
- **Un solo tipo de encabezado**: Nuevo ingreso queda en Patente → Vehículo → Cliente → Tiempo → Servicios · opcional → Total estimado.
- **Detalle**: Importe y Cobro son grupos separados (antes el cobro colgaba del importe).
- **Textos**: "Tipo y tarifa" → "Tarifa" (muestra "Elegí marca y modelo" hasta tenerla); "Cliente sin cuenta" → "Cliente"; "Quién lo trae hoy" → "Quién lo trae"; "Recibido (vacío = justo)" → "Efectivo recibido" con la ayuda "Dejalo vacío si paga justo $ N"; el aviso de cliente conocido pasa a una frase corta.
- **Color con significado**: la tarifa resuelta va en verde; el importe por cobrar va en ámbar, igual que la etiqueta "Por cobrar"; el total estimado va en el azul de acción; el vuelto va en verde y "Falta cobrar" en rojo. El importe alineado a la derecha.
- Al escribir un efectivo insuficiente, el aviso rojo se desplaza solo a la vista.

## Horas del ingreso de mostrador (v34–v35)
Problema: un ingreso a las 17:58 con 1 h quedaba como 17:58 – 18:00 (0 h) y se cobraba 0 h, porque el prototipo cortaba el fin en la hora entera siguiente.
Regla adoptada: las horas se cuentan desde el ingreso real. Inicio = ahora **sin segundos** (`:00`); fin = inicio + N horas completas; mínimo 1 h; el fin no puede pasar el cierre.
- 17:30 → 17:30 – 18:30; 17:45 → 17:45 – 18:45; 17:55 → 17:55 – 18:55; 17:59 → 17:59 – 18:59. Todos son 1 h; nadie estaciona gratis ni paga una hora que no usó.
- **Sin segundos (v35)**: si el inicio guardara segundos (17:30:45 a 18:30:45), una salida a las 18:30:50 cobraría hora extra aunque ambas pantallas muestren 18:30. Con el inicio truncado a `:00`, la hora extra empieza recién a las 18:31:00 (es lo que ya calcula `checkOut` con `ceil((salida − inicio) / 1 h)`).
- La salida sigue R-14: cada hora empezada de más se cobra entera (salir a las 18:31 tras entrar 17:30 son 1 h extra).
- Cierre: con duración mínima de 1 h (`minReservationHours`) y cierre a las 22:00, desde las 21:01 no cabe una estadía mínima sin pasarse del cierre (`assertSchedule`). La terminal no deja registrar el ingreso y lo avisa. El máximo de horas baja con la hora (a las 17:30 son 4 h).
- Alternativa descartada: alinear al bloque de reloj (17:30 → 17:00 – 18:00). Cobra la hora completa aunque falte 1 minuto para el próximo bloque.
- **Tolerancia**: en la entrada no hay (agregarla obliga a anular tickets y crear un estado especial). En la **salida** hay 10 min de gracia antes de cobrar la hora extra de R-14 (`CHECKOUT_GRACE_MINUTES`, backend). No está en el prototipo.

Backend (implementado, ver la última sección):
- Alta de mostrador con esquema propio (`POST /api/reservations/walk-in`). Hoy `createReservationSchema` exige inicio y fin en minuto 0, pensado para reservas online.
  - `startTime` lo fija el servidor con la hora actual truncada a `:00` segundos; el cliente no lo envía.
  - Se recibe `hours`: entero entre 1 y lo que queda hasta el cierre. `endTime = startTime + hours × 1 h`. `assertSchedule` valida igual la duración mínima y máxima y el horario de atención.
  - Nace en estado EN CURSO, con el empleado que atiende (`checkedInBy`, que reemplaza a `attendedBy`) y la plaza ocupada en una sola transacción.
- Extender (R-23): `extendReservationSchema` exige hoy fin en minuto 0. Debe pedir que la extensión sea en horas completas respecto del fin actual (`hoursToAdd: 1 | 2 | 3`, o `(nuevoFin − inicio) % 3 600 000 === 0`), sin exigir minuto 0.

## Validación de la patente ingresada a mano
Backend actual (`createReservation` y `extend`, `findConflictingVehicleReservation` y `validateVehicleOverlap`):
- Busca otra reserva del mismo vehículo con estado PENDIENTE, CONFIRMADA o EN CURSO que se solape con el horario pedido (`inicio < fin pedido` y `fin > inicio pedido`). No filtra por sucursal. Responde 400: "Este vehículo ya posee una reserva activa en «sucursal» en ese horario (HH:MM a HH:MM hs)".
- El ingreso sin cuenta resuelve la patente a un vehículo, así que recibe esta validación sin cambios.

Hueco:
- Un vehículo que sigue adentro en otra sucursal, pasado de hora, no se detecta: su reserva ya terminó y no se solapa con una que empieza ahora.
- Propuesta: antes del ingreso sin cuenta (y del check-in), rechazar si el vehículo tiene una reserva EN CURSO en cualquier sucursal, sin mirar el horario, con mensaje que nombre la sucursal ("AB123CD figura adentro en «Sucursal X» desde HH:MM. Registrá su salida allá primero").

Prototipo: solo valida contra sus propios datos y solo reservas en curso ("ya está adentro"). No hay otra sucursal en los datos de ejemplo.

## Horario reservado y hora real de salida (R-14, R-21)
- El detalle siempre muestra el **horario reservado** (inicio – fin y horas).
- Al registrar la salida se fija la **hora real de salida** y las **horas extra** (cada hora empezada cuenta entera; mínimo lo reservado aunque salga antes). El detalle muestra "Salida real: HH:MM · N h extra" cuando el cliente se pasó; si salió a tiempo o antes, solo la hora real.
- Antes de registrar la salida, un vehículo pasado de hora muestra el aviso "Si registrás la salida ahora (HH:MM) se cobran N h extra" (se recalcula con el reloj).
- Después de la salida las horas extra quedan fijas: el importe no cambia con el paso del tiempo.
- Backend: `checkOut` ya calcula `endTime = new Date()` y guarda `reservedHours`/`extraHours` en la factura. Falta confirmar que la hora real quede persistida y se devuelva al frontend (si `finishWithInvoice` pisa `endTime`, se pierde el horario reservado; conviene un campo aparte `checkedOutAt`).

## Responsable de ingreso y de egreso
Una reserva puede empezar en un turno y terminar en otro, por eso son dos empleados distintos.
- `Reservation.checkedInBy` (User, empleado): lo fija el check-in con el usuario que lo ejecuta. En reserva de mostrador se fija en la misma operación del alta.
- `Reservation.checkedOutBy` (User, empleado): lo fija el check-out con el usuario que lo ejecuta.
- Reemplazan a `attendedBy` (que hoy se setea solo en el check-in).
- Validación: el actor debe ser staff de la sucursal (`assertStaffOf`) y su turno debe cubrir el momento de la acción (R-01, `assertCovered`). Si el vehículo entró en un turno y sale en el siguiente, egresa y cobra el empleado del turno nuevo.
- UI: fila "Ingresó X · Salió Y"; detalle "Ingreso: registrado por X" / "Egreso: registrado por Y" (o "Sin registrar").
- Resumen y cierre de caja pueden agrupar por `checkedOutBy` (quien cobra) y por `checkedInBy`.
- Pendiente de decidir: bloquear acciones sobre reservas de otro turno (solo lectura con aviso) o permitirlas dejando el rastro en estos campos.

## Cliente físico sin cuenta
Patrón de la industria (JustPark Valet, Ticketless SMS Valet, ParkWhiz Attendant): patente y teléfono identifican al cliente, ticket por SMS/QR.
`POST /api/reservations/walk-in` { parkingId, plate, brandId, modelId, hours, serviceIds, name, phone }.
- Tipo de vehículo y tarifa salen de marca y modelo (catálogo DNRPA que ya existe), no se eligen a mano.
- Patente ya registrada: se reutiliza el vehículo (una patente activa por vehículo, 409 si se duplica, `assertPlateFree`). Si lo trae otra persona, el vehículo sigue del titular y la reserva guarda un contacto distinto para los avisos.
- Patente nueva: se crea un User `CLIENTE` de mostrador (flag `guest`, sin password, email/dni opcionales) y un Vehicle.
- Inicio = ahora (sin segundos) y fin = inicio + N horas completas, estado EN CURSO con check-in en la misma operación, `checkedInBy` = empleado. Valida cupo del tipo, horario de atención, cobertura de turno (R-01) y que el vehículo no tenga otra reserva activa ni esté adentro en otra sucursal.
- Login es por email. Cuando el cliente se registra con el mismo teléfono (o DNI/email que el mostrador guardó), el registro verifica el teléfono con un código por SMS y fusiona el guest: pasa vehículos y reservas a la cuenta nueva y completa email y contraseña. Requiere email nullable en User (MySQL admite varios NULL con índice único).

Cambios de esquema: User.email/dni/password/date_of_birth opcionales para guests; `Reservation.contactName/contactPhone` opcionales.

## Cliente que se pasa de hora y reserva siguiente (R-21/R-22)
Ya resuelto en backend: el vehículo pasado ocupa la plaza hasta que sale; al registrar el ingreso de la reserva siguiente, esta pasa sola a la primera plaza libre del mismo tipo; si no hay, el ingreso falla con mensaje. La terminal muestra el aviso en ambos detalles. Sin tolerancia en el ingreso (R-13/R-16): se cobran las horas reservadas más cada hora extra iniciada entera (R-14).

## Cobro
Salida y cobro son dos pasos: al registrar la salida se crea la factura "Por cobrar" con el total; el cobro es aparte (`payInvoice`).
Efectivo: recibido y vuelto (cálculo en pantalla; guardar `amountReceived` en Invoice si se quiere auditar). Tarjeta, Mercado Pago, transferencia: se cobran en un posnet o app externa; el sistema guarda medio y nº de comprobante opcional, nunca datos de tarjeta.

## Cierre de caja y resumen
Referencias: reportes de turno de operadores (cantidad e importe por medio de pago, efectivo esperado vs contado, lote de tarjetas) y reporte de pagos de Noovy (una fila por pago, filtro por fecha, usuario y medio).
Propuesta: `ShiftClosure` por empleado y turno con esperado por medio, contado y diferencia (arqueo ciego: el esperado y la diferencia se muestran después de que el empleado acepta el monto contado). Cerrar caja bloquea la terminal y desloguea. Resumen: ingresos, horas, servicios, importe por medio y ocupación por Hoy / Semana / Mes, copiable a una hoja de cálculo.

## Backend implementado (prueba-valen-bk `020a8ac`)
Las secciones de arriba que dicen "propuesto" quedaron así:
- `POST /api/reservations/walk-in` { parkingId, plate, brandId, modelId, hours, serviceIds?, name, phone }: inicio = ahora sin segundos (lo fija el servidor), fin = inicio + `hours`, EN CURSO con la plaza ocupada en una transacción. Patente activa existente → reusa el vehículo (409 si el modelo es de otro tipo); nueva → crea el vehículo y un User `guest` (sin email, DNI, nacimiento ni contraseña, no inicia sesión), o reusa el usuario con ese teléfono. La reserva guarda `contactName`/`contactPhone`. Solo personal de la sucursal o su dueño.
- `checkedInBy`, `checkedOutBy` y `checkedOutAt` (hora real de salida) en la reserva. **Desvío:** `attendedBy` no se reemplaza; sigue siendo el empleado asignado (R-07) que usan los turnos y se setea igual que antes.
- Check-in y mostrador rechazan (409) un vehículo EN CURSO en cualquier sucursal, con el mensaje de arriba.
- Extender: horas completas desde el inicio (`(nuevoFin − inicio) % 1 h`), sin exigir minuto 0.
- Gracia de salida: `CHECKOUT_GRACE_MINUTES = 10` (R-14). Entra 17:30 con 1 h: sale 18:39 sin extra; 18:41 paga 1 h extra.
- `assertSchedule` exige que el fin caiga el mismo día (antes "00:30" pasaba contra un cierre "23:59").
- Pago: `amountReceived` (efectivo, tiene que cubrir el total) y `receiptNumber` (otros medios).

Sigue pendiente: cierre de caja (el nombre `ShiftClosure` ya lo usa el cierre de horarios de la sucursal: usar otro, p. ej. `CashClosure`); restringir R-07 al dueño; fusión de la cuenta guest por SMS; validar el turno del actor en ingreso y salida (pendiente de decidir, ver arriba); la terminal del empleado todavía no usa el alta de mostrador ni muestra los responsables.
