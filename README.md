# Estacionamiento COM 301 — Frontend

Aplicación web del sistema de reservas de cocheras: búsqueda en mapa y reserva para clientes, y paneles para dueños, empleados (mostrador) y administrador.
React 19 + TypeScript + Vite, React Router, axios y zustand. Consume la API de [MagaIrisarri/Backend](https://github.com/MagaIrisarri/Backend).

📄 Documentación del proyecto: [docs/README.md](docs/README.md)

## Requisitos

- Node.js 22 o superior
- pnpm 10 (`npm install -g pnpm`)
- El backend corriendo (ver su [README](https://github.com/MagaIrisarri/Backend#instalación))
- Una API key gratuita de [MapTiler](https://www.maptiler.com/cloud/) para los mapas

## Instalación

```bash
git clone https://github.com/MagaIrisarri/Frontend.git
cd Frontend
pnpm install
```

Crear un archivo `.env` en la raíz:

```env
VITE_API_URL=http://localhost:3000
VITE_MAPTILER_API_KEY=<tu clave de MapTiler>
```

| Variable | Para qué |
|---|---|
| `VITE_API_URL` | URL del backend |
| `VITE_MAPTILER_API_KEY` | Mapas de búsqueda y ubicación de cocheras |

## Ejecución

```bash
pnpm dev
```

Abre la app en `http://localhost:5173`. Tiene que ser ese puerto: es el origen que el backend habilita por CORS.

Otros scripts:

| Script | Qué hace |
|---|---|
| `pnpm build` | Chequeo de tipos y build de producción en `dist/` |
| `pnpm preview` | Sirve el build de producción |
| `pnpm verify --fast` | Chequeo del estándar visual, tipos y build |

## Usuarios de prueba

Los carga el backend al arrancar. Todos con contraseña `password123`:

| Rol | Email | Qué puede hacer |
|---|---|---|
| Cliente | `cliente1@cocheras.com` | Buscar cocheras, reservar, gestionar vehículos y reservas |
| Dueño | `dueno1@cocheras.com` | Sucursales, plazas, tarifas, servicios, empleados y turnos, reservas y resumen |
| Empleado | `empleado1@cocheras.com` | Mostrador: confirmar, ingreso, salida y cobro |
| Administrador | `admin@cocheras.com` | Usuarios, cocheras, catálogo de servicios y vehículos |

## Estructura

```
src/
  pages/        pantallas por rol (Admin, Owner, Employee) y mapa de plazas
  components/   componentes reutilizables y drawers del cliente
  services/     llamadas a la API (axios)
  hooks/        lógica de estado de las pantallas
  types/        interfaces y tipos de los datos de la API
  utils/        validaciones y formatos compartidos
```
