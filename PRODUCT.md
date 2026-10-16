# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React (Vite) + Tailwind CSS + TypeScript + React Router

## Users

1. Clientes: Automovilistas que buscan reservar un espacio de estacionamiento por hora.
2. Dueños: Propietarios o administradores de uno o múltiples estacionamientos.
3. Empleados: Personal en el estacionamiento encargado del check-in, check-out y validación.
4. Administradores: Operadores del sistema ServicioCocheras que gestionan el catálogo global y tarifas.

## Product Purpose

ServicioCocheras es una plataforma SaaS B2B2C que permite a los dueños de estacionamientos digitalizar su operación, gestionar reservas, empleados y facturación. Para el usuario final (cliente), permite encontrar y reservar lugares de estacionamiento garantizados por anticipado.

## Positioning

Proveer una experiencia sin fricciones tanto para el operario (empleado) como para el cliente final, eliminando los tickets físicos y automatizando el cálculo de estadía y cobro mediante un sistema en la nube en tiempo real.

## Operating Context

- Los empleados usan la plataforma en el lugar físico (probablemente desde un dispositivo móvil, tablet o PC en cabina). Necesitan escanear/buscar reservas rápidamente.
- Los clientes operan desde su celular en movimiento, requieren una UX ágil para reservar con pocos taps.
- Los dueños operan desde su computadora de escritorio para ver métricas, configurar tarifas y gestionar el plano del estacionamiento.

## Capabilities and Constraints

- Reservas basadas en horas.
- Categorización estricta por tamaño de vehículo (Auto, Moto, Camioneta) para las plazas y precios.
- Facturación post-pago: el cobro real se calcula en el Check-Out en base al tiempo real de estadía y los servicios adicionales (ej. lavado de auto).
- La asignación del espacio físico es dinámica.

## Brand Commitments

- Estilo "limpio" y sin "AiSlop". Diseño centrado en la usabilidad Operativa (Operate mode) para empleados/dueños y Persuasiva/Operativa para clientes.
- Colores, tipografías y diseño aún deben mantenerse minimalistas, profesionales, de alto contraste y legibles bajo condiciones de alta luminosidad (para operarios en la calle).

## Evidence on Hand

- API de backend completamente funcional con endpoints de reservas, turnos, vehículos, facturación.
- Paneles parciales ya implementados en React, pero la UX del empleado es muy rudimentaria (basada en alerts).

## Product Principles

1. Rapidez operativa: El check-in/out no puede tomar más de 3 segundos.
2. Cero ambigüedad: El estado de cada plaza y cada reserva debe ser evidente al instante.
3. Escalabilidad B2B: Los dueños deben poder gestionar múltiples sucursales fácilmente.
