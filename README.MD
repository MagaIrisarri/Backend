Cada petición HTTP pasa por el middleware de `RequestContext` de MikroORM (`RequestContext.create(orm.em, next)`), asegurando que cada request opere sobre una sesión aislada del `EntityManager` y previniendo fugas de contexto o colisiones entre transacciones concurrentes.

---

## Módulos y Lógica de Negocio Compleja

### 1. Manejo Centralizado de Errores (`catchAsync` y `AppError`)

Para evitar bloques repetitivos `try/catch` en controladores:

- **`catchAsync`**: Envuelve funciones asíncronas de Express capturando cualquier rechazo de promesa y derivándolo directamente al flujo de Express mediante `next(err)`.
- **`AppError`**: Clase personalizada que hereda de `Error`, permitiendo emitir errores operacionales con código HTTP y mensaje específico (`throw new AppError('Plaza no encontrada', 404)`).
- **`errorHandler`**: Middleware global registrado al final de todas las rutas en `src/index.ts`. Centraliza la respuesta:
  - Convierte instancias de `AppError` al código de estado correspondiente.
  - Captura excepciones de unicidad de base de datos (`UniqueConstraintViolationException` o `ER_DUP_ENTRY` de MySQL) respondiendo con HTTP `409 Conflict`.
  - Formatea errores 500 no controlados ocultando el stacktrace en producción.

### 2. Roles de Usuario y Registro Protegido

El sistema soporta 4 roles: `CLIENTE`, `DUEÑO`, `EMPLEADO` y `ADMIN`:

- **Separación de Schemas**: El registro público (`POST /api/users`) utiliza `createPublicUserSchema`, restringido únicamente a `CLIENTE` o `DUEÑO`. Los roles `ADMIN` y `EMPLEADO` no son seleccionables desde este endpoint.
- **Alta de Empleados**: Se realiza a través de `POST /api/users/:ownerId/employee`. El servicio valida que quien da de alta sea un `DUEÑO` activo y asigna automáticamente la relación de pertenencia (`ownerId`).
- **Usuario Administrador**: Se precarga automáticamente durante el arranque mediante el `seeder`, utilizando credenciales configurables por variables de entorno y contraseña hasheada con **Argon2**.

### 3. Asignación y Disponibilidad de Plazas (`ParkingSpace`)

- **Generación en lote**: Al registrar un estacionamiento, el dueño define capacidades (`cant_total_auto`, `cant_total_moto`), lo que permite generar masivamente las plazas iniciales.
- **Búsqueda por solapamiento temporal (`checkAvailability`)**: Determina plazas libres cruzando el rango horario solicitado (`startTime` a `endTime`) contra las reservas activas en ese intervalo, filtrando por tipo de vehículo y asegurando que no haya sobreventa de lugares.

### 4. Versionado e Historial de Precios (`ParkingPrice` y `ServicePrice`)

- **Catálogo Global vs Precios Locales**: `ServiceCatalog` mantiene la lista estándar de servicios del sistema (administrada por `ADMIN`). Cada `DUEÑO` asocia servicios a su estacionamiento asignando un precio propio a través de `ServicePrice`.
- **Inmutabilidad y Trazabilidad**: Al actualizar el valor de una tarifa por hora o de un servicio, el registro vigente no se sobreescribe. Se le fija una `expirationDate` a la tarifa anterior y se inserta un nuevo registro con `startDate`. Esto preserva la consistencia histórica de facturaciones pasadas.

### 5. Cobertura de Turnos de Empleados (`EmployeeShift`)

- Permite asignar turnos semanales a los empleados por día de la semana y rango de horas.
- **Cálculo de brechas (`getCoverage`)**: Analiza la grilla horaria asignada contra el horario operativo del estacionamiento e identifica huecos de cobertura desatendidos.

### 6. Consistencia de Fechas y Zona Horaria

- Todo el entorno de ejecución fija la zona horaria en `America/Argentina/Buenos_Aires` (`process.env.TZ`), garantizando paridad entre el cálculo de reservas, vigencia de precios, turnos y columnas `DATETIME` de MySQL sin desfasajes de UTC.
