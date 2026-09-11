Actúa como Frontend Senior / Lead Engineer especializado en React, TypeScript, React Router, Zustand y Tailwind CSS.

Necesito que audites y corrijas el frontend completo de ParkFlow. No hagas parches superficiales ni introduzcas código temporal: identifica las causas raíz y modifica únicamente lo necesario, con código limpio y de producción.

---

REGLAS DE ORO

1. No crear scripts temporales ni archivos fix-\*.cjs (eliminar los existentes si ya no se usan).
2. Eliminar completamente efectos cosméticos innecesarios (shinyborder, blur excesivo, gradientes pesados) sin reemplazarlos por equivalentes.
3. Cero duplicación de estado: Zustand es la ÚNICA fuente reactiva de verdad. Prohibido mezclar con window.dispatchEvent, listeners DOM manuales o lecturas frías a localStorage en el render.
4. Prohibido usar window.location.reload() para enmascarar desincronizaciones de estado.
5. No inventar endpoints ni métodos HTTP: si un servicio falla por discrepancia con el backend, documentá exactamente el contrato esperado (endpoint, método, payload, código de error real) en vez de ocultarlo detrás de un mensaje genérico.
6. TypeScript estricto: eliminar los 'any' innecesarios en servicios, stores y componentes.
7. Antes de dar por cerrada cada fase, el proyecto debe compilar limpiamente con npm run build, sin regresiones.
8. Para archivos que no cambian por completo, entregá el cambio como diff/parche (bloques de reemplazo puntuales), no el archivo entero — así evitamos truncar código y tocar cosas que no correspondía tocar.

---

CONTEXTO QUE TE VOY A PASAR ANTES DE EMPEZAR

Antes de la Fase 1 te voy a compartir:

- La estructura de carpetas del proyecto (components/, pages/, hooks/, services/, stores/, types/, context/, config/, utils/).
- El contenido actual de los archivos clave: authStore.ts, AuthModal.tsx, LoginForm.tsx, RegisterForm.tsx, useHomePage.ts, ProtectedRoute.tsx, PublicRoute.tsx, AppRoutes.tsx (o equivalente), Navbar/Sidebar/TopBar, layouts.

No asumas implementación: si algo no está en lo que te paso, pedímelo explícitamente en vez de inventarlo.

---

PLAN MAESTRO (ORDEN DE EJECUCIÓN)

FASE 1 — Autenticación reactiva (Zustand) + Routing base

- useAuthStore controla: user, isAuthenticated, setUser(), logout(), con middleware persist. Por ahora maneja solo el objeto user (sin token).
- Login o auto-login tras registro: setUser(userData) ANTES de cerrar modales o navegar.
- Logout: logout() → la UI vuelve a modo visitante al instante, sin F5.
- Normalizar roles de forma tolerante a mayúsculas/minúsculas (DUEÑO, OWNER, CLIENTE, ADMIN, EMPLEADO) para evitar redirects infinitos.
- Resolver el error "No routes matched location '/my-parkings/edit/:id'".
- Unificar las rutas de gestión de estacionamientos bajo una sola convención (crear, listar, editar) — nada de rutas duplicadas para tapar el error.
- ProtectedRoute y PublicRoute deben suscribirse directamente al estado reactivo de Zustand.
- El usuario con rol Dueño debe tener acceso visible e instantáneo a "/owner" desde la barra y menús, sin F5.
- Resolver la duplicación entre /login y el AuthModal de la home, dejando una sola experiencia coherente.

Entregables de Fase 1:

1. src/stores/authStore.ts
2. src/components/auth/AuthModal.tsx (y LoginForm/RegisterForm si cambian)
3. ProtectedRoute.tsx y PublicRoute.tsx
4. Configuración de rutas unificada de estacionamientos (AppRoutes.tsx o equivalente)

Checklist de cierre de Fase 1 (contestalo explícitamente antes de seguir):

- [ ] Login refleja la UI sin F5
- [ ] Registro refleja la UI sin F5
- [ ] Logout refleja la UI sin F5
- [ ] Owner ve su dashboard sin F5
- [ ] No hay rutas duplicadas ni redirects infinitos
- [ ] Roles normalizados correctamente
- [ ] Build sin errores

No avances a la Fase 2 hasta que este checklist esté en verde.

FASE 2 — Limpieza arquitectónica temprana

- Antes de seguir tocando más código, auditar components/, hooks/, context/, services/, stores/, types/, utils/, config/ en busca de: archivos no usados, duplicados, código muerto, lógica repetida entre Context y Zustand, dependencias circulares.
- Si Context duplica Zustand, eliminar la duplicación acá (no al final), para no arrastrar el problema mientras seguís tocando módulos.

FASE 3 — Alta de estacionamiento (rediseño y formulario)

- Layout desktop: grid grid-cols-1 lg:grid-cols-12 gap-8, formulario a la izquierda (lg:col-span-7: Información General, Capacidad Inicial, Horarios y Reglas), mapa sticky a la derecha (lg:col-span-5: buscador, pin, coordenadas).
- Reemplazar input URL por Dropzone (drag & drop, preview, eliminar, validación de archivos).
- Sincronización bidireccional: dirección → geocoding → pin en mapa; mover pin/click en mapa → reverse geocoding → dirección/ciudad/CP. Auditar servicio, payload, respuesta y tipos antes de tocar nada — corregir el error actual al ingresar direcciones sobre esa base.
- Capacidad: únicamente Autos / Motos / Utilitarios (eliminar Camiones/Otros), inputs numéricos con +/- y validación.
- Horarios: switch "Abierto 24 horas" que deshabilite apertura/cierre cuando está activo.

FASE 4 — Vehículos, Reservas, Tarifas (debugging de servicios)

- Vehículos: reparar edición/actualización para que impacte la UI sin F5. Auditar Vehicle, VehicleService, VehicleStore, VehicleForm, EditVehicle, rutas y DTOs; verificar método HTTP, IDs, payload y autenticación.
- Reservas: diagnosticar el 404 al cancelar (cliente y owner). Auditar ReservationService, store, componentes, endpoint, método HTTP, params y permisos por rol. Indicar la causa exacta, no inventar endpoints.
- Tarifas: diagnosticar el "Algo salió mal" al modificar. Identificar si el error real es 400/401/403/404/500 y corregirlo sin ocultarlo detrás de un mensaje genérico.

FASE 5 — UI/UX final

- Paleta: Light #F8FAFC, Dark #0B0F17. Prioridad: accesibilidad, contraste, jerarquía, spacing, estados loading/error/success, responsive, consistencia.
- Evitar: shinyborder, blur excesivo, glassmorphism, gradientes innecesarios, animaciones y sombras exageradas.

FASE 6 — Build final y segunda revisión

- npm run build sin errores.
- Segunda pasada buscando regresiones introducidas por los cambios anteriores.

---

CRITERIO DE FINALIZACIÓN GLOBAL

No doy el trabajo por terminado si "simplemente compila". Tiene que cumplirse, todo sin F5:

Login → UI inmediata
Registro → UI inmediata
Logout → UI inmediata
Owner → dashboard accesible
Parking → crear/editar correctamente, dirección ↔ mapa sincronizados
Vehículo → editar correctamente
Reserva → cancelar correctamente
Tarifas → modificar correctamente

Si algún problema depende realmente del backend, no lo ocultes: decime exactamente qué endpoint, método, payload o contrato falta.

---

Empecemos por la FASE 1. Te paso el contexto del repo a continuación.
