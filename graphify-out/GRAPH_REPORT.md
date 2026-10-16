# Graph Report - Backend  (2026-10-14)

## Corpus Check
- 156 files · ~77,464 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 1 file(s) not represented in the graph (top: (none) 1)

## Summary
- 1169 nodes · 3403 edges · 49 communities (43 shown, 6 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 229 edges (avg confidence: 0.85)
- Token cost: 95,959 input · 0 output

## Community Hubs (Navigation)
- Reservas: entidad y repositorio
- Cocheras: servicio y repositorio
- Turnos de empleados
- Reglas de la semana tipo
- Catálogo de servicios
- Controllers y AppError
- Dependencias (package.json)
- Arquitectura documentada
- Días especiales y feriados
- Usuarios y autenticación
- Siembra y demo
- Paginación y usuarios
- Vehículos
- Notificaciones
- Tarifas de cochera
- Rutas de facturas y personal
- Localidades y plazas libres
- Arranque del servidor
- Tipos de vehículo (ABM)
- Facturas
- Siembra del catálogo y nombres
- Estadísticas del administrador
- Aseguradoras
- Esquemas zod y notificaciones
- Rutas de reservas
- Marcas
- Modelos
- Configuración de TypeScript
- Repositorios MikroORM
- Descripciones DNRPA → tipo
- Entidades y fechas locales
- Rutas de cocheras
- Rutas de plazas
- Rutas de vehículos
- Rutas de tarifas
- Fechas y reservas sembradas
- Rutas de precios de servicios
- Importación del catálogo DNRPA
- Rutas de tipos de vehículo
- Constantes de horarios
- Rutas de feriados
- Rutas del catálogo de servicios
- Rutas de aseguradoras
- Tipos de notificación
- Builds de pnpm y roles
- Listados paginados (doc)
- Patentes argentinas

## God Nodes (most connected - your core abstractions)
1. `AppError` - 109 edges
2. `Parking` - 64 edges
3. `Reservation` - 63 edges
4. `User` - 62 edges
5. `@mikro-orm/core` - 45 edges
6. `express` - 44 edges
7. `ReservationRepository` - 38 edges
8. `ScheduleService` - 36 edges
9. `ParkingSpace` - 36 edges
10. `VehicleType` - 34 edges

## Surprising Connections (you probably didn't know these)
- `JWT authentication (README)` --semantically_similar_to--> `JWT authentication (auth/self middlewares)`  [INFERRED] [semantically similar]
  README.MD → CLAUDE.md
- `Environment configuration (DB_*, PORT, NODE_ENV)` --conceptually_related_to--> `JWT authentication (auth/self middlewares)`  [INFERRED]
  README.MD → CLAUDE.md
- `RequestContext per request (README)` --semantically_similar_to--> `Per-request RequestContext wiring`  [INFERRED] [semantically similar]
  README.MD → CLAUDE.md
- `Parking space assignment and availability (R-30, checkAvailability)` --semantically_similar_to--> `findFreeSpaces`  [INFERRED] [semantically similar]
  README.MD → CLAUDE.md
- `Price versioning and history` --semantically_similar_to--> `Versioned prices (ParkingPrice, ServicePrice)`  [INFERRED] [semantically similar]
  README.MD → CLAUDE.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Protected route pipeline (auth, validateSchema, self, ownership, actorId)** — claude_jwt_auth, claude_validateschema, claude_ownership_middlewares, claude_actorid [EXTRACTED 1.00]
- **Single-source business rules** — claude_isstaffof, claude_findfreespaces, claude_categorizevehicletype, claude_resolveday [EXTRACTED 1.00]
- **Vehicle type categorization and name normalization** — claude_dnrpa_catalog_import, claude_vehicle_types, claude_namekey, claude_categorizevehicletype [INFERRED 0.85]

## Communities (49 total, 6 thin omitted)

### Community 0 - "Reservas: entidad y repositorio"
Cohesion: 0.08
Nodes (7): ReservationController, Reservation, reservationCode(), lockParking(), ReservationRepository, ReservationService, formatTimeHHMM()

### Community 1 - "Cocheras: servicio y repositorio"
Cohesion: 0.06
Nodes (16): ParkingController, ParkingRepository, CreateParkingInput, activeSpaces(), ParkingService, typeOrder(), ParkingSpaceController, ParkingSpace (+8 more)

### Community 2 - "Turnos de empleados"
Cohesion: 0.05
Nodes (37): EmployeeShiftController, DayOfWeek, FRIDAY, MONDAY, SATURDAY, SUNDAY, THURSDAY, TUESDAY (+29 more)

### Community 3 - "Reglas de la semana tipo"
Cohesion: 0.09
Nodes (25): byStart(), closureRange(), coveredRanges(), covers(), DayLoss, DaySchedule, diffDay(), employeeRanges() (+17 more)

### Community 4 - "Catálogo de servicios"
Cohesion: 0.07
Nodes (8): ServiceCatalogController, ServiceCatalog, ServiceCatalogRepository, ServiceCatalogService, ServicePriceController, ServicePrice, ServicePriceRepository, ServicePriceService

### Community 5 - "Controllers y AppError"
Cohesion: 0.15
Nodes (11): express, HolidayController, Actor, HolidayService, isAdmin(), visibleTo(), signToken(), errorHandler() (+3 more)

### Community 6 - "Dependencias (package.json)"
Cohesion: 0.05
Nodes (42): author, dependencies, argon2, cors, express, jsonwebtoken, @mikro-orm/core, @mikro-orm/decorators (+34 more)

### Community 7 - "Arquitectura documentada"
Cohesion: 0.05
Nodes (29): actorId(req), AppError, categorizeVehicleType, DNRPA vehicle catalog import, CLAUDE.md (Backend guide), findFreeSpaces, Holidays and HolidayAdhesion (R-10, D-09), isStaffOf (+21 more)

### Community 8 - "Días especiales y feriados"
Cohesion: 0.09
Nodes (10): DayException, DayClosure, DayShift, DaySource, DOW, ShiftClosure, Holiday, HolidayAdhesion (+2 more)

### Community 9 - "Usuarios y autenticación"
Cohesion: 0.13
Nodes (4): Request, User, UserRepository, UserService

### Community 10 - "Siembra y demo"
Cohesion: 0.10
Nodes (30): UserStatus, ACTIVO, BAJA, seedDatabase(), inDays(), seedAgenda(), seedDemo(), seedNotifications() (+22 more)

### Community 11 - "Paginación y usuarios"
Cohesion: 0.09
Nodes (26): DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, PageMeta, pageQuery, UserController, userController, userRepository, userRouter (+18 more)

### Community 12 - "Vehículos"
Cohesion: 0.13
Nodes (4): VehicleController, Vehicle, VehicleRepository, VehicleService

### Community 13 - "Notificaciones"
Cohesion: 0.10
Nodes (6): NotificationController, Notification, NewNotification, NotificationRepository, NOTIFICATIONS_LIMIT, NotificationService

### Community 14 - "Tarifas de cochera"
Cohesion: 0.14
Nodes (4): ParkingPriceController, ParkingPrice, ParkingPriceRepository, ParkingPriceService

### Community 15 - "Rutas de facturas y personal"
Cohesion: 0.12
Nodes (21): invoiceController, invoiceRepository, invoiceService, invoiceIdSchema, payInvoiceSchema, PaymentMethodSchema, TOKEN_TTL, UserType (+13 more)

### Community 16 - "Localidades y plazas libres"
Cohesion: 0.14
Nodes (16): @mikro-orm/mysql, listLocalities(), ParkingPageOptions, SpaceTypeSummary, SpaceState, LIBRE, MANTENIMIENTO, OCUPADO (+8 more)

### Community 17 - "Arranque del servidor"
Cohesion: 0.13
Nodes (19): app, startServer(), invoiceRouter, reservationRouter, reservationService, orm, syncSchema(), migrateVehicleTypeRefs() (+11 more)

### Community 18 - "Tipos de vehículo (ABM)"
Cohesion: 0.16
Nodes (5): VehicleTypeController, VehicleTypeRepository, usedBy(), VehicleTypeService, view()

### Community 19 - "Facturas"
Cohesion: 0.14
Nodes (4): InvoiceController, Invoice, InvoiceRepository, InvoiceService

### Community 20 - "Siembra del catálogo y nombres"
Cohesion: 0.23
Nodes (15): INSURANCES, MOTOS, seedVehicles(), VehiculoMarca, VehiculoModelo, cleanName(), descKey(), nameKey() (+7 more)

### Community 21 - "Estadísticas del administrador"
Cohesion: 0.18
Nodes (7): STATS_PERIOD_DAYS, STATS_TOP_PARKINGS, StatsController, StatsRepository, LocalityScope, statsSummarySchema, StatsService

### Community 22 - "Aseguradoras"
Cohesion: 0.17
Nodes (4): InsuranceController, Insurance, InsuranceRepository, InsuranceService

### Community 23 - "Esquemas zod y notificaciones"
Cohesion: 0.14
Nodes (14): zod, notificationController, notificationRepository, notificationRouter, notificationService, notificationIdSchema, validateSchema(), statsController (+6 more)

### Community 24 - "Rutas de reservas"
Cohesion: 0.15
Nodes (17): invoiceRepository, parkingPriceRepository, parkingSpaceRepository, reservationController, reservationRepository, changeSpaceSchema, CreateReservationInput, createReservationSchema (+9 more)

### Community 25 - "Marcas"
Cohesion: 0.18
Nodes (5): BrandController, Brand, BrandRepository, BrandService, CatalogPlan

### Community 26 - "Modelos"
Cohesion: 0.18
Nodes (4): ModelController, Model, ModelRepository, ModelService

### Community 27 - "Configuración de TypeScript"
Cohesion: 0.11
Nodes (17): compilerOptions, alwaysStrict, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, forceConsistentCasingInFileNames, incremental, module (+9 more)

### Community 28 - "Repositorios MikroORM"
Cohesion: 0.24
Nodes (3): @mikro-orm/core, Repository, ACTIVE_RESERVATION_STATUSES

### Community 29 - "Descripciones DNRPA → tipo"
Cohesion: 0.16
Nodes (6): VehicleCategory, TypeChoice, DnrpaTypeMap, VehicleType, DescriptionChange, VehicleTypeUsage

### Community 31 - "Rutas de cocheras"
Cohesion: 0.20
Nodes (12): parkingController, parkingRepository, parkingRouter, parkingService, parkingSpaceRepository, createParkingSchema, listParkingsQuerySchema, parkingBodyBaseSchema (+4 more)

### Community 32 - "Rutas de plazas"
Cohesion: 0.21
Nodes (12): parkingRepo, parkingSpaceRouter, spaceController, spaceRepo, spaceService, createBulkSpaceSchema, createSpaceSchema, parkingSpaceavailability (+4 more)

### Community 33 - "Rutas de vehículos"
Cohesion: 0.19
Nodes (12): vehicleController, vehicleRepository, VehicleRouter, vehicleService, ClientIdSchema, CreateVehicleInput, createVehicleSchema, MIN_VEHICLE_YEAR (+4 more)

### Community 34 - "Rutas de tarifas"
Cohesion: 0.22
Nodes (11): parkingPriceController, parkingPriceRepository, ParkingPriceRouter, parkingPriceService, activeParkingPriceSchema, CreateParkingPriceInput, createParkingPriceSchema, parkingIdParamSchema (+3 more)

### Community 35 - "Fechas y reservas sembradas"
Cohesion: 0.21
Nodes (9): Range, bookedAt(), Booking, Car, Client, CLIENTS, DOW, seedReservations() (+1 more)

### Community 36 - "Rutas de precios de servicios"
Cohesion: 0.27
Nodes (8): servicePriceController, servicePriceRepository, servicePriceRouter, servicePriceService, activeServicePriceSchema, createServicePriceSchema, servicePriceIdSchema, parkingOf()

### Community 37 - "Importación del catálogo DNRPA"
Cohesion: 0.27
Nodes (3): CatalogController, CatalogRepository, CatalogService

### Community 38 - "Rutas de tipos de vehículo"
Cohesion: 0.29
Nodes (8): vehicleTypeController, vehicleTypeRepository, vehicleTypeRouter, vehicleTypeService, createVehicleTypeSchema, updateVehicleTypeSchema, vehicleTypeDescriptionsSchema, vehicleTypeIdSchema

### Community 39 - "Constantes de horarios"
Cohesion: 0.28
Nodes (7): argon2, CHECKOUT_GRACE_MINUTES, EXPIRED_RESERVATIONS_CHECK_MINUTES, PLANNING_HORIZON_MONTHS, REMINDER_CHECK_MINUTES, REMINDER_HOURS_BEFORE, MUST_CHANGE_PASSWORD

### Community 40 - "Rutas de feriados"
Cohesion: 0.33
Nodes (7): controller, holidayRouter, createHolidaySchema, date, holidayIdSchema, holidayOpenSchema, listHolidaysSchema

### Community 41 - "Rutas del catálogo de servicios"
Cohesion: 0.31
Nodes (7): scController, scRepository, scService, serviceCatalogRouter, createServiceCatalogSchema, serviceCatalogIdSchema, updateServiceCatalogSchema

### Community 42 - "Rutas de aseguradoras"
Cohesion: 0.31
Nodes (7): insuranceController, insuranceRepository, insuranceRouter, insuranceService, createInsuranceSchema, insuranceIdSchema, updateInsuranceSchema

### Community 43 - "Tipos de notificación"
Cohesion: 0.25
Nodes (8): NotificationType, PLAZA_CAMBIADA, RECORDATORIO, RESERVA_CANCELADA, RESERVA_EXTENDIDA, RESERVA_NUEVA, RESERVA_VENCIDA, SALIDA

## Ambiguous Edges - Review These
- `Logical deletes with 409 on active dependencies` → `Local tsx tests policy (_test DBs, not versioned)`  [AMBIGUOUS]
  CLAUDE.md · relation: conceptually_related_to
- `User roles and protected registration` → `pnpm allowBuilds (argon2 false, esbuild true)`  [AMBIGUOUS]
  pnpm-workspace.yaml · relation: conceptually_related_to

## Knowledge Gaps
- **48 isolated node(s):** `@types/cors`, `@types/express`, `@types/jsonwebtoken`, `@types/node`, `tsc-watch` (+43 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 323 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AppError` connect `Controllers y AppError` to `Reservas: entidad y repositorio`, `Cocheras: servicio y repositorio`, `Turnos de empleados`, `Reglas de la semana tipo`, `Catálogo de servicios`, `Días especiales y feriados`, `Usuarios y autenticación`, `Vehículos`, `Notificaciones`, `Tarifas de cochera`, `Rutas de facturas y personal`, `Localidades y plazas libres`, `Tipos de vehículo (ABM)`, `Facturas`, `Siembra del catálogo y nombres`, `Descripciones DNRPA → tipo`, `Entidades y fechas locales`, `Importación del catálogo DNRPA`, `Constantes de horarios`?**
  _High betweenness centrality (0.139) - this node is a cross-community bridge._
- **What connects `@types/cors`, `@types/express`, `@types/jsonwebtoken` to the rest of the system?**
  _48 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Reservas: entidad y repositorio` be split into smaller, more focused modules?**
  _Cohesion score 0.07806841046277666 - nodes in this community are weakly interconnected._
- **Why does `Parking` connect `Días especiales y feriados` to `Reservas: entidad y repositorio`, `Cocheras: servicio y repositorio`, `Turnos de empleados`, `Reglas de la semana tipo`, `Catálogo de servicios`, `Fechas y reservas sembradas`, `Constantes de horarios`, `Usuarios y autenticación`, `Siembra y demo`, `Tarifas de cochera`, `Rutas de facturas y personal`, `Localidades y plazas libres`, `Repositorios MikroORM`, `Entidades y fechas locales`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._
- **Should `Cocheras: servicio y repositorio` be split into smaller, more focused modules?**
  _Cohesion score 0.055533199195171024 - nodes in this community are weakly interconnected._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `Logical deletes with 409 on active dependencies` and `Local tsx tests policy (_test DBs, not versioned)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `User roles and protected registration` and `pnpm allowBuilds (argon2 false, esbuild true)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._