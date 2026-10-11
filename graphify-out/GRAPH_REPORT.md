# Graph Report - Backend  (2026-10-11)

## Corpus Check
- 136 files · ~119,218 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 1 file(s) not represented in the graph (top: (none) 1)

## Summary
- 1056 nodes · 2798 edges · 39 communities (35 shown, 4 thin omitted)
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 213 edges (avg confidence: 0.85)
- Token cost: 74,496 input · 0 output

## Community Hubs (Navigation)
- ORM Imports & Seeders
- Weekly Schedule & Day Exceptions
- Reservations Module
- Controllers, Services & AppError
- Employee Shifts Module
- Users Module
- Service Catalog & Prices
- Package Metadata
- Vehicle Models Module
- Backend Conventions (Docs)
- Insurance Module
- Runtime Dependencies
- Vehicle Types Module
- Vehicles Module
- Parking Space Entity
- Parking Prices Module
- Brands Module
- Owner Stats
- App Bootstrap & Cron Jobs
- TypeScript Config
- Parking Repository Queries
- Parking Routes & Controller
- Parking Space Routes
- Zod Validation & Brand Routes
- Invoice Routes
- Parking Service & Live Availability
- Parking Price Routes
- Space Availability & Capacity
- Vehicle Routes
- Dev Dependencies
- Holiday Routes
- Service Catalog Routes
- Service Price Routes
- Dates, Timezone & MikroORM
- User Roles
- Email Sending
- NPM Scripts
- Price Versioning
- Ralph Agent Script

## God Nodes (most connected - your core abstractions)
1. `AppError` - 85 edges
2. `Parking` - 58 edges
3. `Reservation` - 54 edges
4. `User` - 51 edges
5. `express` - 38 edges
6. `@mikro-orm/core` - 36 edges
7. `Repository` - 36 edges
8. `ParkingSpace` - 35 edges
9. `ScheduleService` - 34 edges
10. `ReservationRepository` - 33 edges

## Surprising Connections (you probably didn't know these)
- `Quality requirements (typecheck, lint, test)` --semantically_similar_to--> `Local unversioned tests policy (_test databases)`  [INFERRED] [semantically similar]
  scripts/ralph/CLAUDE.md → CLAUDE.md
- `Ralph autonomous agent instructions` --references--> `Backend conventions (CLAUDE.md)`  [INFERRED]
  scripts/ralph/CLAUDE.md → CLAUDE.md
- `Timezone America/Argentina/Buenos_Aires (process.env.TZ)` --semantically_similar_to--> `LocalDateType`  [INFERRED] [semantically similar]
  README.MD → CLAUDE.md
- `DayException` --references--> `Parking`  [EXTRACTED]
  src/EmployeeShift/DayException.Entity.ts → src/Parking/Parking.Entity.ts
- `EmployeeShift` --references--> `Parking`  [EXTRACTED]
  src/EmployeeShift/EmployeeShift.Entity.ts → src/Parking/Parking.Entity.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Centralized error handling flow** — readme_catchasync, readme_errorhandler, claude_apperror, claude_conflict_409_details [INFERRED 0.85]
- **Date and timezone consistency** — readme_timezone_policy, claude_localdatetype, claude_mikroorm [INFERRED 0.85]
- **Ralph iteration loop** — scripts_ralph_claude_prd_json, scripts_ralph_claude_progress_txt, scripts_ralph_claude_one_story_loop, scripts_ralph_claude_quality_checks [EXTRACTED 1.00]

## Communities (39 total, 4 thin omitted)

### Community 0 - "ORM Imports & Seeders"
Cohesion: 0.06
Nodes (53): argon2, @mikro-orm/core, @mikro-orm/decorators, @mikro-orm/mysql, rejects(), Holiday, HolidayParking, Parking (+45 more)

### Community 1 - "Weekly Schedule & Day Exceptions"
Cohesion: 0.06
Nodes (41): DayException, DayOfWeek, FRIDAY, MONDAY, SATURDAY, SUNDAY, THURSDAY, TUESDAY (+33 more)

### Community 2 - "Reservations Module"
Cohesion: 0.06
Nodes (21): ReservationController, Reservation, ReservationRepository, invoiceRepository, parkingPriceRepository, parkingSpaceRepository, reservationController, reservationRepository (+13 more)

### Community 3 - "Controllers, Services & AppError"
Cohesion: 0.08
Nodes (12): express, HolidayController, HolidayService, InvoiceController, Invoice, InvoiceRepository, InvoiceService, UserStatus (+4 more)

### Community 4 - "Employee Shifts Module"
Cohesion: 0.06
Nodes (27): EmployeeShiftController, EmployeeShift, EmployeeShiftRepository, employeeShiftController, employeeShiftRepository, employeeShiftService, scheduleController, CreateShiftInput (+19 more)

### Community 5 - "Users Module"
Cohesion: 0.07
Nodes (24): ParkingData, UserController, User, UserRepository, userController, userRepository, userService, baseUserFields (+16 more)

### Community 6 - "Service Catalog & Prices"
Cohesion: 0.07
Nodes (8): ServiceCatalogController, ServiceCatalog, ServiceCatalogRepository, ServiceCatalogService, ServicePriceController, ServicePrice, ServicePriceRepository, ServicePriceService

### Community 7 - "Package Metadata"
Cohesion: 0.05
Nodes (38): author, description, keywords, license, main, name, type, version (+30 more)

### Community 8 - "Vehicle Models Module"
Cohesion: 0.11
Nodes (12): ModelController, Model, ModelRepository, modelController, modelRepository, modelRouter, modelService, createModelSchema (+4 more)

### Community 9 - "Backend Conventions (Docs)"
Cohesion: 0.07
Nodes (25): AppError, Backend conventions (CLAUDE.md), Business constants (PLANNING_HORIZON_MONTHS, ACTIVE_RESERVATION_STATUSES), Frontend CLAUDE.md (visual rules, pnpm verify), owner.api.spec.ts (Frontend e2e), owner-turnos-notas.md (R-/L-/D- notes, Frontend repo), PARKINGS_DATA, parkingSeeder (idempotent by name) (+17 more)

### Community 10 - "Insurance Module"
Cohesion: 0.12
Nodes (11): InsuranceController, Insurance, InsuranceRepository, insuranceController, insuranceRepository, insuranceRouter, insuranceService, createInsuranceSchema (+3 more)

### Community 11 - "Runtime Dependencies"
Cohesion: 0.07
Nodes (30): dependencies, argon2, axios, cors, cross-spawn, duplexer, event-stream, express (+22 more)

### Community 12 - "Vehicle Types Module"
Cohesion: 0.12
Nodes (10): VehicleTypeController, VehicleType, VehicleTypeRepository, vehicleTypeController, vehicleTypeRepository, vehicleTypeService, createVehicleTypeSchema, updateVehicleTypeSchema (+2 more)

### Community 13 - "Vehicles Module"
Cohesion: 0.13
Nodes (4): VehicleController, Vehicle, VehicleRepository, VehicleService

### Community 14 - "Parking Space Entity"
Cohesion: 0.11
Nodes (3): ParkingSpace, ParkingSpaceRepository, Relocation

### Community 15 - "Parking Prices Module"
Cohesion: 0.14
Nodes (4): ParkingPriceController, ParkingPrice, ParkingPriceRepository, ParkingPriceService

### Community 16 - "Brands Module"
Cohesion: 0.17
Nodes (4): BrandController, Brand, BrandRepository, BrandService

### Community 17 - "Owner Stats"
Cohesion: 0.17
Nodes (7): STATS_PERIOD_DAYS, STATS_TOP_PARKINGS, StatsController, StatsRepository, statsController, statsRouter, StatsService

### Community 18 - "App Bootstrap & Cron Jobs"
Cohesion: 0.14
Nodes (16): cors, employeeShiftRouter, app, startServer(), reservationRouter, reservationService, EXPIRED_RESERVATIONS_CHECK_MINUTES, PLANNING_HORIZON_MONTHS (+8 more)

### Community 19 - "TypeScript Config"
Cohesion: 0.11
Nodes (17): compilerOptions, alwaysStrict, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, forceConsistentCasingInFileNames, incremental, module (+9 more)

### Community 21 - "Parking Routes & Controller"
Cohesion: 0.17
Nodes (12): ParkingController, parkingController, parkingRepository, parkingRouter, parkingService, parkingSpaceRepository, createParkingSchema, parkingBodyBaseSchema (+4 more)

### Community 22 - "Parking Space Routes"
Cohesion: 0.23
Nodes (11): parkingRepo, parkingSpaceRouter, spaceController, spaceRepo, spaceService, createBulkSpaceSchema, createSpaceSchema, parkingSpaceavailability (+3 more)

### Community 23 - "Zod Validation & Brand Routes"
Cohesion: 0.24
Nodes (9): zod, validateSchema(), brandController, brandRepository, brandRouter, brandService, brandIdSchema, createBrandSchema (+1 more)

### Community 24 - "Invoice Routes"
Cohesion: 0.23
Nodes (10): invoiceController, invoiceRepository, invoiceRouter, invoiceService, createInvoiceSchema, invoiceIdSchema, InvoiceStatusSchema, payInvoiceSchema (+2 more)

### Community 25 - "Parking Service & Live Availability"
Cohesion: 0.32
Nodes (3): activeSpaces(), ParkingService, groupSpacesByVehicleType()

### Community 26 - "Parking Price Routes"
Cohesion: 0.24
Nodes (10): parkingPriceController, parkingPriceRepository, ParkingPriceRouter, parkingPriceService, activeParkingPriceSchema, CreateParkingPriceInput, createParkingPriceSchema, parkingIdParamSchema (+2 more)

### Community 28 - "Vehicle Routes"
Cohesion: 0.25
Nodes (9): vehicleController, vehicleRepository, VehicleRouter, vehicleService, ClientIdSchema, CreateVehicleInput, createVehicleSchema, UpdateVehicleSchema (+1 more)

### Community 29 - "Dev Dependencies"
Cohesion: 0.20
Nodes (10): devDependencies, nodemon, ts-node, tsc-watch, tsx, @types/cors, @types/express, @types/node (+2 more)

### Community 30 - "Holiday Routes"
Cohesion: 0.29
Nodes (8): scheduleService, controller, holidayRouter, createHolidaySchema, date, holidayIdSchema, holidayOpenSchema, listHolidaysSchema

### Community 31 - "Service Catalog Routes"
Cohesion: 0.31
Nodes (7): scController, scRepository, scService, serviceCatalogRouter, createServiceCatalogSchema, serviceCatalogIdSchema, updateServiceCatalogSchema

### Community 32 - "Service Price Routes"
Cohesion: 0.31
Nodes (7): servicePriceController, servicePriceRepository, servicePriceRouter, servicePriceService, activeServicePriceSchema, createServicePriceSchema, servicePriceIdSchema

### Community 33 - "Dates, Timezone & MikroORM"
Cohesion: 0.40
Nodes (3): LocalDateType, MikroORM, Backend README

### Community 34 - "User Roles"
Cohesion: 0.40
Nodes (5): UserType, ADMINISTRADOR, CLIENTE, DUENO, EMPLEADO

### Community 35 - "Email Sending"
Cohesion: 0.50
Nodes (3): nodemailer, Mail, sendMail

### Community 36 - "NPM Scripts"
Cohesion: 0.67
Nodes (3): scripts, build, start:dev

## Knowledge Gaps
- **61 isolated node(s):** `@types/cors`, `@types/express`, `@types/node`, `@types/nodemailer`, `nodemon` (+56 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 320 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AppError` connect `Controllers, Services & AppError` to `ORM Imports & Seeders`, `Weekly Schedule & Day Exceptions`, `Reservations Module`, `Employee Shifts Module`, `Users Module`, `Service Catalog & Prices`, `Vehicles Module`, `Parking Space Entity`, `Parking Prices Module`, `Parking Repository Queries`, `Parking Service & Live Availability`, `Space Availability & Capacity`?**
  _High betweenness centrality (0.102) - this node is a cross-community bridge._
- **What connects `@types/cors`, `@types/express`, `@types/node` to the rest of the system?**
  _61 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `ORM Imports & Seeders` be split into smaller, more focused modules?**
  _Cohesion score 0.056779438762129555 - nodes in this community are weakly interconnected._
- **Why does `Parking` connect `ORM Imports & Seeders` to `Weekly Schedule & Day Exceptions`, `Reservations Module`, `Employee Shifts Module`, `Users Module`, `Service Catalog & Prices`, `Parking Space Entity`, `Parking Prices Module`, `Parking Repository Queries`, `Parking Service & Live Availability`, `Space Availability & Capacity`?**
  _High betweenness centrality (0.091) - this node is a cross-community bridge._
- **Should `Weekly Schedule & Day Exceptions` be split into smaller, more focused modules?**
  _Cohesion score 0.057631257631257635 - nodes in this community are weakly interconnected._
- **Why does `express` connect `Controllers, Services & AppError` to `Service Price Routes`, `Reservations Module`, `Employee Shifts Module`, `Users Module`, `Package Metadata`, `Vehicle Models Module`, `Insurance Module`, `Vehicle Types Module`, `Owner Stats`, `App Bootstrap & Cron Jobs`, `Parking Routes & Controller`, `Parking Space Routes`, `Zod Validation & Brand Routes`, `Invoice Routes`, `Parking Price Routes`, `Vehicle Routes`, `Holiday Routes`, `Service Catalog Routes`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._
- **Should `Reservations Module` be split into smaller, more focused modules?**
  _Cohesion score 0.058941058941058944 - nodes in this community are weakly interconnected._