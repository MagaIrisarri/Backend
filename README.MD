# Estacionamiento COM 301 — Backend

API REST del sistema de reservas de cocheras. Express 5 + TypeScript + MikroORM 7 sobre MySQL, con validación en zod.
El frontend está en [MagaIrisarri/Frontend](https://github.com/MagaIrisarri/Frontend).

📄 Documentación del proyecto: [docs/README.md](docs/README.md)

## Requisitos

- Node.js 22 o superior
- pnpm 10 (`npm install -g pnpm`)
- MySQL 8 corriendo en local o accesible por red

## Instalación

```bash
git clone https://github.com/MagaIrisarri/Backend.git
cd Backend
pnpm install
```

Crear la base de datos vacía (las tablas se crean solas al arrancar):

```sql
CREATE DATABASE parkingdb;
```

## Configuración

El servidor toma la configuración de variables de entorno. Todas tienen un valor por defecto, así que con un MySQL local con usuario `root` y contraseña `pass` no hace falta configurar nada.

| Variable | Por defecto | Para qué |
|---|---|---|
| `DB_HOST` | `localhost` | Host de MySQL |
| `DB_PORT` | `3306` | Puerto de MySQL |
| `DB_USER` | `root` | Usuario de MySQL |
| `DB_PASSWORD` | `pass` | Contraseña de MySQL |
| `DB_NAME` | `parkingdb` | Nombre de la base |
| `PORT` | `3000` | Puerto de la API |
| `NODE_ENV` | — | Fuera de `production` se muestran las consultas SQL en consola; con `development` los errores 500 devuelven el detalle |

Ejemplo en bash:

```bash
DB_PASSWORD=miclave pnpm start:dev
```

Ejemplo en PowerShell:

```powershell
$env:DB_PASSWORD="miclave"; pnpm start:dev
```

## Ejecución

```bash
pnpm start:dev
```

Compila con TypeScript, levanta la API en `http://localhost:3000` y se reinicia ante cada cambio. Al arrancar:

1. Sincroniza el esquema de la base (crea tablas y columnas que falten; nunca borra).
2. Carga los datos de prueba si no están (es seguro reiniciar: no duplica nada).
3. Inicia los procesos automáticos (cancelación de reservas vencidas y avisos de recordatorio en la app).

Otros scripts:

| Script | Qué hace |
|---|---|
| `pnpm build` | Compila a `dist/` (sirve también como chequeo de tipos) |

> El frontend tiene que correr en `http://localhost:5173`, que es el origen habilitado por CORS.

## Usuarios de prueba

Todos con contraseña `password123`:

| Rol | Email |
|---|---|
| Administrador | `admin@cocheras.com` |
| Dueño | `dueno1@cocheras.com` … `dueno5@cocheras.com` |
| Empleado | `empleado1@cocheras.com` … `empleado8@cocheras.com` (el 8 está dado de baja) |
| Cliente | `cliente1@cocheras.com` … `cliente10@cocheras.com` (el 10 está dado de baja) |

## Estructura

Un módulo por entidad en `src/`, separado en capas:

```
src/<Modulo>/
  X.Entity.ts       entidad de MikroORM
  X.Schema.ts       validación de entrada (zod)
  X.Repository.ts   acceso a datos
  X.Service.ts      reglas de negocio
  X.Controller.ts   request/response
  X.Route.ts        rutas de Express
src/Shared/         base de datos, middlewares (validación, errores), utilidades y constantes
```

Los errores se informan siempre con el mismo formato `{ status: 'error', message, details? }` y el código HTTP correspondiente (400 validación, 403 permisos, 404, 409 conflicto).

## Arquitectura y reglas de negocio
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

- El proceso fija la zona horaria en `America/Argentina/Buenos_Aires` (`process.env.TZ`, en `src/Shared/db/orm.ts`) para los cálculos de reservas, precios y turnos. MikroORM guarda y lee los `DATETIME` en UTC. Las columnas `date` del sistema usan `LocalDateType` para guardar el día local; si no, una fecha asignada después de las 21 h quedaría con el día siguiente.

### 7. Autenticación (JWT)

- `POST /api/users/login` devuelve un token firmado con la variable de entorno `JWT_SECRET`, vigente 8 horas. **`JWT_SECRET` es obligatoria con `NODE_ENV=production`**: sin ella el servidor no arranca. Fuera de producción tiene un valor por defecto.
- El frontend manda el token en `Authorization: Bearer`. Cada ruta protegida exige la sesión y el rol (`auth`), que el id propio en la ruta o el body sea el del token (`self`) y que el recurso sea del usuario (`ownParking`, `ownVehicle`, `ownReservation`, `staffOfInvoice`). Todo está en `src/Shared/middlewares/auth.ts`.
- Son públicos el registro, el login y lo que muestra el mapa sin sesión (cocheras activas, plazas, disponibilidad, tarifas, servicios y catálogos de vehículos).
