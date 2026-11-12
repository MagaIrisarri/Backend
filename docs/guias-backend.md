# Guías del Backend

Reglas para escribir y revisar código del Backend. Cada una sale de un caso real de [auditoria-backend.md](auditoria-backend.md), y la columna "Casos" dice de cuál: ahí está el ejemplo concreto. Valen para código nuevo y para cada arreglo. El código viejo que todavía no las cumple está anotado en la auditoría.

**Cómo se mantiene:** cada hallazgo nuevo de la auditoría se cruza con estas guías. Si el caso ya está cubierto, se suma su código a la columna "Casos" de esa guía. Si no lo está, se agrega una guía nueva, con su "Casos". Una guía que deja de aplicar se borra, no se deja desactualizada.

## Concurrencia y transacciones

### G-1. Leer y después escribir: bloquear o condicionar la escritura

Si una escritura depende de algo que se leyó antes (que no exista, que haya una sola vigente, que el estado sea tal), dos pedidos a la vez (un doble clic, dos pestañas, dos empleados) pasan los dos el control. Usar una de dos formas:

- `em.transactional` que bloquee la cochera con `lockParking` (`ParkingSpace.Repository.ts`) antes de leer, y vuelva a leer adentro;
- o un `nativeUpdate` condicionado al estado esperado (`{ id, status: 'PENDIENTE' }`), con 409 si no actualizó ninguna fila.

Toda validación que decide la escritura (cobertura de turnos, plaza libre, tarifa vigente) va adentro de la misma transacción, después del bloqueo.

**Casos:** 1 (cancelar en curso), 3 (bloqueos), S-1, PP-1, INV-1, ES-1, PS-1, V-1, H-1.

### G-2. Una operación, una transacción

Si una operación guarda varias entidades (cochera y sus plazas; vencer un precio y crear el nuevo), van en un solo `em.transactional` o en un solo `flush`. Dos `flush` seguidos pueden dejar la primera mitad guardada si la segunda falla.

**Casos:** P-2, PP-1, S-1.

### G-3. Unicidad entre registros activos

Con bajas lógicas, un índice único común no sirve: el registro dado de baja sigue ocupando el valor, y MySQL admite varios `NULL` en un índice único. Para "único entre los activos", o "único con `owner` nulo":

- una columna generada (`IF(is_active, plate, NULL)` o `IFNULL(owner_id, '')`) con índice único;
- o G-1 (transacción con bloqueo y una nueva lectura).

Los nombres se comparan con `nameKey` (`Shared/utils/names.ts`): sin mayúsculas, tildes ni espacios de más.

**Casos:** S-2, PS-1, V-1, H-1.

## Datos que entran

### G-4. Todo texto y todo número del body tiene límites

- **Textos:** `.trim()` y `.max(n)`. Las contraseñas también se recortan, en todos los caminos: alta, login, cambio y restablecimiento.
- **Montos:** `.positive().max(99_999_999).multipleOf(0.01)`, para que entren en `numeric(12,2)`. Un desborde responde 500 en lugar de 400.
- **Fechas y rangos:** fin posterior al inicio (`refine`).

**Casos:** S-3, PP-2, U-5, PS (disponibilidad sin `endTime > startTime`).

### G-5. Dinero

- Columna `decimal` con `precision: 12, scale: 2`.
- Al leerla, `Number(...)`, porque MikroORM la devuelve como texto.
- En los mensajes, `toFixed(2)` o el formato de moneda. Nunca la resta directa de dos `number`.

**Casos:** 2 (columnas de dinero), PP-2, INV-2.

### G-6. Versiones ordenadas por algo que no empate

Una columna `date` no ordena dos versiones del mismo día. Si se elige "la más reciente", el orden tiene que salir de un `datetime` o de la garantía de que hay una sola vigente (G-1).

**Casos:** PP-1.

## Permisos y datos que salen

### G-7. Una ruta pública devuelve solo lo que el mapa necesita

Las rutas sin sesión (cocheras activas y su detalle) no incluyen datos de personas: email, teléfono, DNI. Si una pantalla con sesión los necesita, salen de una ruta con `auth`. La contraseña ya la oculta `hidden: true` en la entidad; no hace falta quitarla a mano.

**Casos:** P-1, U-8.

### G-8. Una baja revisa sus dependencias en las dos direcciones

Antes de dar de baja algo, revisar qué queda colgado:

- lo que depende de él (los empleados de un dueño);
- y si la acción deja al sistema sin salida (el último administrador dándose de baja).

Se rechaza con 409 (conflicto con datos) o 400 (pedido inválido sobre uno mismo), con el mismo criterio que `resetPassword`.

**Casos:** U-6, U-7, P-3.

### G-9. Mismo caso, mismo código de respuesta

- 400: el pedido es inválido por sí mismo.
- 404: el recurso no existe.
- 409: el pedido choca con datos que ya existen (reservas activas, valor repetido, estado que cambió).

Una acción idempotente (reactivar algo activo) responde igual en todas las entidades.

**Casos:** U-4, menor de Vehículos (400 frente a 409).

## Una sola fuente

### G-10. Antes de escribir una regla, buscar la que ya existe

Las reglas de una sola fuente están en CLAUDE.md ("Reglas de una sola fuente"): `isStaffOf`, `findFreeSpaces`, `categorizeVehicleType`, `spacePrefix`, `resolveDay`, `saveTemplateDay`, `lockParking`. A esas se suman:

- `isoDate` y `formatTimeHHMM` (`Shared/utils/dateUtils.ts`);
- los enums de `status.ts`.

Si la regla existe, se importa; no se copia. Una consulta que se repite en dos métodos del mismo servicio pasa al repositorio.

Lo mismo para un dato derivado guardado como copia (`ParkingSpace.state = OCUPADO` repite "hay una reserva en curso"): lo escribe un solo camino, y ninguna ruta lo acepta a mano. Las lecturas que deciden algo miran la fuente (las reservas), no la copia.

**Casos:** R-a, L-5, L-6, L-7, PS-3.

### G-11. Los métodos que exige `Repository<T>` y nadie llama no esquivan las reglas

`Repository<T>` es evidencia de la cátedra, así que sus métodos se quedan aunque nadie los llame. Pero un `remove` o un `add` que nadie usa no puede ser un atajo que se saltea el camino real: delega en él (`pause`, `saveTemplateDay`) o lleva un comentario de una línea que diga cuál es el camino de verdad.

**Casos:** 7, P-5, métodos de `EmployeeShiftRepository`.

## Código que sobra

### G-12. Ruta o método nuevo, con quien lo llame

Una ruta o un método nuevo entra con su llamada desde el Frontend, desde otro servicio o desde una prueba, o como evidencia de un requisito anotada en `revision-alcance.md`. Antes de borrar algo, revisar que no sea esa evidencia.

**Casos:** ES-2, L-1, L-2, tabla de rutas sin uso.

### G-13. Sin `any` en las firmas de servicios y repositorios

Los datos de entrada usan el tipo que sale de zod (`z.infer<typeof schema>['body']`); las respuestas, el tipo de la entidad o uno derivado (`ReturnType<...>`). Con `any`, renombrar un campo compila igual y rompe en ejecución.

**Casos:** P-6, L-4.

### G-14. Un solo nombre para un dato

Si un dato tiene dos nombres (`imageUrl` e `image`), queda uno. "Compatibilidad con el Frontend" no justifica el segundo si el Frontend no lo manda.

**Casos:** P-4.

## Nombres

### G-15. Convenciones de nombres

- **Baja lógica:** `isActive`. **Ciclo de vida:** `status`, con un enum en `status.ts`; nunca el texto suelto.
- **Vigencia de una versión:** `validFrom` / `validTo`. **Momento de un hecho:** `*At` (`createdAt`, `readAt`).
- **Campos en camelCase.**
- **Routers:** `xRouter`. **Búsquedas por cochera:** `findByParking`.
- **Parámetros de ruta:** el nombre del dato (`:clientId`, `:parkingId`), no `:id` ni `:userId` para la misma cosa.

Las excepciones que ya existen están en la auditoría ("Nombres"). No se suman nuevas.

**Casos:** N-1 a N-10.

## Comentarios y pruebas

### G-16. Un comentario que se vuelve falso se corrige en el mismo cambio

Al cambiar lo que hace un código, se relee su comentario. Un comentario falso es peor que ninguno: en la defensa, o para el próximo que lo lea, vale como documentación.

**Casos:** U-2, P-7, comentario de `Invoice.Route.ts`.

### G-17. Cada arreglo de concurrencia o de dinero deja una prueba que falla sin él

- **Carrera:** dos pedidos simultáneos con `Promise.all` y el resultado esperado (una sola vigente, un 409).
- **Dinero:** el monto exacto.

Va en `tests/`, salvo que reemplace una prueba de `tests-catedra/`.

**Casos:** 1, 4 (prueba de la ventana del historial), S-1, PP-1.
