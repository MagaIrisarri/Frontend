Paso A: Limpieza final de dependencias de auditoría.

1. pnpm remove motion
2. Borrá stats.html
3. pnpm remove -D rollup-plugin-visualizer
4. Confirmá con pnpm build que todo sigue compilando limpio.

Paso B: Migrar src/components/Vehicle/VehicleForm.tsx a Tailwind puro, siguiendo el mismo estilo visual que ya usan VehicleRegister.tsx o EditParkingForm.tsx (sin los componentes Button/Input legacy con SCSS). Mostrame el diff antes de aplicarlo. Una vez aplicado y confirmado que compila, borrá las carpetas src/components/shared/Button/ y src/components/shared/Input/.

Paso C: Reorganización y renombrado de carpetas. Convención definitiva:

- Componentes: PascalCase (carpetas y archivos)
- Services: <nombre>.service.ts (ej. parking.service.ts, vehicle.service.ts, user.service.ts, auth.service.ts) — renombrá también los servicios existentes que no sigan esto, incluyendo vehicleService.ts → vehicle.service.ts
- Types: <nombre>.types.ts consistente para todos (parking.types.ts, user.types.ts, vehicle.types.ts)
- Hooks: camelCase (useAlgo.ts)

Hacelo carpeta por carpeta, no todo junto. Para cada carpeta o archivo que renombres/muevas:

1. Buscá con grep todas las referencias antes de mover
2. Movés/renombrás
3. Actualizás todos los imports afectados
4. Corrés tsc --noEmit para confirmar 0 errores
5. Recién ahí pasás a la siguiente

Empezá por components/layout (appLayout.tsx → Layout/AppLayout.tsx, topNavBar.tsx → Layout/TopNavBar.tsx) para validar el proceso, después seguí con services/, types/, y el resto de components/ y pages/.

Al final corré pnpm build y pnpm run dev, y mostrame el árbol final completo con git status.
