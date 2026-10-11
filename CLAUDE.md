# Backend — convenciones

- Cada módulo: `X.Entity.ts`, `X.Schema.ts` (zod), `X.Repository.ts`, `X.Service.ts`, `X.Controller.ts`, `X.Route.ts`. Las reglas viven en el servicio; las rutas validan con `validateSchema`.
- Errores con `AppError(mensaje, status, details?)`; el 409 de turnos y feriados trae `details.conflicts` para que el frontend ofrezca transferir reservas.
- Atajos y deuda: `// shortcut: L-xx, <límite>, <cuándo mejorar>`; deben coincidir con las filas abiertas de las notas del rol dueño, que viven en el repo Frontend (`docs/owner/owner-turnos-notas.md`): R- reglas de negocio, L- limitaciones, D- decisiones, y se actualizan con el hash del commit. Quien no tenga ese repo puede pedirlas al equipo; las reglas que importan acá están implementadas en `src/EmployeeShift/Schedule.ts` y `Schedule.Service.ts`.
- Una columna `date` de MikroORM se lee como `'YYYY-MM-DD'` (string): no se le asigna un `Date`.
- Constantes de negocio en `src/Shared/constants/` (p. ej. `PLANNING_HORIZON_MONTHS`, `ACTIVE_RESERVATION_STATUSES`); no se repiten números en el código.
- Las pruebas no se versionan (son locales). Las de turnos se corrían con `tsx` y, contra MySQL, solo sobre una base que termine en `_test`.
- Las reglas de formato visual (un solo sistema de interfaz para dueño y cliente) y el arnés `pnpm verify` están en el `CLAUDE.md` del repo Frontend.
- El seeder de cocheras (`src/Shared/db/seeders/parkingSeeder.ts`) es idempotente por nombre y también corre en bases ya sembradas: para sumar una cochera al mapa se agrega a `PARKINGS_DATA` (con su `province` y su `neighborhood`: barrio o zona, que usa el buscador del mapa) y se reinicia el servidor; en las ya sembradas completa el barrio y la provincia si están vacíos. Una dirección en Argentina se guarda como provincia, localidad, barrio (opcional), calle y altura, y código postal (4 dígitos o CPA); la provincia es obligatoria en el alta porque hay localidades con el mismo nombre en distintas provincias.
