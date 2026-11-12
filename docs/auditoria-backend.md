# Auditoría del Backend (12/11/2026)

Revisión completa de la API de ServicioCocheras (Express 5, MikroORM 7, MySQL), hecha antes de la presentación. Prioridades, en este orden: que el resultado sea correcto, que sea seguro, que aguante la carga esperada, que tenga pruebas, que sea rápido y que no sobre código.

**Carga supuesta:** un solo proceso y la demo de la presentación: 45 sucursales, pocos empleados por sucursal, unas 15.000 reservas y la terminal del empleado consultando cada 30 segundos.

**Qué se revisó:** autenticación y permisos de todas las rutas, reservas (alta, mostrador, ingreso, salida, extender, cambio de plaza, cancelación), facturas, usuarios, feriados, notificaciones, plazas y el arranque con sus tareas periódicas. El generador y la carga de la demo (`src/Shared/db/demo/`) y el detalle de turnos (`Schedule.ts`) se leyeron por arriba.

## Estado

| # | Hallazgo | Prioridad | Estado |
|---|---|---|---|
| 1 | Cancelar una reserva en curso dejaba la plaza ocupada y sin cobrar | Arreglar ya | ✅ Resuelto (`b99ac41`) |
| 2 | Las columnas de dinero redondeaban los centavos | Arreglar ya | ✅ Resuelto (`5bc3d79`, `f8f2928` en el Frontend) |
| 3 | Dos caminos eligen plaza sin bloquear la sucursal | Conviene arreglar | ✅ Resuelto (`f0583c5`) |
| 4 | La terminal del empleado baja todo el historial cada 30 s | Conviene arreglar | ✅ Resuelto (sin commit) |
| 5 | Clave de los tokens (JWT) por defecto escrita en el código | Conviene arreglar | ✅ Resuelto (sin commit) |
| 6 | Permisos de rutas de reserva sin prueba | Conviene arreglar | ✅ Resuelto (sin commit) |
| 7 | Controles repetidos y métodos sin uso | Conviene arreglar | ✅ Resuelto (sin commit; los métodos de la interfaz quedan, ver detalle) |
| 8 | El validador oculta errores inesperados | Opcional | ✅ Resuelto (sin commit) |
| 9 | `catchAsync` repite lo que Express 5 ya hace | Opcional | ⏳ Pendiente |
| — | Prueba de notificaciones que dependía de la hora | Encontrado después | ✅ Resuelto (`cc92580`) |

## Detalle

### 1. Cancelar una reserva en curso dejaba la plaza ocupada y sin cobrar ✅

- **Problema:** el personal y el administrador podían cancelar una reserva `EN CURSO`, con el vehículo adentro. Pasaba con una pantalla vieja: el dueño abría una reserva todavía pendiente, un empleado registraba el ingreso y el dueño apretaba "Cancelar". La reserva quedaba cancelada sin factura y la plaza, `OCUPADO` para siempre, porque solo la salida la libera.
- **Solución (`b99ac41`):**
  - Nadie cancela una reserva en curso: responde 400 y pide registrar la salida.
  - La baja solo escribe si la reserva sigue `PENDIENTE` en ese momento. Si un ingreso entra entre la lectura y la escritura, responde 409 y pide actualizar la pantalla.
  - Se quitó la anulación de factura, que nunca se ejecutaba (la factura nace en la salida), y `InvoiceRepository.findByReservationId`, que quedó sin uso.
- **Pruebas:** `Reservation.db.test.ts` verifica el 400 del personal y que la base no cancela una reserva en curso.

### 2. Las columnas de dinero redondeaban los centavos ✅

- **Problema:** sin precisión declarada, MikroORM creaba `numeric(10,0)`. Un precio de 1250,50 se guardaba como 1251, y la respuesta del alta mostraba un valor distinto del guardado.
- **Solución (`5bc3d79`):** las 7 columnas (tarifa, precio de servicio, tarifa de la reserva y las 4 de la factura) pasan a `numeric(12,2)`. La auditoría decía 8: eran 7. Se mantienen los centavos porque tarifa × horas más servicios puede dar centavos aunque los precios sean enteros.
- **Efecto en el Frontend:** los importes llegan como `"1250.00"`. Casi todo el Frontend ya los convertía con `Number(...)`. Solo el mapa de plazas mostraba el texto crudo (`+$500.00`) y se corrigió en `f8f2928`.
- **Pendiente operativo:** la columna se amplía en el próximo arranque, sin pérdida de datos.

### 3. Dos caminos eligen plaza sin bloquear la sucursal ✅

- **Problema:** la regla es que todo lo que elige una plaza libre bloquea antes la fila de la sucursal (`lockParking`). La saltean dos caminos:
  - el ingreso que pasa la reserva a otra plaza porque la suya sigue ocupada (R-21), que además guarda en dos pasos fuera de una transacción;
  - `takeOutOfService`, que reubica las reservas al pasar una plaza a mantenimiento o darla de baja.

  Ejemplo: un empleado registra un ingreso reubicado mientras otro registra un cliente de mostrador. Los dos ven libre la A-03 y quedan dos autos en la misma plaza.
- **Solución (`f0583c5`):**
  - **Ingreso:** es una sola transacción en `ReservationRepository.checkIn`. Bloquea la sucursal, vuelve a leer la reserva y exige que siga `PENDIENTE`, así que dos ingresos simultáneos de la misma reserva tampoco pasan. Después reubica si hace falta (R-21) y guarda juntos el estado, el empleado, `checkedInBy` y la plaza `OCUPADO`.
  - **`takeOutOfService`:** lee la plaza para saber su sucursal, bloquea la sucursal y vuelve a leer la plaza con el bloqueo tomado.
  - `lockParking` vive ahora en `ParkingSpace.Repository.ts`, junto a `findFreeSpaces`, y lo usan los dos repositorios. Se quitaron `findInProgressOnSpace` y la dependencia de `ReservationService` con `ParkingSpaceRepository`, que quedaron sin uso.
- **Pruebas:** `Reservation.db.test.ts` (ingreso con cambio de plaza) y `Notification.db.test.ts` (reubicación al pasar a mantenimiento) pasan. No hay prueba con dos pedidos simultáneos.

### 4. La terminal del empleado baja todo el historial cada 30 s ✅

- **Problema:** `GET /api/reservations/parking/:id` devuelve todas las reservas que tuvo la sucursal, con 10 relaciones y las facturas. En la demo son unas 1.400 por sucursal, y crece sin límite. La terminal lo pide cada 30 segundos por pestaña abierta.
- **Solución:** `findByParkingId` trae las activas, las que empezaron en los últimos `PARKING_HISTORY_DAYS` (60) días y las finalizadas que siguen sin cobrar. Los 60 días coinciden con `BACK_DAYS` del calendario de la terminal y cubren el "Mes" del resumen.
- **Cambio visible:** la búsqueda por patente o código de la terminal ya no encuentra reservas cerradas de hace más de 60 días. El historial completo sigue en el panel del dueño.
- **Prueba:** `Reservation.db.test.ts` crea tres reservas finalizadas de hace 70 días (sin factura, sin cobrar y cobrada) y verifica que solo aparece la que está sin cobrar, junto con una reciente.
- **A mano:** `PARKING_HISTORY_DAYS` tiene que seguir igual a `BACK_DAYS` del Frontend (`CalendarDrawer.tsx`).

### 5. Clave de los tokens (JWT) por defecto escrita en el código ✅

- **Problema:** fuera de `NODE_ENV=production`, los tokens se firman con `'dev-secret-cocheras'`, que está en el repo. Un servidor levantado sin esa variable en una red compartida (por ejemplo, el día de la presentación) acepta tokens de administrador firmados por cualquiera.
- **Solución:** `process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex')`. En desarrollo, las sesiones vencen al reiniciar el backend.
- **e2e:** `users.failure.api` firma tokens a mano. El backend de las e2e se levanta ahora con `JWT_SECRET=e2e-secret` (instrucción actualizada en `CLAUDE.md` y en la spec). Con otra clave, la spec omite esos casos y deja una anotación.

### 6. Permisos de rutas de reserva sin prueba ✅

- **Problema:** cambio de plaza, asignar empleado, mostrador y cancelación solo tienen el rol en la ruta: el control de quién puede actuar está en el servicio. Hay pruebas de 403 para ingreso, extender, servicios y valoración, pero ninguna falla si un empleado de otra sucursal cambia la plaza o asigna el empleado, o si un cliente cancela una reserva ajena.
- **Solución:** `Reservation.db.test.ts` verifica el 400 al cancelar una reserva en curso y tres 403: cambio de plaza y asignar empleado por un empleado de otra sucursal, y cancelación por un cliente que no es el del vehículo.

### 7. Controles repetidos y métodos sin uso ✅

- **Solución:**
  - se borró la anulación de factura que no se ejecutaba y `InvoiceRepository.findByReservationId`;
  - `ReservationService.create` ya no repite el control de superposición del vehículo: queda solo `validateVehicleOverlap`, dentro de la transacción con la sucursal bloqueada;
  - el error "figura adentro" del ingreso y del mostrador sale de una sola función, `insideElsewhere` (`Reservation.Repository.ts`).
- **Decisión:** `InvoiceRepository.add`, `InvoiceRepository.findAll` y `ReservationRepository.add` no se llaman, pero quedan. Los exige la interfaz `Repository<T>`, que `Frontend/docs/requisitos-tp.md` usa en la defensa como ejemplo del patrón Repository.

### 8. El validador oculta errores inesperados ✅

- **Problema:** `validateSchema` convierte cualquier error que no sea de zod en "Error interno del validador", sin registrarlo.
- **Solución:** la última línea es `return next(error);`, así lo registra `errorHandler`.

### 9. `catchAsync` repite lo que Express 5 ya hace ⏳

- **Problema:** Express 5 ya pasa a `next` las promesas rechazadas de controladores y middlewares.
- **Solución propuesta:** quitar el envoltorio en un commit aparte. No cambia el comportamiento.

### Encontrado después: prueba de notificaciones que dependía de la hora ✅

- **Problema:** `Notification.db.test.ts` tomaba como base "ahora + 10 días" y reservaba hasta 13 horas después. Corrida después de las 11, las reservas cruzaban la medianoche y la API las rechazaba.
- **Solución (`cc92580`):** la base queda fija a las 08:00. Las reservas armadas alrededor de la hora actual solo pasan por el ingreso, que no controla el horario de atención, así que no fallan de noche.

## Hallazgos menores no incluidos

- El comentario de `sendReminders` dice que un recordatorio fallido se reintenta, pero se marca como enviado antes de crear el aviso.
- `cancelExpired` puede avisar "vencida" a una reserva que ingresó un instante antes.

## Qué no se verificó

- No se corrieron las pruebas locales de `tests/` ni las e2e.
- La carga de la demo (`pnpm demo:load --yes`) está pendiente después de regenerar los JSON con el ancla en el 13/11/2026.
