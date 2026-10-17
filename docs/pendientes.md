# Pendientes del proyecto

Estado al 17/10/2026, revisado contra los docs de los dos repos y contra git. Reemplaza a [handover.md](handover.md) (16/10), que ya no está al día: las minutas y los links a los PR están cargados, y `main` y `master` tienen la entrega de regularidad (Backend #9, Frontend #13).

Los códigos (R-, L-, D-, RA-, LA-) están en [owner/owner-turnos-notas.md](owner/owner-turnos-notas.md) y [admin/admin-permisos-notas.md](admin/admin-permisos-notas.md). El detalle de cada requisito de la cátedra está en [requisitos-tp.md](requisitos-tp.md).

**Fechas:** demo el 23/10 (`DEMO_ANCHOR`), primer globalizador del 26/10 al 30/10, defensa antes del 13/11. La entrega de aprobación va por el form https://kutt.to/DSWEntregaSistemaFinal.

## 1. Entrega de aprobación directa (bloquea la nota)

| Qué | Estado | Qué hacer |
|---|---|---|
| Integrar lo último a `main` y `master` | Backend: 5 commits sin mergear (L-42, L-43, L-44, L-31 y la demo). Frontend: 16 | Correr las pruebas (sección 2) y abrir los PR |
| Documentación de la API | No hay | Listado de endpoints con rol, body y respuestas, en `Backend/docs/`, o OpenAPI |
| Deploy | No hay configuración | Backend y MySQL hospedados (la FAQ pide que la base no corra en local) y el frontend con `VITE_API_URL` apuntando ahí. Credenciales: las de la siembra (`password123`) |
| Video de demostración | No hay | Grabarlo después del deploy |
| Form de entrega y contacto para la defensa | Sin enviar | Completar el form |
| Fork de `utnfrrodsw/tp` o solo el form | Sin confirmar | Preguntar al docente cuál rige |
| Proposal: CUU "Registrar confirmación de reserva" | Sin confirmar si se cambió (D-10) | Renombrarlo a "Registrar check-in" en `TPDSW/proposal.md` |
| Autoría de los tests de la cátedra | Se pide 1 por integrante | Repartir un archivo de `tests-catedra/unit/` por integrante y anotarlo en `Backend/docs/tests.md` |
| Metodología (Kanban) | Escrita en el `docs/README.md` del Backend | Que el grupo la confirme |

## 2. Antes de mergear y antes de la demo

- **Correr las pruebas.** Las reglas R-03, R-06 y R-07 (`assigneeFor`) se commitearon sin correrlas, y después llegaron L-42, L-43, L-44 y L-31. Hay que correr `pnpm test` y `pnpm test:integration` en el Backend, las `tests/**/*.db.test.ts` sobre una base `_test`, y `pnpm verify` en el Frontend. Las pruebas que esperaban el 409 de R-06 o la transferencia a mano se actualizan a la regla nueva.
- **En cada base:** `pnpm build && pnpm db:drop-legacy --yes` (columnas viejas, L-39).
- **El día de la exposición:** `pnpm demo:reservations --yes`.
- **Una prueba inestable:** la e2e del dueño "muestra el error del servidor (email duplicado)" falla a veces y pasa al reintentar.

## 3. Puntos con matiz en los requisitos

| Qué | Problema | Propuesta |
|---|---|---|
| `.env` del Frontend | Está versionado aunque `.gitignore` lo excluye. No hay `.env.example` en ningún repo | `git rm --cached .env` y agregar `.env.example`. Restringir la key de MapTiler por dominio |
| Guía de estilo (Airbnb) | El ESLint del Frontend solo mira `**/*.{js,jsx}`, así que no revisa `src/`. El Backend no tiene linter | Cambiar `files` a `**/*.{ts,tsx}` y activar las reglas de la guía (lista en requisitos-tp.md) |
| Patrón de diseño OO | Sin relevar (es opcional) | Nombrar uno que ya exista en el código, para la defensa |
| CRUD de turnos | La UI trabaja por agenda, no sobre `/shifts/:id` | Saber explicarlo en la defensa |
| CRUD de PrecioServicio | No hay `PUT`: modificar crea una versión nueva | Saber explicarlo en la defensa |
| Tarifa de la reserva (L-43, D-16) | `Reservation.hourlyRate` copia el precio; el DER no muestra que sale del historial `ParkingPrice`, y un docente puede preguntar para qué sirve el historial | Decidirlo antes del DER de la defensa: dejar la copia y saber explicarlo, o reemplazarla por una FK a `ParkingPrice` como en los servicios (toca alta online y de mostrador, salida, demo y `Reservation.db.test.ts`). No dejar las dos |

## 4. Limpieza de los docs

- **Filas "pendiente de commit" que ya están commiteadas.** En las notas del dueño: R-05, L-01, L-03, L-04, L-06, L-07, L-17, L-29, L-30, L-39 y D-13. En las del administrador: LA-03 y LA-05. Hay que buscar el hash de cada una (`git log -S`) y reemplazar el texto.
- **D-16 (tarifa de la reserva)** se agregó el 17/10 sin commit, igual que la línea nueva en el `CLAUDE.md` del Backend. Confirmar la fecha de la decisión (¿la de `b379cb8`?) y commitear los dos.
- **requisitos-tp.md:** las filas de tests dicen "listo para commitear" (líneas 12, 53, 54, 74 y 75), pero `tests-catedra/` y `docs/tests.md` ya están en `main` y en `master`. La regla del detalle de la FAQ (línea 85) dice "Pendiente de commit". La fecha de revisión es el 14/10.
- **revision-alcance.md:** "Lo que queda" todavía pide mergear a `main`, y ya está hecho.
- **diseno-empleado-mostrador.md:** "Lo que falta" lista la reserva de mostrador y los responsables de ingreso y egreso, que ya están (R-29, `checkedInBy`, `checkedOutBy`).
- **Frontend `docs/README.md`:** enlaza la lista de PR. El del Backend ya enlaza #9 y #13: copiar esos links.
- **handover.md:** borrarlo cuando se confirme que este archivo lo cubre.

## 5. Funcionalidad que falta (no bloquea la entrega)

| Código | Qué falta | Propuesta |
|---|---|---|
| L-36 | La cuenta creada en el mostrador tiene el DNI como contraseña inicial y el email sin verificar | Contraseña temporal al azar mostrada al empleado; verificar por mail cuando haya envío |
| Empleado | Cierre de caja y arqueo | Entidad nueva (`CashClosure`: `ShiftClosure` ya es el cierre de horarios) con lo esperado por medio de pago, lo contado y la diferencia. Arqueo ciego |
| Empleado | Validar que el actor esté de turno al registrar ingreso y salida | Pendiente de decidir |
| L-02, D-07, D-03 | Las horas trabajadas son las programadas, no la asistencia, y las fechas pasadas no se corrigen | Fichaje o ajuste manual auditado |
| L-16 | No hay auditoría de quién cambió los turnos | Guardar usuario, fecha, antes y después |
| L-20, L-21 | Sin prueba con lector de pantalla, y el modo claro sin revisar en la vista por fecha, los feriados y el resumen | Auditoría WCAG y revisión de contrastes |
| L-12, D-08 | Feriados: solo 2026, cargados a mano | Cargar 2027 y los puentes desde la fuente oficial |
| L-33, LA-08 | `vehiculos.json` sembró como AUTO algunos tipos que no son de pasajeros | Limpiar el catálogo sembrado |
| L-35, LA-09 | El selector de dueños del alta de empleado trae hasta 100 | Pasar a un buscador si hay más |
| L-23, L-25 | Roles de administrador y empleado parciales; un empleado es de una sola sucursal | Confirmar el alcance con el grupo |

**Limitaciones aceptadas** (marcadas con `// shortcut: L-xx` en el código, no hace falta tocarlas): L-04, L-08 y L-09 (D-14), L-10, L-11, L-14, L-15, L-18, L-24, L-26, L-27 (también R-17), L-28 y L-45.

## 6. Mejoras propuestas (fuera del proposal)

Están detalladas en [revision-alcance.md](revision-alcance.md#próximas-mejoras). Ninguna está implementada:

1. Mostrar la valoración a los clientes, en el listado y en el detalle de la cochera.
2. Mostrar la valoración histórica por sucursal en el panel del dueño.
3. Agregar un comentario opcional a la reseña.
4. Que "Buscar en esta zona" reemplace a los filtros de texto y localidad.
5. Agregar una nota del cliente para la cochera al reservar.
