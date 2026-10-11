# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

API de cocheras (Express 5 + MikroORM 7 + MySQL, TypeScript ESM con pnpm). La consume el repo Frontend (React), que está al lado.

## Comandos

- `pnpm build`: `tsc` a `dist/`. Sirve también como chequeo de tipos, porque no hay linter configurado.
- `pnpm start:dev`: `tsc-watch`, que levanta `node dist/index.js` en cada compilación. Necesita MySQL. Variables: `DB_NAME` (`parkingdb`), `DB_USER` (`root`), `DB_PASSWORD` (`pass`), `DB_HOST`, `DB_PORT`, `PORT` (3000), `NODE_ENV` (fuera de `production` se loguean las queries), `SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/`SMTP_PASS`/`MAIL_FROM`. Sin `SMTP_HOST`, los mails se escriben en la consola.
- **No hay script `test`.** Cada prueba es un archivo `*.test.ts` que se corre con `tsx`, y su primera línea dice cómo. Por ejemplo:
  - `npx tsx src/EmployeeShift/Schedule.test.ts` (reglas puras, sin base).
  - `DB_NAME=parkingdb_checkout_test npx tsx src/Reservation/Reservation.db.test.ts`
  - Las `*.db.test.ts` se niegan a correr si `DB_NAME` no termina en `_test`, y **borran esa base al terminar**.
- **e2e contra el backend real** (las specs viven en el repo Frontend, carpeta `e2e/`):
  1. `pnpm build && PORT=3100 DB_NAME=parkingdb_e2e_test node dist/index.js`
  2. En el Frontend: `E2E_API_URL=http://localhost:3100 npx playwright test owner.api employee.api audit.api`
  3. `pnpm verify` del Frontend corre todo, incluidas las e2e con la API simulada.

## Arquitectura

- **Arranque** (`src/index.ts`): `syncSchema` → seeders → normaliza tipos de plaza → completa códigos de reserva → timers en memoria (R-17 vencidas, R-28 recordatorios) → `listen`.
  - **No hay migraciones.** `orm.schema.update({ safe: true })` agrega tablas, columnas e índices y quita índices, pero nunca borra tablas ni columnas: renombrar o quitar una columna requiere SQL a mano.
  - Las entidades se descubren por glob (`dist/**/*.Entity.js`, `src/**/*.Entity.ts`), así que una entidad nueva tiene que llamarse `X.Entity.ts`.
  - Los imports llevan `.js` (ESM).
- **Cableado:** cada `X.Route.ts` instancia repositorio, servicio y controller con `orm.em` global; un middleware lo aísla por request con `RequestContext`. Hay dos instancias compartidas que se importan desde su ruta:
  - `scheduleService` (`EmployeeShift.Route.ts`), que usan reservas, feriados y el CRUD de turnos.
  - `reservationService` (`Reservation.Route.ts`), que usan los timers y las pruebas.
- **Validación:** `validateSchema` parsea `{ body, params, query }` con zod y **reemplaza** `req.body`. Las claves que el schema no declara desaparecen; para una ruta sin schema de body, el body llega tal cual.
- **Sin autenticación** (decisión documentada en `Frontend/docs/revision-alcance.md`). Quien hace la acción llega en el header `x-user-id` (`actorId` en `Reservation.Controller.ts`), y los permisos se verifican en el servicio. Ejemplo: `assertStaffOf` exige empleado activo de esa sucursal o su dueño.
- **Reglas de una sola fuente.** Antes de escribir otra regla parecida, reusar estas:
  - `findFreeSpaces` (`ParkingSpace.Repository.ts`): plaza libre en un horario, con el margen de la sucursal. La usan alta, cambio de plaza, extender, disponibilidad, reubicación y el ingreso con la plaza ocupada.
  - `categorizeVehicleType` (`Shared/utils/vehicleTypes.ts`): `AUTO`, `MOTO` o `CAMIONETA` a partir de cualquier nombre de tipo.
  - `ScheduleService.resolveDay`: un día se lee en este orden: excepción de la fecha, feriado cerrado, semana tipo. `saveTemplateDay` es el único camino de escritura de la semana tipo; el CRUD `/api/shifts/:id` también pasa por ahí.
- **Escrituras atómicas en el repositorio** con `em.transactional` cuando tocan varias entidades: alta de reserva, extender, cambio de plaza, salida con factura, baja de servicio, sacar plaza de servicio.
  - Las que eligen plaza bloquean antes la fila de la cochera (`lockParking`, `PESSIMISTIC_WRITE`).
  - Los cambios dentro de la transacción se propagan al `em` del request, así que un `findOne` posterior ve el estado nuevo.
- **Precios versionados:** `ParkingPrice` y `ServicePrice` nunca se editan en el lugar. Dar de alta o modificar vence la vigente (`expirationDate`) y crea otra. La factura guarda la tarifa y el detalle del cobro (R-14).
- **Bajas lógicas** (`isActive = false` o `status = 'BAJA'`). Las bajas con dependencias activas se rechazan con 409:
  - cliente con reservas;
  - dueño con sucursales activas;
  - empleado con turnos o reservas asignadas;
  - vehículo con reservas;
  - feriado nuevo con reservas ese día.
- **Filtro por localidad:** siempre va con la provincia. En el panel del administrador, `GET /api/stats/summary?province=&locality=` limita cocheras, plazas, reservas y facturación; los usuarios siguen siendo de todo el sistema. El panel del dueño filtra en el frontend con los datos que ya tiene.
- **Estados de reserva** en `Shared/constants/status.ts`. El estado en curso es el texto `'EN CURSO'`, con espacio.

## Convenciones

- Cada módulo: `X.Entity.ts`, `X.Schema.ts` (zod), `X.Repository.ts`, `X.Service.ts`, `X.Controller.ts`, `X.Route.ts`. Las reglas viven en el servicio; las rutas validan con `validateSchema`.
- Errores con `AppError(mensaje, status, details?)`; el 409 de turnos y feriados trae `details.conflicts` para que el frontend ofrezca transferir reservas.
- Atajos y deuda: `// shortcut: L-xx, <límite>, <cuándo mejorar>`; deben coincidir con las filas abiertas de las notas del rol dueño, que viven en el repo Frontend (`docs/owner/owner-turnos-notas.md`): R- reglas de negocio, L- limitaciones, D- decisiones, y se actualizan con el hash del commit. Quien no tenga ese repo puede pedirlas al equipo; las reglas que importan acá están implementadas en `src/EmployeeShift/Schedule.ts` y `Schedule.Service.ts`. `Frontend/docs/revision-alcance.md` mapea cada requisito de la materia (CRUD, CUU) al código que lo cumple: antes de borrar una ruta, revisar que no sea la evidencia de un requisito.
- Una columna `date` de MikroORM se lee como `'YYYY-MM-DD'` (string). MikroORM escribe los `Date` en UTC (`forceUtcTimezone`), así que una fecha del sistema asignada después de las 21 h quedaría con el día siguiente: esas columnas usan `type: LocalDateType` (`src/Shared/db/LocalDateType.ts`), que guarda el día local. `date_of_birth` sigue con `'date'` porque llega como medianoche UTC. Los `datetime` se guardan y leen en UTC y no tienen el problema. El proceso fija `TZ=America/Argentina/Buenos_Aires` en `orm.ts`.
- Constantes de negocio en `src/Shared/constants/` (p. ej. `PLANNING_HORIZON_MONTHS`, `ACTIVE_RESERVATION_STATUSES`); no se repiten números en el código.
- Las pruebas no se versionan (son locales, igual que `Frontend/e2e/`). Contra MySQL, solo sobre una base que termine en `_test`.
- Pruebas desactualizadas: si un cambio modifica a propósito una regla, un permiso o una respuesta de la API, las pruebas que lo cubren se actualizan en el mismo paso. Después de traer commits de otro (pull o merge), se corren las pruebas locales; ante cada fallo se decide si es una regresión (se arregla el código) o una prueba vieja (se actualiza a la regla nueva, citando su código). Nunca se borra ni se saltea una prueba para que pase. Las e2e contra el backend real (`owner.api.spec.ts`, `employee.api.spec.ts`, `audit.api.spec.ts`, en el Frontend) usan una base `_test` (p. ej. `parkingdb_e2e_test`).
- Las reglas de formato visual (un solo sistema de interfaz para dueño y cliente) y el arnés `pnpm verify` están en el `CLAUDE.md` del repo Frontend.
- **Siembra** (`src/Shared/db/seeder.ts`, corre en cada arranque): cada paso es idempotente (por email, nombre, patente o "si todavía no tiene") y van todos en una transacción, así que funciona igual en una base vacía o ya sembrada y solo agrega lo que falta. Para sumar datos se agregan a las listas de cada seeder y se reinicia el servidor. `userSeeder` (admin, 5 dueños, 10 clientes; el 10 de baja), `vehicleSeeder` (catálogo de `vehiculos.json` más modelos de moto, que el JSON no trae, y los seguros), `parkingSeeder` (`PARKINGS_DATA`, con `province` y `neighborhood`: barrio o zona, que usa el buscador del mapa; cada dueño tiene sucursales en dos localidades; una pausada y una con plazas de camioneta sin tarifa; en bases ya sembradas completa barrio y provincia vacíos, crea las plazas que falten hasta la capacidad, R-18, y borra las tarifas en $0), `staffSeeder` (empleados con su sucursal y semana tipo: Central Plaza cubierta todos los días, Nueva Córdoba solo lunes a sábado a la mañana, R-01; el 8 de baja), `serviceSeeder` (catálogo y precios por cochera) y `reservationSeeder` (vehículos de los clientes y sus reservas relativas a hoy, en todos los estados y con factura en las finalizadas, R-14; solo para clientes sin reservas). Las reservas sembradas cumplen las mismas reglas que la API (horario, duración, feriados, cobertura, plaza libre con margen); las "en curso" usan la hora actual y se omiten si la sucursal está cerrada. `src/Shared/db/seeder.db.test.ts` lo verifica. Usuarios: `admin@`, `dueno1@`…`dueno5@`, `empleado1@`…`empleado8@`, `cliente1@`…`cliente10@cocheras.com`, todos con `password123`. Una dirección en Argentina se guarda como provincia, localidad, barrio (opcional), calle y altura, y código postal (4 dígitos o CPA); la provincia es obligatoria en el alta porque hay localidades con el mismo nombre en distintas provincias.
