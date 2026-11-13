# Auditoría del Backend (12/11/2026)

Revisión completa de la API de ServicioCocheras (Express 5, MikroORM 7, MySQL), hecha antes de la presentación. Prioridades, en este orden: que el resultado sea correcto, que sea seguro, que aguante la carga esperada, que tenga pruebas, que sea rápido y que no sobre código.

**Carga supuesta:** un solo proceso y la demo de la presentación: 45 sucursales, pocos empleados por sucursal, unas 15.000 reservas y la terminal del empleado consultando cada 30 segundos.

**Guías:** las reglas para que estos casos no se repitan están en [guias-backend.md](guias-backend.md). Cada hallazgo nuevo se suma a la guía que lo cubre, o crea una nueva.

**Qué se revisó:** autenticación y permisos de todas las rutas, reservas (alta, mostrador, ingreso, salida, extender, cambio de plaza, cancelación), facturas, usuarios, feriados, notificaciones, plazas y el arranque con sus tareas periódicas. El generador y la carga de la demo (`src/Shared/db/demo/`) y el detalle de turnos (`Schedule.ts`) se leyeron por arriba.

## Estado

| # | Hallazgo | Prioridad | Estado |
|---|---|---|---|
| 1 | Cancelar una reserva en curso dejaba la plaza ocupada y sin cobrar | Arreglar ya | ✅ Resuelto (`b99ac41`) |
| 2 | Las columnas de dinero redondeaban los centavos | Arreglar ya | ✅ Resuelto (`5bc3d79`, `f8f2928` en el Frontend) |
| 3 | Dos caminos eligen plaza sin bloquear la sucursal | Conviene arreglar | ✅ Resuelto (`f0583c5`) |
| 4 | La terminal del empleado baja todo el historial cada 30 s | Conviene arreglar | ✅ Resuelto (`88e795b`) |
| 5 | Clave de los tokens (JWT) por defecto escrita en el código | Conviene arreglar | ✅ Resuelto (`88e795b`) |
| 6 | Permisos de rutas de reserva sin prueba | Conviene arreglar | ✅ Resuelto (`88e795b`) |
| 7 | Controles repetidos y métodos sin uso | Conviene arreglar | ✅ Resuelto (`88e795b`; los métodos de la interfaz quedan, ver detalle) |
| 8 | El validador oculta errores inesperados | Opcional | ✅ Resuelto (`88e795b`) |
| 9 | `catchAsync` repite lo que Express 5 ya hace | Opcional | ✅ Resuelto (`4e0e214`) |
| — | Prueba de notificaciones que dependía de la hora | Encontrado después | ✅ Resuelto (`cc92580`) |
| C-1 | Reglas de negocio fuera de `Shared/constants/` | Conviene arreglar | Pendiente |
| C-2 | Las conversiones de tiempo están escritas siete veces | Opcional | Pendiente |
| C-3 | Los enums se repiten como listas de texto en los esquemas | Conviene arreglar (con N-2) | Pendiente |
| RS-1 | La superposición del vehículo responde 400 y "sin plaza" 409 | Opcional | Pendiente |
| RS-2 | Cancelar y las rutas del personal sin `ownReservation` en la ruta | Opcional | Pendiente |
| RS-3 | Tarifa, horario y empleado se validan fuera de la transacción del alta | Opcional (con ES-1) | Pendiente |
| RS-4 | El margen de 10 minutos del alta es un número suelto | Opcional (con C-1) | Pendiente |
| VT-1 | El nombre único de un tipo de vehículo solo lo controla el servicio | Opcional | Pendiente |
| VT-2 | La baja de un tipo no es atómica | Opcional | Pendiente |
| VT-3 | `PUT` y `PATCH /api/vehicle-types/:id` hacen lo mismo | Opcional | Pendiente |
| VT-4 | El esquema de edición exige el nombre: la rama "sin nombre" no se alcanza | Opcional | Pendiente |

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

### 9. `catchAsync` repite lo que Express 5 ya hace ✅

- **Problema:** Express 5 ya pasa a `next` las promesas rechazadas de controladores y middlewares.
- **Solución (`4e0e214`):** se quitó el envoltorio de los 114 handlers de los controladores y de los dos middlewares de `auth.ts`, y se borró `Shared/utils/catchAsync.ts`. Lo hizo un script que solo borra `catchAsync(` y su paréntesis de cierre (contados por archivo).
- **Verificación:** build, unitarias, las dos pruebas de integración de la cátedra y `tests/auth`, `users`, `catalog` y `holidays`. Con el servidor levantado, un error lanzado en un controlador (404), en `auth` (401), en la pertenencia de `allow` (403, otro dueño sobre una cochera ajena), en zod (400) y en el login (401) llega a `errorHandler`, y el proceso sigue atendiendo.
- **Prueba ajustada:** el `run` de `tests/auth/auth.db.test.ts` trata una promesa rechazada como el error del middleware, igual que Express 5.

### Encontrado después: prueba de notificaciones que dependía de la hora ✅

- **Problema:** `Notification.db.test.ts` tomaba como base "ahora + 10 días" y reservaba hasta 13 horas después. Corrida después de las 11, las reservas cruzaban la medianoche y la API las rechazaba.
- **Solución (`cc92580`):** la base queda fija a las 08:00. Las reservas armadas alrededor de la hora actual solo pasan por el ingreso, que no controla el horario de atención, así que no fallan de noche.

## Hallazgos menores no incluidos

Quedan anotados y sin arreglar: afectan avisos al cliente, no datos ni cobros, y son poco probables.

### Un recordatorio fallido no se reintenta (`ReservationService.sendReminders`)

- **Qué hace:** cada 5 minutos busca las reservas pendientes que empiezan en las próximas 2 horas sin recordatorio (R-28). Para cada una, primero la marca como recordada (`markReminderSent`) y después crea el aviso.
- **Problema:** el comentario dice que un recordatorio fallido queda sin marcar y se reintenta, pero no es así. Si falla la creación del aviso, `NotificationService.notify` atrapa el error a propósito (un aviso nunca rompe la acción) y la reserva ya quedó marcada. El cliente se queda sin recordatorio, y solo queda en el log.
- **Arreglo posible:** corregir el comentario y aceptar que un recordatorio fallido se pierde, como cualquier otro aviso. Si se quiere reintentar, `notify` tendría que devolver si creó el aviso y la reserva marcarse solo en ese caso; invertir el orden no alcanza, porque `notify` nunca lanza.

### Aviso de "vencida" a una reserva que acaba de ingresar (`ReservationRepository.cancelExpired`)

- **Qué hace:** cada 5 minutos lee las reservas pendientes cuyo inicio pasó hace más de la tolerancia de llegada (15 min, R-17), las cancela con una escritura que solo cambia las que siguen `PENDIENTE` y devuelve la lista leída para avisar a cada cliente.
- **Problema:** si un empleado registra el ingreso entre la lectura y la escritura, la reserva no se cancela (bien), pero el cliente igual recibe "Reserva vencida" con el auto adentro. Es casi imposible: el ingreso se rechaza pasada la tolerancia, así que tiene que entrar en los últimos milisegundos justo mientras corre la tarea.
- **Arreglo posible:** avisar solo a las que la escritura canceló de verdad; por ejemplo, después de escribir, volver a leer cuáles de esos ids quedaron `CANCELADA`.

## Usuarios: revisión posterior

Observaciones sobre `src/User/`, verificadas en el código. Quedan anotadas y sin arreglar.

### U-1. `ownerId` y `parkingId` son texto, no relaciones (deuda conocida)

- **Qué es:** el empleado guarda su dueño y su sucursal como texto (`User.ownerId`, `User.parkingId`, [User.Entity.ts](../src/User/User.Entity.ts)), no como `ManyToOne`. La base no tiene clave foránea.
- **Problema:** la base no garantiza que apunten a algo que exista. La API no puede crear un empleado con una sucursal ajena o inexistente, porque el servicio lo controla con `ownsParking` (400 "no pertenece"). Pero un cambio por SQL, o un error en un script como la carga de la demo, puede dejar a un empleado con un `parkingId` que no es de nadie, y nada lo detecta. Además, no está marcada como deuda: no tiene comentario `shortcut:` ni fila en las notas del dueño.
- **Solución:**
  - **Ahora:** dejarla registrada como deuda: un `// shortcut: L-xx, ownerId y parkingId sin clave foránea (los controla ownsParking), pasar a ManyToOne` en la entidad y la fila L-xx en `Frontend/docs/owner/owner-turnos-notas.md`.
  - **Después:** pasar a `ManyToOne` a `User` y a `Parking` (nullable), sobre las mismas columnas `owner_id` y `parking_id`. Antes hay que limpiar los valores que no apunten a nada, porque `schema.update` no podría crear la clave foránea. Toca unos 30 archivos que leen `parkingId`.
- **Si lo preguntan:** es una deuda conocida, compensada en el servicio; todas las altas y ediciones pasan por `ownsParking`.

### U-2. El comentario del rol dice `'ADMIN'`

- **Qué es:** el comentario de `User.type` ([User.Entity.ts:41](../src/User/User.Entity.ts#L41)) lista `'CLIENTE', 'DUEÑO', 'EMPLEADO', 'ADMIN'`.
- **Problema:** el valor real es `'ADMINISTRADOR'` (`UserType` en `Shared/constants/status.ts`). Quien escriba una consulta o una prueba guiándose por el comentario busca un rol que no existe y no encuentra al administrador.
- **Solución:** cambiar `'ADMIN'` por `'ADMINISTRADOR'` en el comentario.

### U-3. Código muerto en `UserService.update`

- **Qué es:** `update` hashea `userData.password` si viene ([User.Service.ts:122-124](../src/User/User.Service.ts#L122-L124)).
- **Problema:** `updateUserSchema` no declara `password` y `validateSchema` borra las claves que el esquema no declara, así que un `PUT /api/users/:id` con `password` llega sin ese campo y la rama nunca se ejecuta. El único que llama a `update` es el controlador. Quien lea el código cree que el perfil cambia la contraseña, y no es así: solo cambia por `PATCH /:id/password` (pide la actual) y `POST /:id/reset-password` (administrador).
- **Solución:** borrar las tres líneas. No cambia ningún comportamiento.

### U-4. `reactivate` no mira el estado anterior

- **Qué es:** `POST /api/users/:id/reactivate` (administrador) pone `ACTIVO` sin mirar cómo estaba ([User.Service.ts:131](../src/User/User.Service.ts#L131)).
- **Problema:** reactivar a un usuario que ya estaba activo responde 200 "Usuario reactivado". En cambio, `reactivateEmployee` (el dueño con su empleado) exige que esté de baja y si no responde 404. La misma acción tiene dos reglas.
- **Matiz:** el 200 está probado a propósito: la e2e `users.failure.api`, prueba 22, espera que "reactivar a un activo no cambia nada".
- **Solución, a decidir:**
  - **Dejarlo idempotente** (recomendado: es inofensivo y está probado): agregar un comentario que diga que es a propósito.
  - **Unificar con el empleado:** responder 409 si ya está activo, y actualizar la prueba 22 en el mismo cambio.

### U-5. La contraseña se recorta al registrarse, pero no al iniciar sesión

- **Qué es:** `baseUserFields.password` lleva `.trim()` ([User.Schema.ts:51](../src/User/User.Schema.ts#L51)) y se usa en el registro, el alta de empleado y el restablecimiento del administrador. `loginSchema` y `updatePasswordSchema` no recortan.
- **Problema:** la misma regla, aplicada distinto en dos lugares. Alguien se registra con `clave123 ` (un espacio al final, fácil al pegar) y se guarda `clave123`. Al iniciar sesión escribiendo lo mismo que al registrarse recibe 401, y tampoco puede cambiarla, porque la contraseña actual no coincide. Al revés, `PATCH /:id/password` guarda la nueva con los espacios, y después el registro y el restablecimiento ya no aceptarían esa misma contraseña.
- **Solución (decidida):** recortar todas las contraseñas, en todos los caminos, para que nunca se guarde una con espacios al principio o al final:
  - `.trim()` en `password` de `loginSchema`, y en `currentPassword` y `newPassword` de `updatePasswordSchema`, con el mínimo de 6 caracteres después de recortar;
  - lo mismo para el DNI como contraseña inicial del mostrador, que ya llega recortado por su esquema.
- **Cuidado:** una contraseña que alguien ya guardó con espacios por `PATCH /:id/password` deja de coincidir cuando el login recorta. Es raro, y se resuelve con un restablecimiento del administrador.

### U-6. El administrador puede darse de baja y nadie lo puede reactivar

- **Qué es:** `DELETE /api/users/:id` lleva `self('id')`, que deja pasar al administrador para cualquier id, incluido el suyo. `UserService.remove` ([User.Service.ts:162-178](../src/User/User.Service.ts#L162-L178)) controla clientes, empleados y dueños, pero no al administrador.
- **Problema:** si el administrador se da de baja a sí mismo (o a otro administrador), queda en `BAJA` y `auth` ya no lo deja entrar. Reactivar exige ser administrador, y la siembra no lo arregla: busca `admin@cocheras.com` por email, lo encuentra y no lo toca. El sistema queda sin administrador y solo se recupera con SQL a mano.
- **Solución:** que `remove` rechace a un `ADMINISTRADOR` con 400, como ya hace `resetPassword`.

### U-7. La baja de un dueño deja activos a sus empleados

- **Qué es:** para dar de baja a un dueño se exige que no tenga sucursales activas ni reservas activas ([User.Service.ts:171-176](../src/User/User.Service.ts#L171-L176)); a sus empleados no se los mira.
- **Problema:** el dueño queda en `BAJA` y sus empleados siguen `ACTIVO`, con sesión. `isStaffOf` (`Shared/utils/staff.ts`) los sigue reconociendo como personal de su sucursal pausada, porque solo mira `parkingId`: pueden leer reservas, datos de clientes y facturas de un negocio que ya se fue del sistema.
- **Solución:** seguir la regla de las demás bajas (R-20): 409 si el dueño tiene empleados activos ("Dalos de baja primero"). La otra opción es darlos de baja en el mismo paso, en una transacción.

### U-8. `excludePassword` repite lo que ya hace la entidad (opcional)

- **Qué es:** el servicio quita `password` a mano en siete lugares (`excludePassword` y el `const { password, ...rest }` de `createUser`, [User.Service.ts:27-30](../src/User/User.Service.ts#L27-L30)).
- **Problema:** `User.password` ya es `hidden: true` y nunca se convierte a JSON, tampoco anidado en reservas o sucursales. Son dos protecciones que hay que mantener juntas sin necesidad.
- **Solución:** devolver la entidad tal cual y borrar `excludePassword`: unas 15 líneas menos, la respuesta no cambia.

### Lo que está bien y lo que queda fuera

- **Bien:** unicidad de email, DNI y teléfono en alta y edición (`assertUnique`, más los índices únicos); el mismo 401 para email inexistente, contraseña incorrecta o usuario de baja; las bajas y cambios de sucursal de empleados con turnos o reservas responden 409; el registro no deja elegir `EMPLEADO` ni `ADMINISTRADOR`, y los esquemas de edición no dejan pasar `type`, `status` ni `password`.
- **Decisión a documentar:** el login no limita los intentos. Con la carga de un TP no se arregla, pero conviene registrarlo como `shortcut:` con su fila L-xx.
- **No revisado:** la paginación (`findPage`), cubierta por `pagination.db.test.ts`.

## Cocheras: revisión posterior

Revisión de `src/Parking/` (servicio, repositorio, rutas y esquemas) y de quién usa sus datos en el Frontend. Siete problemas, anotados y sin arreglar (de P-7 solo se corrigió el comentario).

### P-1. Los datos de contacto de todos los dueños son públicos (arreglar ya)

- **Qué es:** cada cochera que devuelve la API trae a su dueño con `name`, `last_name`, `email` y `phone` (`formatParkingResponse`, [Parking.Service.ts:53-66](../src/Parking/Parking.Service.ts#L53-L66)).
- **Problema:** `GET /api/parkings/active` y `GET /api/parkings/:id` son públicas, porque el mapa se ve sin sesión. Cualquiera, sin iniciar sesión, obtiene con un solo pedido el email y el teléfono de todos los dueños con sucursales activas. El único que usa esos dos datos es el panel del administrador (`Frontend/src/pages/Admin/AdminParkings.tsx:131-132`), que llega por `GET /api/parkings`, una ruta que exige sesión.
- **Solución:** que `formatParkingResponse` incluya `email` y `phone` solo en el listado del administrador (`findAll` y `findPage`). Las rutas públicas quedan con `id`, `name` y `last_name`.
- **Si no se arregla:** son datos personales expuestos a cualquiera; si en la defensa preguntan por seguridad, es fácil de encontrar.

### P-2. El alta guarda la cochera y sus plazas en dos pasos

- **Qué es:** `ParkingService.create` ([Parking.Service.ts:172-193](../src/Parking/Parking.Service.ts#L172-L193)) guarda la cochera (`ParkingRepository.add`, que hace `flush` y la deja pausada) y después las plazas (`ParkingSpaceRepository.createBulk`, con otro `flush`).
- **Problema:**
  - Si falla el segundo paso, queda una cochera pausada y sin plazas, y el dueño recibe un 500. Si reintenta, queda una segunda cochera igual, porque el nombre no es único.
  - La sucursal huérfana se puede activar: una tarifa no exige plazas de su tipo y `reactivate` solo exige tarifa (P-3). Aparece en el mapa con capacidad 0 y toda reserva responde 409.
  - Va contra la convención del proyecto: las escrituras que tocan varias entidades van en una transacción.
- **Solución:** crear la cochera y las plazas con el mismo `em` y hacer un único `flush`, que MikroORM ejecuta en una sola transacción; por ejemplo, que `ParkingRepository.add` reciba también las plazas. No hace falta bloquear la fila, porque la cochera es nueva.

### P-3. `reactivate` habilita una cochera sin plazas

- **Qué es:** `POST /api/parkings/:id/reactivate` ([Parking.Service.ts:241-254](../src/Parking/Parking.Service.ts#L241-L254)) exige una tarifa vigente antes de habilitar la sucursal.
- **Problema:** no exige plazas activas. Una sucursal sin plazas, sea la huérfana de P-2 o una con todas las plazas dadas de baja, se habilita y aparece en el mapa sin lugar para nadie: toda reserva responde 409.
- **Solución:** exigir al menos una plaza activa además de la tarifa, con un 400 de mensaje parecido. Es una consulta más.

### P-4. La foto de portada tiene dos nombres: `imageUrl` e `image`

- **Qué es:** el esquema acepta los dos campos ([Parking.Schema.ts:35-36](../src/Parking/Parking.Schema.ts#L35-L36)). El servicio los junta al crear y al editar (gana `imageUrl`) y la respuesta devuelve los dos con el mismo valor ([Parking.Service.ts:107-108](../src/Parking/Parking.Service.ts#L107-L108)). La entidad tiene una sola columna, `imageUrl`.
- **Problema:**
  - `image` no lo manda nadie: el formulario del Frontend envía solo `imageUrl` (`ParkingDrawer.tsx:90`; ahí `image` es solo el nombre del campo del formulario). En la respuesta sobra, y obliga al Frontend a leer `p.imageUrl || p.image` en cuatro lugares (`ListDrawer.tsx:126` y `:241`, `FavoritesDrawer.tsx:48`, `OwnerDashboard.tsx:282`).
  - Con dos nombres para lo mismo, un pedido con los dos y valores distintos guarda uno y descarta el otro sin avisar.
  - Además, el backend acepta cualquier texto: el control de `http://` o `https://` está solo en el formulario (`ParkingDrawer.tsx:63`). Por la API se guarda `javascript:alert(1)` o un texto más largo que la columna (255), que termina en un 500.
- **Solución:** dejar solo `imageUrl`.
  - **Backend:** borrar `image` del esquema, del servicio (las dos líneas que lo combinan) y de la respuesta. En el esquema, validar la URL: `z.string().trim().url().regex(/^https?:\/\//i).max(255)`, opcional y nullable como ahora.
  - **Frontend:** leer solo `p.imageUrl` en esos cuatro lugares (`types/parking.types.ts` ya declara solo `imageUrl`).
- **Sobre la "compatibilidad con el Frontend":** no hace falta. El Frontend nunca envía `image` y lee `imageUrl` primero; `image` solo existe como respaldo de lectura y se quita junto con este cambio.

### P-5. `ParkingRepository.remove` no la llama nadie, y saltea las reglas de la pausa

- **Qué es:** `remove` ([Parking.Repository.ts](../src/Parking/Parking.Repository.ts)) pone `isActive = false` y nada más. La baja real es `pause` (L-42, L-44), que bloquea la fila, cancela las pendientes con motivo y avisa. Nada en `src`, `tests` ni `tests-catedra` llama a `remove`.
- **Problema:** no rompe nada hoy, pero es una trampa. Quien la use creyendo que es "la baja" pausa una sucursal sin cancelar sus reservas pendientes: los clientes llegan a una cochera cerrada.
- **Solución:** la exige la interfaz `Repository<T>`, que `Frontend/docs/requisitos-tp.md` usa en la defensa (la misma decisión que en el hallazgo 7). Dejarla, pero que delegue en la regla real: `remove = (item) => this.pause(item.id, …, false).then(Boolean)`, o un comentario que diga que la baja va por `pause`.

### P-6. Muchos `any`: TypeScript no controla las formas de las cocheras

- **Qué es:** el servicio devuelve `Promise<any>` en `findAll`, `findActive`, `findOne`, `create`, `update`, `findByOwnerId`, `reactivate` y `getMetrics`; `update` recibe `data: any`, y `formatParkingResponse` trabaja con `as any` (16 en el servicio, 12 en el repositorio).
- **Problema:** un cambio de forma no lo detecta el build. Caso concreto: `ReservationService.notifyIfFull` lee `live.availableSpaces` de `ParkingService.findOne`. Si ese campo se renombra (por ejemplo, al limpiar la respuesta como pide P-4), `pnpm build` pasa, `undefined > 0` da `false` y se le avisa "Sucursal llena" al dueño en cada ingreso.
- **Solución:**
  - un tipo para la respuesta: `export type ParkingView = ReturnType<ParkingService['formatParkingResponse']>`, y que los métodos devuelvan `ParkingView` (o `ParkingView[]`);
  - `update(id, data: UpdateParkingInput)`, con el tipo que ya sale del esquema de zod;
  - en `formatParkingResponse`, `wrap(parking.owner).isInitialized()` de MikroORM en vez de los `as any`.

### P-7. `province` admite nulos en la base aunque el alta la exige

- **Qué es:** `Parking.province` es `nullable: true` (`Parking.Entity.ts:16`) solo por las filas anteriores a la columna. El alta la exige con zod (`Parking.Schema.ts:8`), y la respuesta (`?? null`, `Parking.Service.ts:88`) y `listLocalities` (`WHERE province IS NOT NULL`, `Parking.Repository.ts:14`) cubren las nulas.
- **Problema:** el comentario de la entidad decía que la siembra completa las viejas, y nadie lo hace. Una cochera vieja sin provincia no aparece en el filtro por localidad del administrador. Hoy no pasa nada: el dato es obligatorio donde importa.
- **Resuelto ahora:** el comentario, sin commit. Ahora dice que nadie completa las filas viejas y cuándo pasar a `nullable: false`.
- **Después de la defensa** (antes no se toca el esquema: es un riesgo sin beneficio para la demo):
  1. en cada base, `SELECT COUNT(*) FROM parking WHERE province IS NULL`;
  2. si da 0, `nullable: false` en la entidad;
  3. sacar el `?? null` de la respuesta y el `WHERE province IS NOT NULL` de `listLocalities`.

### Lo que está bien

- **Pausar (L-42, L-44):** transacción con la fila bloqueada; cancela las pendientes y respeta las que están en curso. Los avisos salen después de guardar.
- **Permisos de las rutas:** todas las escrituras llevan `auth(DUENO)` y `ownParking`, y el alta además `self('ownerId')`. El administrador solo lee (RA-19).
- **Ingresos de las métricas:** cuentan las facturas que no están anuladas, la misma regla que el resumen del administrador.
- **No revisado:** el controlador línea por línea y la paginación (`findPage`, cubierta por `pagination.db.test.ts`). No hay prueba del alta de cochera.

## Servicios adicionales: revisión posterior

Revisión de `src/ServiceCatalog/` (catálogo del administrador) y `src/ServicePrice/` (precio de cada servicio por sucursal), de su uso en el Frontend y de su relación con las reservas. Tres problemas, anotados y sin arreglar.

### S-1. Cambiar el precio de un servicio no es atómico y puede dejar dos precios vigentes

- **Qué es:** `ServicePriceService.create` ([ServicePrice.Service.ts:13-26](../src/ServicePrice/ServicePrice.Service.ts#L13-L26)) vence el precio vigente (`repo.remove`, con su `flush`) y después crea el nuevo (`repo.add`, con otro `flush`), sin transacción ni bloqueo.
- **Problema:**
  - **Doble clic en "Guardar" del dueño:** los dos pedidos encuentran el mismo vigente, los dos lo vencen y los dos crean uno nuevo. Quedan dos precios vigentes del mismo servicio en la sucursal: la lista lo muestra dos veces y `findActive` devuelve cualquiera.
  - **Falla el segundo paso:** el viejo ya quedó vencido y no hay nuevo. El servicio desaparece de la sucursal y el dueño recibe un 500.
- **Solución:** un solo método del repositorio, en `em.transactional`, que bloquee la sucursal (`lockParking`, de `ParkingSpace.Repository.ts`), vuelva a buscar el vigente, lo venza y cree el nuevo. Agregar una prueba de que después del cambio hay un solo precio vigente; el módulo no tiene ninguna.
- **Tarifas:** `ParkingPrice.Service` tenía el mismo patrón y ya está resuelto con `lockedFor` (PP-1). Sirve de modelo para este arreglo.

### S-2. El catálogo acepta servicios repetidos, y uno dado de baja no se puede recuperar

- **Qué es:** el alta y la edición del catálogo ([ServiceCatalog.Service.ts:16-22](../src/ServiceCatalog/ServiceCatalog.Service.ts#L16-L22)) guardan el nombre sin compararlo con los existentes, y no hay forma de reactivar un servicio dado de baja.
- **Problema:** el administrador puede crear "Lavado" dos veces, o "lavado" y "Lavado ". Los dueños ven dos servicios iguales y cargan precios en uno distinto cada uno. Y como una baja no tiene vuelta atrás, la única forma de volver a ofrecer el servicio es crear otro con el mismo nombre: un repetido. Tipos de vehículo ya lo resuelven con `nameKey`.
- **Solución:** en el alta y la edición, 409 si otro servicio activo tiene el mismo `nameKey` (`Shared/utils/names.ts`). Si el que coincide está dado de baja, reactivarlo en vez de crear otro, como hace la importación del catálogo con marcas y modelos.

### S-3. Los esquemas no limitan el texto ni el precio

- **Qué es:** [ServiceCatalog.Schema.ts](../src/ServiceCatalog/ServiceCatalog.Schema.ts) y [ServicePrice.Schema.ts](../src/ServicePrice/ServicePrice.Schema.ts).
- **Problema:**
  - Nombre y descripción no se recortan ni tienen máximo: un nombre de dos espacios pasa el mínimo de 2 y queda un servicio sin nombre visible; un texto de más de 255 caracteres termina en un 500 (`varchar(255)`).
  - El precio no tiene máximo: por encima de lo que entra en `numeric(12,2)` también da 500, y los centavos de más se redondean sin avisar.
- **Solución:** nombre y descripción con `.trim().min(...).max(255)`; precio con `.max(9_999_999_999.99).multipleOf(0.01)`.

### Lo que está bien y lo que queda fuera

- **Bien:** las bajas con reservas activas responden 409 con la lista (`assertNoActiveReservations`, R-24), al sacar el servicio de una sucursal y al darlo de baja del catálogo, que además vence sus precios en todas las sucursales en una transacción. Los precios nunca se editan en el lugar y la reserva guarda la FK al precio que tenía (D-16). El catálogo lo escribe solo el administrador y los precios solo el dueño de la sucursal (`ownParking`); las lecturas son públicas porque las usa el mapa.
- **Menor:** las dos bajas controlan las reservas activas fuera de una transacción. Si una reserva con ese servicio se crea en el mismo instante, el servicio se da de baja igual y la salida lo cobra. Es casi imposible en la práctica.
- **No revisado:** `ParkingPrice` (ver S-1 y PP-1).

## Plazas: revisión posterior

Revisión de `src/ParkingSpace/` (entidad, esquemas, repositorio, servicio, controlador y rutas) y de qué endpoints llama el Frontend. Dos problemas y un detalle menor, anotados y sin arreglar.

### PS-1. Los códigos de plaza se pueden repetir dentro de una sucursal

- **Qué es:** nada impide dos plazas con el mismo código en una sucursal: ni la base (no hay índice único en sucursal + código) ni el servicio ([ParkingSpace.Service.ts:53-98](../src/ParkingSpace/ParkingSpace.Service.ts#L53-L98)).
- **Problema, tres caminos:**
  - **Baja y alta en lote:** una sucursal tiene A-01 a A-03. El dueño da de baja A-03, que tiene reservas finalizadas, y después agrega una plaza. El lote calcula el número siguiente solo con las plazas activas (`findByParking` filtra `isActive`), así que crea otra A-03. En el historial, las reservas de la A-03 dada de baja y las de la nueva aparecen en "la misma" plaza, aunque son dos distintas.
  - **Doble clic en "Agregar plazas":** el lote lee los códigos y después crea, sin transacción ni bloqueo. Dos pedidos a la vez calculan el mismo número y crean A-04 dos veces.
  - **Alta individual (`POST /:parkingId/spaces`):** acepta cualquier código, también uno que ya existe. El Frontend no la usa, pero la API la expone y puede ser evidencia de un requisito de la cátedra (revisar `Frontend/docs/revision-alcance.md` antes de tocarla).
- **Solución:**
  - en el lote, calcular el número siguiente con todas las plazas de la sucursal, incluidas las dadas de baja;
  - correr el lote en una transacción con `lockParking`;
  - en el alta individual, 409 si el código ya existe en la sucursal;
  - opcional: índice único (sucursal, código), revisando antes que no haya repetidos en la base.

### PS-2. Con más de 99 plazas de un tipo, el orden de los códigos se rompe (opcional)

- **Qué es:** los códigos se rellenan a dos dígitos y se ordenan como texto (`orderBy: { spaceCode: 'ASC' }` en `findByParking` y en los candidatos de `findFreeSpaces`).
- **Problema:** una sucursal con 120 plazas lista A-10, A-100, A-101… A-109, A-11. Además, "la primera plaza libre" que se asigna a una reserva sale de ese orden. El esquema permite hasta 500 plazas por tipo.
- **Solución:** ordenar por el número del código en vez del texto (por ejemplo, en JS después de leer). Rellenar a tres dígitos también sirve, pero cambia el formato de los códigos existentes.

### PS-3. El esquema acepta `OCUPADO`, que solo debería escribir el ingreso

- **Qué es:** la plaza tiene `state` (`LIBRE`, `OCUPADO`, `MANTENIMIENTO`) y la reserva tiene `status` (`EN CURSO`…). `OCUPADO` repite "hay una reserva `EN CURSO` en esta plaza". El ingreso, el mostrador, el cambio de plaza y la salida mueven los dos en la misma transacción (`Reservation.Repository.ts:163, 198, 228, 461`). Coinciden porque todas las lecturas que deciden algo miran las reservas: `busyIntervals` estira toda reserva en curso hasta `max(endTime, ahora)` (R-21, `ParkingSpace.Repository.ts:34`), y tanto el conteo de disponibles (`Parking.Service.ts:48`) como `takeOutOfService` (`ParkingSpace.Repository.ts:93-94`) suman las reservas en curso. `state` solo acelera la consulta de "libre ahora" y agrega `MANTENIMIENTO`.
- **Problema:** `PUT /api/parkings/spaces/:id` acepta los tres estados (`ParkingSpace.Schema.ts:23`), y el repositorio los asigna sin control (`ParkingSpace.Repository.ts:157-164`). Una plaza pasada a `OCUPADO` a mano, sin reserva, queda fuera de los ingresos de ahora hasta que alguien la vuelva a `LIBRE`: ninguna salida la va a liberar. La interfaz del dueño nunca manda `OCUPADO` (solo `MANTENIMIENTO`, y `LIBRE` para rehabilitar, en `OwnerSpaces.tsx:89`), así que pasa solo llamando a la API a mano. Pasar a `LIBRE` una plaza con un vehículo adentro no permite asignarla: solo cambia el estado guardado.
- **Solución:** sacar `OCUPADO` del enum del esquema. Es una línea, cierra el único caso real y no rompe el Frontend. Un 409 al pasar a `LIBRE` con una reserva en curso es opcional: el sistema ya se defiende por las reservas, y agregarlo solo mejora la prolijidad del dato.
- **Guías:** G-10 (`OCUPADO` lo escribe un solo camino, el ingreso) y N-1 (`state` en la plaza frente a `status` en la reserva).

### Menor: la disponibilidad no valida el horario

- **Qué es:** `GET /:parkingId/spaces/availability` (`parkingSpaceavailability` en [ParkingSpace.Schema.ts](../src/ParkingSpace/ParkingSpace.Schema.ts)).
- **Problema:** con un fin anterior al inicio, todas las plazas aparecen libres. Solo afecta esa consulta: el alta de la reserva valida el horario.
- **Solución:** `.refine` en el esquema que exija `endTime > startTime`.

### Lo que está bien

- **Sacar una plaza de servicio (R-18, R-19):** transacción con la sucursal bloqueada (desde `f0583c5`); propone a qué plaza pasar cada reserva futura, responde 409 sin confirmación o si alguna no tiene lugar, avisa después de guardar y no deja sacar una plaza con un vehículo adentro.
- **El tipo de una plaza no se edita (R-19):** el esquema solo deja cambiar el estado.
- **Estado a mano `LIBRE`:** marcar `LIBRE` una plaza con un vehículo adentro no permite asignarla, porque `findFreeSpaces` también mira las reservas en curso. El caso de `OCUPADO` a mano es PS-3.
- **Permisos:** todas las escrituras llevan `auth(DUENO)` y `ownParking`.

## Resto de `src`: revisión posterior

Revisión de los módulos que quedaban: `ParkingPrice`, `EmployeeShift`, `Invoice`, las rutas de `Reservation` que no se habían visto, `Vehicle` (con `Catalog`), `Holiday`. Solo lectura del código, sin correr pruebas. Ninguno bloquea la demo: todos piden un doble clic, dos personas a la vez o montos fuera de lo normal. Anotados y sin arreglar, salvo PP-1, PP-3 y PP-4.

### PP-1. Una tarifa puede quedar vigente dos veces, y la baja no la saca ✅

- **Qué es:** `ParkingPriceService.create` vencía la vigente y creaba la nueva en dos `flush`, sin transacción ni bloqueo. `update` pasa por ahí.
- **Problema:** con un doble clic, o con dos pestañas, quedan dos vigentes del mismo tipo. `startDate` guarda solo el día (`LocalDateType`), así que `findActive` ordena dos filas empatadas y cobra cualquiera. Además, `DELETE /prices/:id` vence solo una: el dueño ve la tarifa borrada, pero la cochera sigue cobrando la otra. El comentario de `findByParking` ("la más reciente si quedó más de una") muestra que el caso ya se vio y se tapó en la lectura.
- **Solución (`e8521e8`):** `ParkingPriceRepository.lockedFor` abre `em.transactional` y bloquea la cochera con `lockParking`. Adentro, `create` busca la vigente, la vence (`expireActiveByVehicleType`) y crea la nueva; si algo falla, no queda nada a medias. La baja también corre ahí (PP-4). `findByParking` sigue quitando repetidas, por las bases que ya tengan dos vigentes. Prueba: dos altas simultáneas terminan con una sola vigente (`tests/parkings/PauseAndTariff.db.test.ts`).

### PP-3. El PUT de una tarifa devuelve otro id ✅

- **Qué es:** por el versionado, `PUT /api/parkings/prices/:id` vence la tarifa y crea otra, con id nuevo.
- **Problema:** quien edita dos veces con el id de la primera respuesta recibía 404 ("Tarifa no encontrada o inactiva"). El Frontend no lo sufre porque usa el `POST` por tipo, pero la API obligaba a seguir el id nuevo.
- **Solución (`e8521e8`):** el id sigue cambiando, porque es el versionado, pero un id vencido ya no da 404: cambia la vigente de ese tipo en esa cochera (`ParkingPriceService.update`). La pertenencia (`ownParking(parkingOf(ParkingPrice))`) sale de la fila vencida, que es de la misma cochera. Prueba en el mismo archivo.

### PP-4. Dar de baja la última tarifa saca la sucursal del mapa sin avisar ✅

- **Qué es:** `DELETE /api/parkings/prices/:id` vencía cualquier tarifa vigente.
- **Problema:** sin ninguna tarifa, la sucursal sigue activa, pero `ParkingService.findActive` la saca del mapa y toda reserva responde 409 (`assertRate`). El dueño no se entera: para él la sucursal está habilitada.
- **Solución (`e8521e8`):** con la sucursal activa, la baja de su última tarifa vigente responde 409 y pide cargar otra o pausar la sucursal. Una sucursal pausada sí puede quedar sin tarifas. `OwnerTariffs` ya muestra el mensaje en un toast. Prueba en el mismo archivo.

### INV-1. Doble cobro de una factura

- **Qué es:** `InvoiceService.pay` (`Invoice.Service.ts:13-29`) lee la factura, comprueba que no esté `PAGADA` y después la guarda.
- **Problema:** con un doble clic, o con dos empleados a la vez (uno cobra en efectivo y el otro con tarjeta), los dos pasan el control. El segundo pisa el medio de pago y el comprobante del primero, y la caja no cierra.
- **Solución:** un `nativeUpdate` condicionado a `status: 'PENDIENTE'`, y un 409 si no actualizó ninguna fila. Es el mismo patrón que la cancelación de reservas.

### ES-1. Un cambio de turnos y una reserva nueva pueden cruzarse

- **Qué es:** `saveDay`, `saveTemplateDay`, `createClosure` y `setHolidayOpen` (`Schedule.Service.ts`) miran las reservas activas y después escriben, sin bloquear la cochera. El alta de reserva comprueba la cobertura (`assertCovered`, `Reservation.Service.ts:85`) y elige el empleado (`employeeFor`) antes de `lockParking`.
- **Problema:** el dueño saca el turno del sábado de 10 a 14 mientras un cliente reserva el sábado de 11 a 12. Los dos controles pasan, y la reserva queda en horas sin empleado, asignada a alguien que ya no tiene turno.
- **Solución:** pasar `assertCovered` y `employeeFor` adentro de la transacción del alta, después de `lockParking`, y que los cambios de turnos también bloqueen la cochera. Es poco probable. Si no se arregla, conviene dejarlo como `shortcut: L-xx`.

### PP-2. Montos sin tope

- **Qué es:** el precio de la tarifa (`ParkingPrice.Schema.ts:3`) y `amountReceived` (`Invoice.Schema.ts:21`) aceptan cualquier número positivo.
- **Problema:** con 10.000.000.000, la columna `numeric(12,2)` se desborda y responde 500 en lugar de 400. Con 1000,555 se redondea sin avisar.
- **Solución:** `.max(99_999_999).multipleOf(0.01)`. Es el mismo arreglo que S-3: conviene hacer los tres esquemas juntos.

### INV-2. El mensaje de vuelto muestra decimales de punto flotante

- **Problema:** para un total de 1000 con 999,9 recibidos, el mensaje dice "Faltan $0.10000000000002…" (`Invoice.Service.ts:19`).
- **Solución:** `(total - recibido).toFixed(2)`.

### INV-3. Se cobra en efectivo sin `amountReceived`

- **Qué es:** `amountReceived` es opcional en el esquema (`Invoice.Schema.ts:22`), y `InvoiceService.pay` (`Invoice.Service.ts:18`) solo compara contra el total si viene.
- **Problema:** un cobro en efectivo sin el monto recibido pasa como `PAGADA` con `amountReceived: null`. No queda registro de cuánto entró ni del vuelto, y el control "tiene que cubrir el total" del comentario de `pay` no se cumple.
- **Solución:** con `paymentMethod: 'EFECTIVO'`, exigir `amountReceived` (400). Va en el esquema con un `superRefine`, o en el servicio junto al control del total. Antes, revisar que el Frontend siempre lo mande.

### V-1. Patente activa duplicada

- **Qué es:** `VehicleService.create` comprueba que la patente esté libre (`assertPlateFree`) y recién después agrega el vehículo. No hay índice único, por las bajas lógicas.
- **Problema:** con un doble clic en "Agregar vehículo" quedan dos vehículos activos con la misma patente. Después, el mostrador toma cualquiera de los dos.
- **Solución:** un índice único sobre una columna generada que vale `plate` si el vehículo está activo y `NULL` si no. Hay que verificar que `schema.update` lo cree. La otra opción es una transacción que bloquee al cliente.

### ES-2. `GET /api/shifts/coverage/:parkingId/:dayOfWeek` da resultados falsos y nadie lo usa

- **Qué es:** `calculateCoverageGaps` (`EmployeeShift.Service.ts:72`).
- **Problema:** ignora el horario de la sucursal y los cierres. En una cochera que abre a las 7 informa un hueco de 00:00 a 07:00. Además lee `isActive`, así que con un cambio que rige desde mañana muestra la versión de mañana. El Frontend no lo llama, y `revision-alcance.md` no lo menciona.
- **Solución:** borrar la ruta y el método.

### H-1. Feriados nacionales duplicados

- **Qué es:** el índice único de `Holiday` es `(date, owner)` (`Holiday.Entity.ts:10`), y MySQL admite varios `NULL` en un índice único.
- **Problema:** un doble clic del administrador, o `syncOfficial` corriendo a la vez que la importación, deja dos feriados nacionales en la misma fecha.
- **Solución:** volver a buscar el feriado dentro de la transacción del alta. El arreglo completo es una columna generada `IFNULL(owner_id, '')` con el índice único sobre ella.

### R-a. El mostrador repite la regla del personal

- **Problema:** `walkIn` (`Reservation.Service.ts:189-192`) escribe a mano `isEmployee || isOwner`. CLAUDE.md pide `isStaffOf` como única fuente.
- **Solución:** `if (!isStaffOf(user, parking)) throw …`.

### Menores

- `createClosure` revisa las reservas de hoy aunque el cierre empiece a regir la semana próxima (`closureFrom`). Puede dar un 409 que no corresponde.
- `getRange` hace unas 5 consultas por día. Con 62 días son unas 300 consultas por pedido. Alcanza para la carga actual.
- El comentario de `Invoice.Route.ts:18` dice que la factura "la anula la cancelación de la reserva", y es falso. Solo se cancelan reservas `PENDIENTE`, que todavía no tienen factura, y nadie llama a `InvoiceRepository.remove` (queda por la interfaz).
- El cambio de modelo de un vehículo con reservas responde 400, y la baja del vehículo responde 409 por la misma causa.

### Lo que está bien

- Todas las rutas de reservas que escriben verifican al personal en el servicio (`assertStaffOf`), y `rate` verifica al cliente.
- La importación del catálogo es una sola transacción.
- El feriado propio y el nacional se fusionan bien, y la sincronización con el calendario oficial nunca quita fechas.
- La semana tipo con vigencias (L-01) guarda la plantilla y las transferencias en un solo `flush`.

## Reservas: puntos flojos

Repaso del alta de reserva y sus rutas, por si aparecen en la presentación. Ninguno da un resultado incorrecto hoy salvo RS-3, que es poco probable. Anotados y sin arreglar.

### RS-1. La superposición del vehículo responde 400, y "sin plaza" responde 409

- **Qué es:** `Reservation.Repository.ts:352-355` lanza 400 cuando el vehículo ya tiene otra reserva en ese horario. Extender hace lo mismo (`Reservation.Service.ts:106`). En cambio, la plaza tomada (`:214`), "no hay plazas" (`:312`) y el vehículo adentro de otra sucursal (`:32`) responden 409.
- **Problema:** las dos son un choque con un recurso que ya existe, no un dato mal formado. El Frontend no puede distinguir por código "corregí el formulario" de "otro ya lo tiene".
- **Solución:** pasar las dos a 409. Revisar antes que ninguna prueba ni pantalla dependa del 400.

### RS-2. Cancelar y las rutas del personal no llevan `ownReservation` en la ruta

- **Qué es:** `DELETE /api/reservations/:id` (`Reservation.Route.ts:41`) solo pide `auth()`; el permiso lo resuelve el servicio (cliente dueño de la reserva, administrador o `isStaffOf`). Pasa lo mismo con `/:id/space`, `/:id/end`, `/:id/services`, `/:id/check-in` y `/:id/check-out`, que verifican en el servicio con `assertStaffOf`.
- **Problema:** funciona igual (la prueba de permisos del ítem 6 lo cubre), pero rompe la convención de L-37: "ruta nueva con un id de reserva lleva su pertenencia". Quien lea la ruta no ve quién puede usarla.
- **Solución:** sumar `ownReservation` a esas rutas y dejar el control del servicio como segunda barrera. No cambia respuestas, salvo que un 404 de reserva inexistente siga pasando al servicio (así funciona hoy `ownReservation`).

### RS-3. Tarifa, horario y empleado se validan fuera de la transacción del alta

- **Qué es:** `ReservationService.create` llama a `assertRate`, `assertSchedule` (cobertura) y `employeeFor` antes de `createReservationAtomically`, que es donde se bloquea la cochera. La plaza, la superposición del vehículo y la pausa sí se revalidan con el bloqueo.
- **Problema:** un cambio de turno o de tarifa en ese mismo instante no se ve: la reserva puede quedar sin cobertura, con un empleado que ya no tiene turno o con la tarifa anterior guardada en `hourlyRate`. Es el lado de la reserva de ES-1.
- **Solución:** la misma de ES-1: mover esos tres controles adentro de la transacción, después de `lockParking`. Si no se arregla, dejarlo como `shortcut: L-xx` junto con ES-1.

### RS-4. El margen de 10 minutos del alta es un número suelto

- **Qué es:** `Reservation.Schema.ts:14` acepta un inicio hasta `10 * 60 * 1000` ms en el pasado.
- **Problema:** es una regla de negocio fuera de `Shared/constants/` (CLAUDE.md), y está al lado de `ARRIVAL_TOLERANCE_MINUTES` (15) y `CHECKOUT_GRACE_MINUTES` (10) en `schedule.ts` sin relación visible con ninguna.
- **Solución:** una constante en `schedule.ts` (p. ej. `START_PAST_TOLERANCE_MINUTES = 10`, con su comentario) y `MINUTE_MS` de C-2. Va con C-1.

## Tipos de vehículo: revisión posterior

Repaso de `src/Vehicle/VehicleType/` (RA-11, RA-26), por si aparece en la presentación. Lo usa un solo rol (el administrador), así que las carreras son poco probables. Anotado y sin arreglar.

### VT-1. El nombre único solo lo controla el servicio

- **Qué es:** `VehicleTypeService.assertUniqueName` (`VehicleType.Service.ts`) lee todos los tipos activos y compara con `nameKey`; después `create` o `update` escriben. `VehicleType.Entity.ts` no tiene índice único en `name`.
- **Problema:** dos altas (o un alta y un renombre) con el mismo nombre a la vez pasan las dos el control y quedan dos tipos iguales. Un índice común tampoco alcanzaría: la comparación es sin mayúsculas, tildes ni espacios (`nameKey`), y un tipo dado de baja seguiría ocupando el nombre.
- **Solución:** G-3. Una columna `name_key` (con `nameKey`) e `IF(is_active, name_key, NULL)` generada con índice único, o la escritura en una transacción que bloquee algo común. Por el uso real (un solo administrador), alcanza con un `shortcut: L-xx` en `assertUniqueName`.

### VT-2. La baja de un tipo no es atómica

- **Qué es:** `VehicleTypeService.remove` mira `usage` (modelos, vehículos, plazas y tarifas vigentes) y recién después llama a `VehicleTypeRepository.remove`, sin transacción. Adentro, `nativeDelete(DnrpaTypeMap, …)` se ejecuta en el acto y el `isActive = false` va en un `flush` aparte.
- **Problema:** dos cosas.
  - Entre `usage` y la baja, un dueño puede crear una plaza o una tarifa de ese tipo, o la importación del CSV un modelo: el tipo queda dado de baja con cosas activas que lo apuntan.
  - Si el `flush` falla, las descripciones del DNRPA ya se borraron y el tipo sigue activo, sin ellas (vuelven a la sugerencia en la próxima importación).
- **Solución:** `em.transactional` con `usage`, el borrado de las filas y la baja adentro (G-1 y G-2). La carrera con el alta de plazas sigue abierta salvo que se bloquee la fila del tipo (`PESSIMISTIC_WRITE`) también desde quien crea plazas y tarifas; la parte de las dos escrituras se arregla sola con la transacción.

### VT-3. `PUT` y `PATCH /:id` hacen lo mismo

- **Qué es:** `VehicleType.Route.ts` registra las dos con el mismo esquema y el mismo `controller.update`. El Frontend solo usa `PUT` (`vehicleType.service.ts`), y ni `revision-alcance.md` ni las pruebas nombran el `PATCH`.
- **Problema:** no da un resultado incorrecto; es una ruta más que mantener y documentar (G-12).
- **Solución:** borrar la línea del `PATCH`. Una línea, sin cambios en el Frontend.

### VT-4. El esquema de edición exige el nombre: la rama "sin nombre" no se alcanza

- **Qué es:** `updateVehicleTypeSchema = createVehicleTypeSchema.partial()` vuelve opcional `body`, no `name`: con body, `name` sigue obligatorio. `VehicleTypeService.update` tiene un `if (data.name === undefined) return this.findOne(id)` que solo se alcanzaría sin body.
- **Problema:** el esquema y el servicio dicen cosas distintas sobre si el nombre es opcional. Como el único campo editable es el nombre, el `PUT` siempre lo pide.
- **Solución:** que `updateVehicleTypeSchema` sea igual a `createVehicleTypeSchema` y sacar la rama del servicio. Va con VT-3.

### Lo que está bien

- Los tipos base (AUTO, MOTO, CAMIONETA) no se renombran ni se dan de baja, y el nombre se compara con `nameKey`, igual que el catálogo.
- La baja con plazas, tarifas vigentes, modelos o vehículos activos responde 409 con el detalle de qué lo usa.
- `reassignDescriptions` (RA-26) mueve filas, modelos y vehículos en una transacción y rechaza con 409 si hay reservas activas (D-12).
- Plazas, tarifas, modelos y vehículos apuntan al tipo por id, así que renombrar no desincroniza nada.

## Código muerto y simplificaciones

Barrido de todo `src` con tres herramientas: un script que compara cada ruta con las llamadas del Frontend (`src/`), el servicio de referencias de TypeScript (métodos y exports que nadie llama de forma directa, también contra `tests/` y `tests-catedra/`) y `tsc --noUnusedLocals --noUnusedParameters`. Cada candidata a borrar se cruzó con `revision-alcance.md` y `requisitos-tp.md`, para no sacar la evidencia de un requisito. Anotado y sin arreglar. En total se pueden sacar unas 60 líneas sin cambiar nada de lo que se ve, más las rutas que decida el equipo. No hay dependencias de npm para sacar (revisado a ojo contra los imports).

### Código muerto: se puede borrar

- **L-1. `VehicleService.findVehiclesByUserId`** (`Vehicle.Service.ts:17`): es una copia exacta de `findActiveByUserId` (línea 88) y nadie la llama. Borrarla.
- **L-2. Ruta `coverage`:** es ES-2. Borrar la ruta, `getCoverage` en el controlador, `calculateCoverageGaps` y `getShiftsByParkingAndDay`, si no tiene otro uso (unas 30 líneas).
- **L-3. Lo que detectó `tsc`:** el import de `ACTIVE_RESERVATION_STATUSES` en `Parking.Repository.ts` y `isoOf` en `demo/generate.ts`. Los otros cinco avisos son parámetros `req`/`res`/`next` que Express exige en la firma.
- **L-4. Tipos exportados que nadie usa:** `CreateParkingPriceInput`, `UpdateReservationInput`, `PageMeta`, `PublicUserCreateInput`, `EmployeeCreateInput`, `UserUpdateInput` y `CreateVehicleInput`. Son una línea cada uno y salen de zod. Conviene usarlos en lugar de los `data: any` de los servicios (como propone P-6), o borrarlos. `UpdateParkingInput` queda, porque P-6 lo usa.

### Rutas que el Frontend no llama

| Ruta | Decisión |
|---|---|
| `GET/PUT/DELETE /api/shifts/:id` y `/api/shifts/closures` | Se quedan: son la evidencia del CRUD de TurnoEmpleado (`revision-alcance.md:35`). |
| `GET/PUT /api/parkings/prices/:id` | Se quedan: son evidencia del CRUD de PrecioVehículoHora (`revision-alcance.md:36`), y las cubren las pruebas. |
| `GET /api/shifts/config` | Nadie la llama y devuelve una constante. Se puede borrar. |
| `GET/PUT/PATCH/DELETE /api/insurances/:id` | La pantalla solo lista y da de alta seguros, y no figuran en los requisitos. Lo decide el equipo: ¿se quedan como CRUD de Seguro o se borran? |
| `GET /api/brands/:id`, `GET /api/models/:id` | Son lecturas públicas cortas y no hacen daño. Pueden quedar. |
| `GET /api/parkings/:id/service-prices/active/:catalogId`, `GET /api/parkings/service-prices/:id` | Nadie las llama. Se pueden borrar con sus métodos, salvo que se quieran como evidencia del CRUD de servicios. |

### Métodos que solo existen por la interfaz `Repository<T>`

Nadie llama de forma directa a estos métodos:

- `EmployeeShiftRepository.add`, `update` y `remove`
- `InvoiceRepository.findAll`, `add` y `remove`
- `ParkingRepository.remove`
- `ParkingPriceRepository.findAll` y `update`
- `ParkingSpaceRepository.findAll` y `remove`
- `ReservationRepository.add`
- `ServicePriceRepository.findAll` y `update`

Se quedan: la interfaz es la evidencia de la cátedra (`requisitos-tp.md`), con el mismo criterio que el hallazgo 7 y P-5. Hay dos casos con riesgo:

- `ParkingRepository.remove` saltea las reglas de la pausa. Es P-5.
- `EmployeeShiftRepository.add`, `update` y `remove` escriben turnos sin pasar por `saveTemplateDay`, que según CLAUDE.md es el único camino de escritura de la semana tipo. Si alguien los llama, rompe las vigencias (L-01). Conviene un comentario de una línea en cada uno, como propone P-5.

### Repetido: conviene unificar

- **L-5. Dos generadores de códigos de plaza** (`Parking.Service.ts:180-188` y `ParkingSpace.Service.ts:76-97`). Los dos arman `${prefix}-${NN}`: el alta de cochera numera desde 1 y el alta de plazas, desde el máximo que ya existe. Si se arregla PS-1 o PS-2, hay que hacerlo en los dos lugares. Que el alta de cochera llame a la misma función que el alta de plazas; así se cierra también parte de P-2.
- **L-6. Las fechas a texto están dos veces:** `pad`, `iso` y `clock` (`Schedule.Service.ts:24-28`) repiten `isoDate` y `formatTimeHHMM` de `Shared/utils/dateUtils.ts`. Importar las de `dateUtils`.
- **L-7. La misma consulta de reservas, escrita dos veces:** `saveTemplateDay` y `createClosure` (`Schedule.Service.ts`) repiten el mismo `em.find(Reservation, …)` de las reservas activas que todavía no terminaron. Llevarla a un método `upcomingReservations(parkingId)` en `ScheduleRepository`, al lado de `activeReservations`.
- **L-8. El mostrador repite `isStaffOf`:** es R-a.

### No apareció

- Ningún método de servicio o de controlador está sin usar, salvo L-1.
- No hay helpers repetidos fuera de los de arriba.

## Nombres: revisión posterior

Revisión de los nombres de entidades, enums, rutas, parámetros y métodos de todo `src`. Anotado y sin arreglar.

Renombrar no cuesta lo mismo en todos los casos:

- **Solo código** (métodos, variables, enums): no rompe nada afuera.
- **API** (un campo del JSON o un parámetro de ruta): hay que cambiar también el Frontend.
- **Base** (una columna): no hay migraciones, y `schema.update({ safe: true })` no renombra columnas. Hace falta SQL a mano en cada base y otra pasada de `dropLegacy`.

Antes de la defensa, solo cambios de código. Los de API y base quedan anotados.

### N-1. Cinco formas de decir si un registro está vigente

- **Qué es:** `User.status` (`'ACTIVO'`/`'BAJA'`); `isActive` en Parking, ParkingSpace, Vehicle, VehicleType, Brand, Model, Insurance, ServiceCatalog y EmployeeShift; `ParkingSpace.state` (`LIBRE`/`OCUPADO`/`MANTENIMIENTO`), además de su `isActive`; `Reservation.status` e `Invoice.status`. `EmployeeShift` usa `isActive` y `validTo` a la vez, y `retire` siempre los cambia juntos.
- **Problema:** un mismo concepto tiene tres nombres. En la defensa, "¿por qué el usuario tiene `status` y el vehículo `isActive`?" no tiene respuesta. En `EmployeeShift`, los dos campos pueden contradecirse (por ejemplo, `isActive = true` con `validTo` cargado).
- **Convención (base):** la mayoría ya sigue esta regla: `isActive` para la baja lógica y `status` para el ciclo de vida (reserva y factura). Las excepciones son `User.status`, que en realidad es una baja lógica, y `ParkingSpace.state`, que es un ciclo de vida y debería llamarse `status`. No se renombra: se documenta la regla y sus excepciones.

### N-2. La factura no tiene enum de estado

- **Qué es:** `ReservationStatus`, `UserStatus` y `UserType` están en `status.ts`. Los estados de la factura (`'PENDIENTE'`, `'PAGADA'`, `'ANULADA'`) van como texto suelto, y `'ACTIVO'`/`'BAJA'` aparecen escritos a mano aunque existe `UserStatus`. Hay 38 textos de estado sueltos fuera de `constants/`.
- **Problema:** un error de tipeo (`'PAGADO'`) compila igual.
- **Solución (solo código):** agregar `InvoiceStatus` en `status.ts` y reemplazar los textos sueltos por los enums. No cambia la API ni la base.

### N-3. La vigencia tiene dos pares de nombres

- **Qué es:** `ParkingPrice` y `ServicePrice` usan `startDate`/`expirationDate`. `EmployeeShift` y `ShiftClosure` usan `validFrom`/`validTo` para lo mismo: desde y hasta cuándo rige una versión.
- **Convención (base):** el par de referencia es `validFrom`/`validTo`. Las columnas de precios no se renombran.

### N-4. Los momentos se nombran con `*At` y con `*Date`

- **Qué es:** `createdAt`, `readAt`, `checkedOutAt` y `reminderSentAt` frente a `paymentDate`.
- **Convención (base):** el nombre de referencia es `*At`; `paymentDate` queda como excepción.

### N-5. "Desde y hasta" se escribe de tres formas

- **Qué es:** `startTime`/`endTime` en reservas y turnos, `openingTime`/`closingTime` en la cochera y `from`/`to` en la agenda (`DaySchedule`). Además, `startTime` es un `datetime` en la reserva y un texto `'HH:mm'` en el turno.
- **Solución:** ninguna. Los nombres son razonables en su contexto; conviene saber explicarlo.

### N-6. `User.last_name` y `User.date_of_birth` en snake_case

- **Qué es:** son los únicos campos en snake_case. Todos los demás están en camelCase (`mustChangePassword`, `businessName`).
- **Solución (API y base):** van en el JSON y en la base, así que tocan registro, perfil, mostrador, el Frontend y las e2e. Después de la defensa, si se hace.

### N-7. `type` y `role` para el rol del usuario

- **Qué es:** la columna es `User.type` y el enum `UserType`, pero el filtro del listado es `?role=` y el conteo vuelve en `counts.role` (`User.Repository.ts:21-34`, `User.Schema.ts:59`).
- **Solución (API):** usar el mismo nombre en el filtro y en la columna. Es el cambio de API más chico de esta lista.

### N-8. El cliente y la cochera aparecen con distintos parámetros en las rutas

- **Qué es:** `/client/:clientId` en reservas y facturas, `/client/:id` (GET) y `/client/:userId` (POST) en vehículos; `/parking/:parkingId` en reservas y `/:id/prices` en precios.
- **Solución (solo código):** con `/:clientId` en las dos rutas de vehículos alcanza. El nombre del parámetro no cambia la URL, así que el Frontend no se entera. Hay que acomodar `self(...)` y el controlador.

### N-9. Los métodos de búsqueda se llaman distinto

- **Qué es:** `findByParking` en precios, plazas y servicios, y `findByParkingId` en reservas. También `findByOwnerId` frente a `findByOwner`, y `getUserById` frente a `findActiveUser`.
- **Solución (solo código):** `findByParking` en todos.

### N-10. Cada variable del router se escribe distinto

- **Qué es:** `ParkingPriceRouter` y `VehicleRouter` empiezan con mayúscula, y en `index.ts` se importan como `parkingRoutes`, `parkingspaceRoutes` y `parkingpriceRoutes`. El resto es `xRouter`.
- **Solución (solo código):** `xRouter` en todos.

### Menores, sin cambio

- **Prefijo de ruta distinto del módulo:** las facturas viven en `/api/billing` y el módulo es `Invoice`; los turnos viven en `/api/shifts` y el módulo es `EmployeeShift`. Lo usa el Frontend y no confunde.
- **Claves normalizadas:** la columna `DnrpaTypeMap.descriptionKey` se arma con `descKey`, y `ExcludedModel.modelKey` con `nameKey`.
- **Idioma:** los nombres van en inglés y los valores de los enums en español (`PENDIENTE`, `LIBRE`, `DUEÑO` con ñ, `'EN CURSO'` con espacio). Es coherente: el código en inglés y los datos que se ven en pantalla en español. `'EN CURSO'` con espacio ya está documentado en CLAUDE.md.

### Resumen por costo

- **Solo código, se puede hacer sin riesgo:** N-2, N-8, N-9 y N-10. Son unas 50 líneas, con `pnpm build` como control.
- **API, con cambios en el Frontend:** N-7 y N-6. Después de la defensa.
- **Base, solo documentar la convención:** N-1, N-3 y N-4, con sus excepciones.

## Constantes: revisión posterior

Pregunta: ¿están todas las constantes del backend en `src/Shared/constants/`, y deberían estar ahí? Barrido con `grep` de toda constante en mayúsculas, todo enum, todo `z.enum([...])` y los números sueltos de los esquemas y los timers. Anotado y sin arreglar.

**Respuesta corta:** no están todas, y no todas deberían estar. CLAUDE.md pide "constantes de negocio en `src/Shared/constants/`; no se repiten números en el código". El criterio que sale de esa regla:

- **Van a `Shared/constants/`:** un valor de una regla de negocio (alguien puede preguntar "¿por qué 6?") o un valor que usan dos módulos o más.
- **Se quedan donde están:** formatos (regex), mensajes de error, datos de la siembra o de la demo, y límites de texto de una sola columna (`.max(100)` en el esquema que la valida, como pide la guía "Datos que entran").
- **Conversiones de unidades** (`HOUR_MS`, `DAY_MS`): no son reglas de negocio. Van una sola vez en `Shared/utils/dateUtils.ts`, al lado de `isoDate`.

Lo que ya está bien: los 8 archivos de `constants/` (`auth`, `dnrpa`, `holidays`, `notifications`, `pagination`, `schedule`, `stats`, `status`) tienen solo reglas de negocio, cada una con su comentario y su código de regla (R-xx, L-xx).

### C-1. Reglas de negocio fuera de `constants/`

| Valor | Dónde está | Por qué es de negocio |
|---|---|---|
| `MIN_VEHICLE_YEAR = 1960` | `Vehicle.Schema.ts:5` | Es L-28, con su `shortcut:`. |
| `MAX_CATALOG_IMPORT_ITEMS = 5000` | `Catalog.Schema.ts:3` | Va atado al límite de body `'2mb'` de `index.ts:42`: si sube uno, tiene que subir el otro, y están en archivos distintos sin referencia entre sí. |
| Contraseña de 6 caracteres como mínimo | `User.Schema.ts:51` y `:138` | Escrita dos veces (registro y cambio de contraseña): pueden quedar distintas. |
| Hasta 500 plazas por tipo | `Parking.Schema.ts:24` | Límite de capacidad de una sucursal. |
| Motivo de cancelación de hasta 300 caracteres | `Reservation.Schema.ts:47` | Límite de texto de una columna: puede quedar en el esquema. |
| `VAT_CONDITIONS` | `User.Schema.ts:5` | Lista de AFIP. Solo la usa el esquema: puede quedar. |

- **Solución (solo código):** mover las cuatro primeras a `constants/` (`MIN_VEHICLE_YEAR` y `MAX_CATALOG_IMPORT_ITEMS` a un `vehicles.ts`; `MIN_PASSWORD_LENGTH` a `auth.ts`; `MAX_SPACES_PER_TYPE` a un `parkings.ts`). El límite del body se escribe al lado de `MAX_CATALOG_IMPORT_ITEMS` (`CATALOG_BODY_LIMIT = '2mb'`) y `index.ts` lo importa. Unas 15 líneas, con `pnpm build` como control.

### C-2. Las conversiones de tiempo están escritas siete veces

- **Qué es:** `MS_PER_HOUR` en `billing.ts:3` y en `Reservation.Service.ts:22` (y además `1000 * 60 * 60` a mano en la línea 72 del mismo archivo); `DAY_MS` en `Notification.Repository.ts:18` y en `Stats.Service.ts:6`; `86_400_000` a mano en `Notification.Service.ts:50`; `MINUTE_MS` en `ParkingSpace.Repository.ts:22`; `* 60 * 1000` y `* 3600 * 1000` en los cuatro `setInterval` de `index.ts`; `REMINDER_HOURS_BEFORE * 60 * 60 * 1000` en `Reservation.Service.ts:348`.
- **Problema:** no hay un error hoy, pero es el "no se repiten números en el código" que pide CLAUDE.md, y un `60 * 1000` donde iba `3600 * 1000` compila igual.
- **Solución (solo código):** exportar `MINUTE_MS`, `HOUR_MS` y `DAY_MS` desde `Shared/utils/dateUtils.ts` y reemplazar los siete lugares. La demo (`load.ts:44`) puede usar las mismas.

### C-3. Los enums se repiten como listas de texto en los esquemas

- **Qué es:** los días de la semana están cuatro veces: el enum `DayOfWeek` (`EmployeeShift.Entity.ts:9`), `DaysEnum` (`EmployeeShift.Schema.ts:4`) y dos `z.enum([...])` en `Schedule.Schema.ts:23` y `:42`. `SpaceState` (`ParkingSpace.Entity.ts:7`) se repite en `ParkingSpace.Schema.ts:23`. `UserStatus` y `UserType` (`status.ts`) se repiten en `User.Schema.ts:21-22`. Los medios de pago solo existen como `PaymentMethodSchema` (`Invoice.Schema.ts:3`); la entidad los guarda como `string` y `Reservation.Repository.ts:164` e `Invoice.Service.ts:17` escriben `'EFECTIVO'` a mano.
- **Problema:** si se agrega un valor al enum, el esquema lo rechaza con 400 hasta que alguien se acuerde de la otra lista. Es el mismo caso que N-2.
- **Solución (solo código):** los esquemas usan `z.nativeEnum(DayOfWeek)`, `z.nativeEnum(SpaceState)`, `z.nativeEnum(UserStatus)` y `z.nativeEnum(UserType)`. Se suma `PaymentMethod` (y `InvoiceStatus`, de N-2) a `status.ts`. `DayOfWeek` y `SpaceState` pueden quedarse junto a su entidad: son de un solo módulo; lo que no puede pasar es que haya dos listas. Hacerlo junto con N-2.

### Menores, sin cambio

- **Mensajes:** `WALK_IN_ONLY` (`Reservation.Repository.ts:28`), `PAUSE_REASON` y `WALK_IN_ONLY_REASON` (`Parking.Service.ts:25-26`) y `MUST_CHANGE_PASSWORD` (`User.Entity.ts:5`) son textos, no reglas. Quedan junto a quien los lanza.
- **Formatos:** `PLATE_REGEX` queda en `Vehicle.Schema.ts`, porque CLAUDE.md lo ata a su copia del Frontend (`utils/plate.ts`). `DATE_REGEX` (`Schedule.Schema.ts:4`) podría ir a `Shared/utils/validation.ts` junto a `TIME_REGEX`, si otro esquema lo necesita.
- **Locales de un módulo:** `MIN_NAME` (`Catalog.Service.ts:10`), `DROPS` (`dropLegacy.ts`), `TABLES` (`demo/reset.ts`), los feriados de la siembra, `ADMIN_EMAIL`, `INSURANCES`, `MOTOS` y todo `demo/generate.ts` son datos de un solo archivo. Se quedan.
- **`JWT_SECRET`** (`auth.ts:25`) sale del entorno: no es una constante.
- **`DOW`** de `Schedule.Service.ts:19` se repite en `demo/load.ts:46` y en `demo/generate.ts:45` (como `DAYS`). Con `Object.values(DayOfWeek)` alcanza, si el enum se ordena desde el domingo; si no, queda.
- El comentario de `PLANNING_HORIZON_MONTHS` dice que se expone en `GET /api/shifts/config`. Si se borra esa ruta (ver "Rutas que el Frontend no llama"), hay que corregir el comentario.

### Resumen por costo

- **Solo código, sin riesgo:** C-1, C-2 y C-3. Unas 40 líneas, con `pnpm build` como control. C-3 conviene hacerlo con N-2.
- **Nada de API ni de base.**

## Devolución de la defensa de regularidad (13/11/2026)

La regularidad se aprobó. El profesor marcó estos puntos para la final:

| Punto | Qué se hizo | Commit |
|---|---|---|
| "Revisar auth", "no debería buscar el id", "¿dónde guardo la info del rol?" | El rol viaja en el JWT y `auth` no consulta la base (D-1, L-46) | `6321bfa` |
| Strings `'EMPLEADO'` en el backend (`Vehicle.Service`) | Se usa el enum `UserType` en entidad, esquemas, repositorios y servicios. Se quitaron el chequeo `EMPLEADO` inalcanzable de `Vehicle.Service.create` y `findVehiclesByUserId`, que no se usaba. Resuelve C-3 y N-7 para el rol | `6321bfa` |
| Lógica del controller en el servicio | `getCoverage` (turnos), el 400/404 de `updatePassword` y el estado del listado de empleados pasaron al servicio. Los demás controllers solo traducen HTTP | `6321bfa` |
| Rendimiento | `GET /api/reservations/owner/:id?from=&to=`: el panel del dueño ya no trae toda la historia | `797976a` |
| Cartel antes de acciones importantes | Confirmación al quitar tarifa o servicio de sucursal, al registrar la salida y al cobrar (Frontend). El pago cobrado se corrige con `PUT /api/billing/:id/payment` (L-47) | `1d9ce72` |

### D-1. Cómo era la autenticación y cómo quedó

**Antes.** El token solo llevaba el id del usuario (`sub`), firmado con `JWT_SECRET` y con vencimiento a las 8 h (`TOKEN_TTL`). En cada pedido protegido, `auth`:

1. verificaba la firma y el vencimiento (si fallaba, 401);
2. con el id del token buscaba el usuario en la base, y solo si estaba activo: `findOne(User, { id, status: 'ACTIVO' })` (si no lo encontraba, 401);
3. leía el rol de ese registro (`user.type`) y lo comparaba con los de la ruta (si no estaba, 403);
4. dejaba el usuario completo de la base en `req.user`.

La ventaja era que una baja o un cambio de rol regían en el pedido siguiente, aunque el token siguiera vigente. El costo era una consulta a la base en cada pedido protegido, antes del controller. A eso apuntaba la devolución.

**Ahora.** El login firma `{ sub, role }` (`signToken(user)`). `auth` verifica la firma, exige `sub` y un rol de `UserType` (si no, 401) y compara el rol con los de la ruta (403), sin consultar la base. `req.user` es `{ id, type }` (`AuthUser`).

| | Antes | Ahora |
|---|---|---|
| Qué lleva el token | `sub` | `sub` y `role` |
| Consulta a la base en `auth` | Sí, en cada pedido | No |
| De dónde sale el rol | De la base | Del token firmado |
| `req.user` | El usuario completo | `{ id, type }` |
| Baja o cambio de rol | Rige al instante | Rige al vencer el token (hasta 8 h) |

**Qué atenúa la demora de la baja (L-46):**

- El login rechaza al usuario dado de baja, así que no obtiene un token nuevo.
- La pertenencia del personal (`ownParking` con staff, `ownReservation`, `staffOfInvoice`) lee al empleado activo de la base, porque su sucursal puede cambiar y no viaja en el token. Un empleado dado de baja deja de operar su sucursal enseguida.
- `User.Service` no edita ni cambia la contraseña de un usuario en `BAJA` (404); solo el administrador lo reactiva.

La pertenencia ya consultaba la base antes, porque busca la cochera, la reserva o la factura, y lo sigue haciendo.

**Si hiciera falta cortar al instante:** una lista de tokens revocados, o un `tokenVersion` en el usuario que se incrementa con la baja. También el punto medio: el rol del token, más una consulta mínima solo del estado.

Lo prueban `tests/auth/auth.db.test.ts` y las e2e `users.failure.api` y `audit.api` del Frontend.

## Qué no se verificó

- No se corrieron las pruebas locales de `tests/` ni las e2e.
- Sin revisión por módulo: `Vehicle/VehicleType/` (se le pasó a otro agente; no hay informe), los detalles internos de `Vehicle/Catalog/` (`typeMap`, modelos excluidos), las consultas de `Stats/`, `Shared/db/` (siembra, demo, `dropLegacy`) y `Notification/` más allá de los dos hallazgos menores.
- La carga de la demo (`pnpm demo:load --yes`) está pendiente después de regenerar los JSON con el ancla en el 13/11/2026.
