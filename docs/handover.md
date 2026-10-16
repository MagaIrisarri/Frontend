# Traspaso: lo que falta implementar o corregir

Estado al 16/10/2026. Las ramas `prueba-valen-bk` (Backend, último commit `c5bc4ee`) y `prueba-valen-fr` (Frontend, `e9c06e5`) están subidas y sin cambios locales. Los códigos (R-, L-, D-, RA-, LA-) están en [owner/owner-turnos-notas.md](owner/owner-turnos-notas.md) y [admin/admin-permisos-notas.md](admin/admin-permisos-notas.md); el estado de la cátedra, en [requisitos-tp.md](requisitos-tp.md).

## 1. Para la entrega (bloquea la nota)

| Qué | Para | Estado | Qué hacer |
|---|---|---|---|
| Merge a `main` (Backend) y `master` (Frontend) | Reg. y Apr. | Todo está en las ramas `prueba-valen-*` | Abrir los PR y mergear. El `docs/README.md` del Frontend solo existe en la rama |
| Minutas de reunión | Reg. y Apr. | La tabla del `docs/README.md` del Backend está vacía | Cargarlas |
| Links a los PR en la proposal y en `docs/` | Reg. y Apr. | Enlazan los repos, no los PR | Agregar los PR de la entrega |
| Detalle de reservas que pida datos al backend (FAQ) | Reg. | Parcial: el panel de `OwnerReservations.tsx` muestra lo que ya trajo el listado | Pedir `GET /api/reservations/:id` al abrir el detalle |
| Documentación de la API | Apr. | No hay | Listado de endpoints u OpenAPI |
| Deploy con links y credenciales | Apr. | No hay | Backend y MySQL hospedados; credenciales de la siembra (`password123`) |
| Video de demostración | Apr. | No hay | Grabarlo después del deploy |
| Fork de `utnfrrodsw/tp` o entrega por form | — | Sin confirmar | Preguntar al docente cuál rige |

Antes de la demo, en cada base: `pnpm build && pnpm db:drop-legacy --yes` (columnas viejas, L-39) y, el día de la exposición, `pnpm demo:reservations --yes`.

## 2. Limitaciones abiertas que conviene resolver

| Código | Problema | Propuesta |
|---|---|---|
| L-36 | La cuenta creada en el mostrador tiene el DNI como contraseña inicial y el email sin verificar (`Reservation.Repository.ts`) | Contraseña temporal al azar mostrada al empleado; verificar por mail cuando haya envío |
| L-02 | Las horas trabajadas son las programadas, no la asistencia (D-07) | Fichaje o ajuste manual auditado. Se dejó para después de la entrega |
| L-16 | No hay auditoría de quién cambió turnos | Usuario, fecha, antes y después |
| L-20 / L-21 | Sin prueba con lector de pantalla; modo claro sin revisar en vista por fecha, feriados y resumen | Auditoría WCAG y revisión de contrastes |
| L-12 | Feriados: solo 2026, cargados a mano | Cargar 2027 y los puentes desde la fuente oficial |

## 3. Limitaciones aceptadas (no hace falta tocarlas para la entrega)

Están en el código con `// shortcut: L-xx` y abiertas en las notas: L-04 (offset fijo -03:00), L-08 y L-09 (sin reservas ni turnos que crucen medianoche, fuera de la entrega por D-14), L-10 (bloques de 30 min), L-11 (excepción por fecha como copia), L-14 (topes de jornada fijos), L-15 (deshacer en el navegador), L-18 (CSV en el navegador), L-19 (en táctil no se mueven turnos), L-24 (horizonte fijo), L-25 (empleado de una sola sucursal), L-26 (spinner del mapa), L-27 y R-17 (tareas en memoria del proceso), L-28 (año mínimo 1960), L-31 (polling y últimas 50 notificaciones), L-33 (lista fija de tipos no de pasajeros del DNRPA), L-35 (selector de hasta 100 dueños). L-23 (roles admin y empleado) está parcial.

## 4. Limpieza de las notas

Varias filas dicen "pendiente de commit" aunque ya están commiteadas: L-03, L-04 y L-01 (Backend `d74f2bb`, Frontend `b80840f`), L-06, L-07, L-17 y R-05. También la línea de aprobación directa de `requisitos-tp.md` ("listo para commitear") y la fila de evidencia de tests ("Commitear `docs/tests.md`"): ya están en `d74f2bb`. Hay que buscar el hash de cada una (`git log -S`) y reemplazar el texto, como pide la convención de las notas.

## 5. Notificaciones en la app

Estado: completas para la entrega. El mapa de quién recibe cada aviso está en el `CLAUDE.md` del Backend ("Notificaciones en la app") y la prueba es `tests/notifications/Notification.db.test.ts` (local), que pasa sobre `c5bc4ee`: `DB_NAME=parkingdb_notif_test npx tsx tests/notifications/Notification.db.test.ts`. El `ER_NO_REFERENCED_ROW_2` de la salida es esperado (el último paso prueba que un aviso fallido no lanza).

- Lo último (L-41, Backend `3e31955`, notas en `8f1b75c`): sacar una plaza de servicio con reubicación confirmada (R-19) avisa `PLAZA_CAMBIADA` al cliente y al empleado asignado de cada reserva movida; el cambio de plaza a mano también avisa al empleado; el cambio de empleado a mano (`assignEmployee`, R-07) avisa `RESERVA_TRANSFERIDA` al que la recibe y al que la deja. Nadie recibe el aviso de su propia acción.
- `assignEmployee` solo se usa por la API (`PUT /api/reservations/:id`): desde R-07 la interfaz del dueño no cambia el empleado a mano.
- L-42 y L-43 quedaron cerradas (Backend `b379cb8`): pausar una sucursal con reservas avisa al dueño cuántas siguen, y la salida cobra la tarifa vigente al reservar, así que no hace falta avisar al cliente. En avisos falta L-31 (sección 3).
- Descartados por decisión de producto: aviso de la reserva de mostrador al resto del personal, cambios de servicios de una reserva (`setServices`), eventos de cuenta (reset de contraseña, baja, alta en el mostrador: sin sesión no se ven) y calificación (`rate`).

## 6. Avisos para quien siga

- Hay más de una sesión de Claude trabajando sobre los mismos repos: commitear solo los archivos propios y revisar `git status` antes.
- Las últimas reglas de turnos (R-03, R-06 y R-07: el empleado de cada reserva lo deciden los turnos, `assigneeFor`) se commitearon compiladas pero **sin correr las pruebas**. Correr `pnpm test` en el Backend, las `tests/shifts/*.db.test.ts` sobre una base `_test` y `pnpm verify` en el Frontend; las pruebas que esperaban el 409 de R-06 o la transferencia a mano hay que actualizarlas a la regla nueva.
- La prueba e2e del dueño "muestra el error del servidor (email duplicado)" falla a veces y pasa al reintentar; no es de los últimos cambios.
