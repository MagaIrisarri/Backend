# Graph Report - Backend  (2026-10-12)

## Corpus Check
- 197 files · ~131,466 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 1 file(s) not represented in the graph (top: (none) 1)

## Summary
- 1791 nodes · 3802 edges · 80 communities (74 shown, 6 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 219 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `59cd5933`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Parking
- Schedule.Service.ts
- Reservation
- AppError
- EmployeeShift.Route.ts
- User
- ServicePrice
- package.json
- Model
- Backend conventions (CLAUDE.md)
- Insurance.Route.ts
- Hardening Controls
- VehicleType
- Vehicle
- ParkingSpace
- ParkingPrice
- Brand
- StatsRepository
- index.ts
- compilerOptions
- ParkingRepository
- Parking.Route.ts
- ParkingSpace.Route.ts
- zod
- Invoice.Route.ts
- parkingSeeder.ts
- ParkingPrice.Route.ts
- ParkingSpaceService
- Vehicle.Route.ts
- Code Review and Quality
- Holiday.Route.ts
- ServiceCatalog.Route.ts
- ServicePrice.Route.ts
- LocalDateType
- reservationSeeder.ts
- Test-Driven Development
- ParkingSpace.Repository.ts
- Price versioning (ParkingPrice, ServicePrice)
- ralph.sh
- Context Engineering
- Git Workflow and Versioning
- Optimization Patterns
- Shipping and Launch
- API and Interface Design
- Browser Testing with DevTools
- Frontend UI Engineering
- CI/CD and Automation
- Constraint-Driven Development
- Deprecation and Migration
- orm.ts
- Incremental Implementation
- Code Simplification
- Debugging and Error Recovery
- Documentation and ADRs
- seeder.ts
- Interview Me
- Planning and Task Breakdown
- ReOrder: Keep Your Regulars Ordering Direct
- ServiceCatalog
- Doubt-Driven Development
- Process
- Reservation.Route.ts
- Idea Refine
- Using Agent Skills
- Source-Driven Development
- Refinement & Evaluation Criteria
- Repository
- VehicleType.Route.ts
- seeder.db.test.ts
- Ideation Frameworks Reference
- Ponytail Help
- Notification.Route.ts
- utils/pagination.ts
- ponytail-audit/SKILL.md
- Ponytail Gain
- ponytail-review/SKILL.md
- Ponytail
- ponytail-debt/SKILL.md
- idea-refine.sh

## God Nodes (most connected - your core abstractions)
1. `AppError` - 93 edges
2. `Parking` - 60 edges
3. `Reservation` - 58 edges
4. `User` - 56 edges
5. `express` - 43 edges
6. `@mikro-orm/core` - 41 edges
7. `ScheduleService` - 39 edges
8. `Repository` - 36 edges
9. `ParkingSpace` - 34 edges
10. `ReservationRepository` - 34 edges

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
- **Ralph iteration loop** — scripts_ralph_claude_prd_json, scripts_ralph_claude_progress_txt, scripts_ralph_claude_one_story_loop, scripts_ralph_claude_quality_checks [EXTRACTED 1.00]
- **Date and timezone consistency** — readme_timezone_policy, claude_localdatetype, claude_mikroorm [INFERRED 0.85]
- **Centralized error handling flow** — readme_catchasync, readme_errorhandler, claude_apperror, claude_conflict_409_details [INFERRED 0.85]

## Communities (80 total, 6 thin omitted)

### Community 0 - "Parking"
Cohesion: 0.14
Nodes (8): @mikro-orm/core, @mikro-orm/decorators, Holiday, HolidayParking, Parking, CreateReservationParams, CATALOG, PRICES

### Community 1 - "Schedule.Service.ts"
Cohesion: 0.06
Nodes (42): DayException, DayOfWeek, FRIDAY, MONDAY, SATURDAY, SUNDAY, THURSDAY, TUESDAY (+34 more)

### Community 2 - "Reservation"
Cohesion: 0.05
Nodes (21): nodemailer, Invoice, InvoiceRepository, Reservation, reservationCode(), lockParking(), ReservationRepository, CreateReservationInput (+13 more)

### Community 3 - "AppError"
Cohesion: 0.06
Nodes (20): express, HolidayController, HolidayService, InvoiceController, InvoiceService, NotificationController, Notification, NewNotification (+12 more)

### Community 4 - "EmployeeShift.Route.ts"
Cohesion: 0.07
Nodes (27): EmployeeShiftController, EmployeeShift, EmployeeShiftRepository, employeeShiftController, employeeShiftRepository, employeeShiftService, scheduleController, CreateShiftInput (+19 more)

### Community 5 - "User"
Cohesion: 0.07
Nodes (25): UserController, User, UserRepository, userController, userRepository, userRouter, userService, baseUserFields (+17 more)

### Community 6 - "ServicePrice"
Cohesion: 0.17
Nodes (3): ServicePrice, ServicePriceRepository, ServicePriceService

### Community 7 - "package.json"
Cohesion: 0.05
Nodes (41): author, dependencies, argon2, cors, express, @mikro-orm/core, @mikro-orm/decorators, @mikro-orm/mysql (+33 more)

### Community 8 - "Model"
Cohesion: 0.11
Nodes (12): ModelController, Model, ModelRepository, modelController, modelRepository, modelRouter, modelService, createModelSchema (+4 more)

### Community 9 - "Backend conventions (CLAUDE.md)"
Cohesion: 0.07
Nodes (25): AppError, Backend conventions (CLAUDE.md), Business constants (PLANNING_HORIZON_MONTHS, ACTIVE_RESERVATION_STATUSES), Frontend CLAUDE.md (visual rules, pnpm verify), owner.api.spec.ts (Frontend e2e), owner-turnos-notas.md (R-/L-/D- notes, Frontend repo), PARKINGS_DATA, parkingSeeder (idempotent by name) (+17 more)

### Community 10 - "Insurance.Route.ts"
Cohesion: 0.12
Nodes (11): InsuranceController, Insurance, InsuranceRepository, insuranceController, insuranceRepository, insuranceRouter, insuranceService, createInsuranceSchema (+3 more)

### Community 11 - "Hardening Controls"
Cohesion: 0.05
Nodes (42): Broken Access Control, Broken Authentication, Cross-Site Scripting (XSS), Data Classification, Dependency Audit Triage, Destructive Operations on Derived Paths, File Upload Safety, Hardening Patterns (+34 more)

### Community 12 - "VehicleType"
Cohesion: 0.19
Nodes (3): VehicleType, VehicleTypeRepository, VehicleTypeService

### Community 13 - "Vehicle"
Cohesion: 0.13
Nodes (4): VehicleController, Vehicle, VehicleRepository, VehicleService

### Community 14 - "ParkingSpace"
Cohesion: 0.14
Nodes (3): ParkingSpace, ParkingSpaceRepository, Relocation

### Community 15 - "ParkingPrice"
Cohesion: 0.14
Nodes (4): ParkingPriceController, ParkingPrice, ParkingPriceRepository, ParkingPriceService

### Community 16 - "Brand"
Cohesion: 0.12
Nodes (11): BrandController, Brand, BrandRepository, brandController, brandRepository, brandRouter, brandService, brandIdSchema (+3 more)

### Community 17 - "StatsRepository"
Cohesion: 0.09
Nodes (19): Common Rationalizations, Keeping the Spec Alive, Overview, Phase 0: Scope Check, Phase 1: Specify, Phase 2: Plan, Phase 3: Tasks, Phase 4: Implement (+11 more)

### Community 18 - "index.ts"
Cohesion: 0.18
Nodes (12): employeeShiftRouter, app, startServer(), parkingSpaceRouter, reservationRouter, reservationService, EXPIRED_RESERVATIONS_CHECK_MINUTES, PLANNING_HORIZON_MONTHS (+4 more)

### Community 19 - "compilerOptions"
Cohesion: 0.11
Nodes (17): compilerOptions, alwaysStrict, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, forceConsistentCasingInFileNames, incremental, module (+9 more)

### Community 20 - "ParkingRepository"
Cohesion: 0.12
Nodes (4): ParkingPageOptions, ParkingRepository, CreateParkingInput, ParkingService

### Community 21 - "Parking.Route.ts"
Cohesion: 0.17
Nodes (13): ParkingController, parkingController, parkingRepository, parkingRouter, parkingService, parkingSpaceRepository, createParkingSchema, listParkingsQuerySchema (+5 more)

### Community 22 - "ParkingSpace.Route.ts"
Cohesion: 0.26
Nodes (10): parkingRepo, spaceController, spaceRepo, spaceService, createBulkSpaceSchema, createSpaceSchema, parkingSpaceavailability, parkingSpaceQuerySchema (+2 more)

### Community 23 - "zod"
Cohesion: 0.20
Nodes (10): zod, orm, validateSchema(), statsController, statsRouter, statsSummarySchema, catalogController, catalogRouter (+2 more)

### Community 24 - "Invoice.Route.ts"
Cohesion: 0.28
Nodes (7): invoiceController, invoiceRepository, invoiceRouter, invoiceService, invoiceIdSchema, payInvoiceSchema, PaymentMethodSchema

### Community 25 - "parkingSeeder.ts"
Cohesion: 0.15
Nodes (16): activeSpaces(), capacityField(), addSpaces(), ParkingData, PARKINGS_DATA, seedParkings(), INSURANCES, MOTOS (+8 more)

### Community 26 - "ParkingPrice.Route.ts"
Cohesion: 0.24
Nodes (10): parkingPriceController, parkingPriceRepository, ParkingPriceRouter, parkingPriceService, activeParkingPriceSchema, CreateParkingPriceInput, createParkingPriceSchema, parkingIdParamSchema (+2 more)

### Community 28 - "Vehicle.Route.ts"
Cohesion: 0.19
Nodes (12): vehicleController, vehicleRepository, VehicleRouter, vehicleService, ClientIdSchema, CreateVehicleInput, createVehicleSchema, MIN_VEHICLE_YEAR (+4 more)

### Community 29 - "Code Review and Quality"
Cohesion: 0.07
Nodes (29): 1. Correctness, 2. Readability & Simplicity, 3. Architecture, 4. Security, 5. Performance, Change Descriptions, Change Sizing, Code Review and Quality (+21 more)

### Community 30 - "Holiday.Route.ts"
Cohesion: 0.29
Nodes (8): scheduleService, controller, holidayRouter, createHolidaySchema, date, holidayIdSchema, holidayOpenSchema, listHolidaysSchema

### Community 31 - "ServiceCatalog.Route.ts"
Cohesion: 0.24
Nodes (8): ServiceCatalogController, scController, scRepository, scService, serviceCatalogRouter, createServiceCatalogSchema, serviceCatalogIdSchema, updateServiceCatalogSchema

### Community 32 - "ServicePrice.Route.ts"
Cohesion: 0.24
Nodes (8): ServicePriceController, servicePriceController, servicePriceRepository, servicePriceRouter, servicePriceService, activeServicePriceSchema, createServicePriceSchema, servicePriceIdSchema

### Community 33 - "LocalDateType"
Cohesion: 0.40
Nodes (3): LocalDateType, MikroORM, Backend README

### Community 34 - "reservationSeeder.ts"
Cohesion: 0.10
Nodes (18): NOTIFICATIONS_LIMIT, UserStatus, ACTIVO, BAJA, UserType, ADMINISTRADOR, CLIENTE, DUENO (+10 more)

### Community 35 - "Test-Driven Development"
Cohesion: 0.07
Nodes (29): Browser Testing with DevTools, Common Rationalizations, DAMP Over DRY in Tests, Decision Guide, Discover the Stack First, Name Tests Descriptively, One Assertion Per Concept, Overview (+21 more)

### Community 36 - "ParkingSpace.Repository.ts"
Cohesion: 0.16
Nodes (19): @mikro-orm/mysql, listLocalities(), SpaceState, LIBRE, MANTENIMIENTO, OCUPADO, busyIntervals(), candidates() (+11 more)

### Community 39 - "Context Engineering"
Cohesion: 0.07
Nodes (28): Anti-Patterns, Common Rationalizations, Compress before dropping, Confusion Management, Context Budget Management, Context Engineering, Context Packing Strategies, Level 1: Rules Files (+20 more)

### Community 40 - "Git Workflow and Versioning"
Cohesion: 0.07
Nodes (26): 1. Commit Early, Commit Often, 2. Atomic Commits, 3. Descriptive Messages, 4. Keep Concerns Separate, 5. Size Your Changes, Branch Naming, Branching Strategy, Change Summaries (+18 more)

### Community 41 - "Optimization Patterns"
Cohesion: 0.07
Nodes (25): Connection Pool Exhaustion, Large Bundle Size, Missing Caching (Backend), Missing Image Optimization (Frontend), N+1 Queries (Backend), Optimization Patterns, Queries That Ignore Their Index, Unbounded Data Fetching (+17 more)

### Community 42 - "Shipping and Launch"
Cohesion: 0.08
Nodes (25): Accessibility, Code Quality, Common Rationalizations, Documentation, Error Budget Release Gate, Error Reporting, Feature Flag Strategy, Infrastructure (+17 more)

### Community 43 - "API and Interface Design"
Cohesion: 0.08
Nodes (24): 1. Contract First, 2. Consistent Error Semantics, 3. Validate at Boundaries, 4. Prefer Addition Over Modification, 5. Predictable Naming, 6. Honouring an Idempotency Key, API and Interface Design, Common Rationalizations (+16 more)

### Community 44 - "Browser Testing with DevTools"
Cohesion: 0.08
Nodes (24): Accessibility Verification with DevTools, Available Tools, Browser Testing with DevTools, Clean Console Standard, Common Rationalizations, Console Analysis Patterns, Content Boundary Markers, For Network Issues (+16 more)

### Community 45 - "Frontend UI Engineering"
Cohesion: 0.08
Nodes (24): Accessibility (WCAG 2.1 AA), ARIA Labels, Avoid the AI Aesthetic, Color, Common Rationalizations, Component Architecture, Component Patterns, Design System Adherence (+16 more)

### Community 46 - "CI/CD and Automation"
Cohesion: 0.08
Nodes (23): Automation Beyond CI, Basic CI Pipeline, Build Cop Role, CI/CD and Automation, CI Optimization, Common Rationalizations, Dependabot / Renovate, Deployment Strategies (+15 more)

### Community 47 - "Constraint-Driven Development"
Cohesion: 0.08
Nodes (22): Adapting it, Contract, Floor guard: reference implementation, Reference (Node, ~stack-agnostic patterns), Common Rationalizations, Constraint-Driven Development, Escalation Path, Loading Constraints (+14 more)

### Community 48 - "Deprecation and Migration"
Cohesion: 0.08
Nodes (23): Adapter Pattern, Code Is a Liability, Common Rationalizations, Compulsory vs Advisory Deprecation, Core Principles, Database Schema Migrations (Expand/Contract), Deprecation and Migration, Deprecation Planning Starts at Design Time (+15 more)

### Community 49 - "orm.ts"
Cohesion: 0.22
Nodes (6): rejects(), em, rejects(), em, em, rejects()

### Community 50 - "Incremental Implementation"
Cohesion: 0.09
Nodes (22): Common Rationalizations, Contract-First Slicing, Implementation Rules, Increment Checklist, Incremental Implementation, Overview, Red Flags, Risk-First Slicing (+14 more)

### Community 51 - "Code Simplification"
Cohesion: 0.09
Nodes (21): 1. Preserve Behavior Exactly, 2. Follow Project Conventions, 3. Prefer Clarity Over Cleverness, 4. Maintain Balance, 5. Scope to What Changed, Code Simplification, Common Rationalizations, Language-Specific Guidance (+13 more)

### Community 52 - "Debugging and Error Recovery"
Cohesion: 0.09
Nodes (21): Build Failure Triage, Common Rationalizations, Debugging and Error Recovery, Error-Specific Patterns, Instrumentation Guidelines, Overview, Red Flags, Runtime Error Triage (+13 more)

### Community 53 - "Documentation and ADRs"
Cohesion: 0.09
Nodes (21): ADR Lifecycle, ADR Template, API Documentation, Architecture Decision Records (ADRs), Changelog Maintenance, Common Rationalizations, Document Known Gotchas, Documentation and ADRs (+13 more)

### Community 54 - "seeder.ts"
Cohesion: 0.16
Nodes (17): seedDatabase(), HOLIDAYS_2026, seedHolidays(), seedServices(), ALL, MON_SAT, seedStaff(), Staff (+9 more)

### Community 55 - "Interview Me"
Cohesion: 0.11
Nodes (18): Common Rationalizations, Example, Interaction with Other Skills, Interview Me, Loading Constraints, Output, Overview, Red Flags (+10 more)

### Community 56 - "Planning and Task Breakdown"
Cohesion: 0.11
Nodes (18): Common Rationalizations, Output Files, Overview, Parallelization Opportunities, Plan Document Template, Planning and Task Breakdown, Red Flags, See Also (+10 more)

### Community 57 - "ReOrder: Keep Your Regulars Ordering Direct"
Cohesion: 0.11
Nodes (17): Example 1: Vague Early-Stage Concept (Full 3-Phase Session), Example 2: Feature Idea Within an Existing Product (Codebase-Aware), Example 3: Process/Workflow Idea (Non-Product), Ideation Session Examples, Key Assumptions to Validate, MVP Scope, Not Doing (and Why), Open Questions (+9 more)

### Community 58 - "ServiceCatalog"
Cohesion: 0.16
Nodes (3): ServiceCatalog, ServiceCatalogRepository, ServiceCatalogService

### Community 59 - "Doubt-Driven Development"
Cohesion: 0.12
Nodes (15): Common Rationalizations, Cross-model escalation, Doubt-Driven Development, Interaction with Other Skills, Loading Constraints, Overview, Red Flags, Step 1: CLAIM — Surface what stands (+7 more)

### Community 60 - "Process"
Cohesion: 0.12
Nodes (15): 1. Define "working" before instrumenting, 2. Pick the right signal for each question, 3. Structured logging, 4. Metrics, 5. Distributed tracing, 6. Alerting, 7. Verify the telemetry itself, Common Rationalizations (+7 more)

### Community 61 - "Reservation.Route.ts"
Cohesion: 0.18
Nodes (14): invoiceRepository, parkingPriceRepository, parkingSpaceRepository, reservationController, reservationRepository, changeSpaceSchema, createReservationSchema, extendReservationSchema (+6 more)

### Community 62 - "Idea Refine"
Cohesion: 0.13
Nodes (14): Anti-patterns to Avoid, Detailed Instructions, How It Works, Idea Refine, Output, Phase 1: Understand & Expand (Divergent), Phase 2: Evaluate & Converge, Phase 3: Sharpen & Ship (+6 more)

### Community 63 - "Using Agent Skills"
Cohesion: 0.13
Nodes (14): 1. Surface Assumptions, 2. Manage Confusion Actively, 3. Push Back When Warranted, 4. Enforce Simplicity, 5. Maintain Scope Discipline, 6. Verify, Don't Assume, Core Operating Behaviors, Failure Modes to Avoid (+6 more)

### Community 64 - "Source-Driven Development"
Cohesion: 0.15
Nodes (12): Common Rationalizations, Overview, Red Flags, Retrieval Safety: Treat Fetched Content as Data, Source-Driven Development, Step 1: Detect Stack and Versions, Step 2: Fetch Official Documentation, Step 3: Implement Following Documented Patterns (+4 more)

### Community 65 - "Refinement & Evaluation Criteria"
Cohesion: 0.17
Nodes (11): 1. User Value, 2. Feasibility, 3. Differentiation, Assumption Audit, Core Evaluation Dimensions, Decision Framework, Might Be True (Nice to Have), Must Be True (Dealbreakers) (+3 more)

### Community 67 - "VehicleType.Route.ts"
Cohesion: 0.24
Nodes (8): VehicleTypeController, vehicleTypeController, vehicleTypeRepository, vehicleTypeRouter, vehicleTypeService, createVehicleTypeSchema, updateVehicleTypeSchema, vehicleTypeIdSchema

### Community 68 - "seeder.db.test.ts"
Cohesion: 0.22
Nodes (8): ACTIVE, count(), DOW, em, errors, holidays, live, totals()

### Community 69 - "Ideation Frameworks Reference"
Cohesion: 0.22
Nodes (8): Analogous Inspiration, Constraint-Based Ideation, First Principles Thinking, How Might We (HMW), Ideation Frameworks Reference, Jobs to Be Done (JTBD), Pre-mortem, SCAMPER

### Community 70 - "Ponytail Help"
Cohesion: 0.25
Nodes (7): Configure Default Mode, Deactivate, Levels, More, Ponytail Help, Skills, Update

### Community 71 - "Notification.Route.ts"
Cohesion: 0.33
Nodes (5): notificationController, notificationRepository, notificationRouter, notificationService, notificationIdSchema

### Community 72 - "utils/pagination.ts"
Cohesion: 0.47
Nodes (4): DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, PageMeta, pageQuery

### Community 73 - "ponytail-audit/SKILL.md"
Cohesion: 0.40
Nodes (4): 1. Map first, 2. Look for, 3. Check before you report, 4. Output

### Community 74 - "Ponytail Gain"
Cohesion: 0.40
Nodes (4): Boundaries, Honesty boundary, Ponytail Gain, Scoreboard

### Community 75 - "ponytail-review/SKILL.md"
Cohesion: 0.40
Nodes (4): 1. Understand first, 2. Look for, 3. Check before you report, 4. Output

### Community 76 - "Ponytail"
Cohesion: 0.40
Nodes (4): Before you write, Levels, Ponytail, The smallest complete change

### Community 77 - "ponytail-debt/SKILL.md"
Cohesion: 0.50
Nodes (3): Boundaries, Output, Scan

## Knowledge Gaps
- **48 isolated node(s):** `@types/cors`, `@types/express`, `@types/node`, `@types/nodemailer`, `tsc-watch` (+43 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 863 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AppError` connect `AppError` to `Schedule.Service.ts`, `Reservation`, `reservationSeeder.ts`, `EmployeeShift.Route.ts`, `ParkingSpace.Repository.ts`, `ServicePrice`, `User`, `Vehicle`, `ParkingSpace`, `ParkingPrice`, `ParkingRepository`, `ParkingSpaceService`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **What connects `@types/cors`, `@types/express`, `@types/node` to the rest of the system?**
  _48 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Parking` be split into smaller, more focused modules?**
  _Cohesion score 0.14453781512605043 - nodes in this community are weakly interconnected._
- **Why does `Parking` connect `Parking` to `Schedule.Service.ts`, `reservationSeeder.ts`, `Reservation`, `EmployeeShift.Route.ts`, `User`, `ParkingSpace.Repository.ts`, `ServicePrice`, `ParkingSpace`, `ParkingPrice`, `ParkingRepository`, `seeder.ts`, `parkingSeeder.ts`, `ParkingSpaceService`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Should `Schedule.Service.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.056802244039270686 - nodes in this community are weakly interconnected._
- **Why does `Reservation` connect `Reservation` to `Parking`, `Schedule.Service.ts`, `Repository`, `reservationSeeder.ts`, `ParkingSpace.Repository.ts`, `User`, `Vehicle`, `ParkingSpace`, `orm.ts`, `ParkingRepository`, `parkingSeeder.ts`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Should `Reservation` be split into smaller, more focused modules?**
  _Cohesion score 0.05021929824561404 - nodes in this community are weakly interconnected._