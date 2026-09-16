# 🔍 Auditoría de Duplicación de Código — Backend

**Fecha:** 2026-09-16 (actualizado 2026-09-16)  
**Archivos analizados:** ~92 archivos TypeScript  
**Módulos:** EmployeeShift, Invoice, Parking, ParkingPrice, ParkingSpace, Reservation, ServiceCatalog, ServicePrice, User, Vehicle (+ Brand, Insurance, Model, VehicleType)

> **Leyenda de estado:** ✅ Implementado · 🔲 Pendiente

---

## Resumen Ejecutivo

| Categoría                | Hallazgos | Líneas duplicadas (aprox.) | % del código total |
| ------------------------ | --------- | -------------------------- | ------------------ |
| Duplicados Exactos       | 3         | ~120                       | ~4%                |
| Cuasi-Duplicados         | 5         | ~350                       | ~12%               |
| Duplicados Estructurales | 4         | ~800                       | ~27%               |
| Duplicación de Datos     | 4         | ~60                        | ~2%                |
| **TOTAL**                | **16**    | **~1330**                  | **~45%**           |

---

## 1. DUPLICADOS EXACTOS

---

### ✅ DUP-01 · `getVehicleVariants()` — Función unificada

**Importancia: 9/10**

La misma función `getVehicleVariants` existe, palabra por palabra, en 3 ubicaciones:

| #   | Archivo                                                                                                                              | Líneas                                              |
| --- | ------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------- |
| 1   | [`Reservation.Repository.ts`](file:///c:/Users/Valentino/Documents/2026/Backend/src/Reservation/Reservation.Repository.ts#L134-L141) | L134-141                                            |
| 2   | [`Reservation.Service.ts`](file:///c:/Users/Valentino/Documents/2026/Backend/src/Reservation/Reservation.Service.ts#L163-L170)       | L163-170                                            |
| 3   | [`ParkingSpace.Service.ts`](file:///c:/Users/Valentino/Documents/2026/Backend/src/ParkingSpace/ParkingSpace.Service.ts#L135-L146)    | L135-146 (variante con nombre `matchesVehicleType`) |

```typescript
// Copia textual en Reservation.Repository.ts L134 y Reservation.Service.ts L163
const getVehicleVariants = (typeName?: string): string[] => {
  const v = (typeName || '').trim().toUpperCase();
  if (v.includes('MOTO'))
    return [
      'MOTOCICLETA',
      'Motocicleta',
      'MOTO',
      'Moto',
      'moto',
      'motocicleta',
    ];
  if (
    v.includes('CAMION') ||
    v.includes('UTIL') ||
    v.includes('VAN') ||
    v.includes('PICK')
  ) {
    return [
      'CAMIONETA',
      'Camioneta',
      'UTILITARIO',
      'Utilitario',
      'utilitario',
      'camioneta',
      'VAN',
      'Van',
    ];
  }
  return ['AUTO', 'Auto', 'auto', 'AUTOMOVIL', 'Automovil'];
};
```

**Remediación → Extraer a `src/Shared/utils/vehicleTypes.ts`:**

```typescript
// src/Shared/utils/vehicleTypes.ts
export const VEHICLE_CATEGORIES = {
  MOTO: ['MOTOCICLETA', 'MOTO'],
  CAMIONETA: ['CAMIONETA', 'UTILITARIO', 'VAN', 'PICKUP', 'PICK-UP'],
  AUTO: ['AUTO', 'AUTOMOVIL'],
} as const;

export function getVehicleVariants(typeName?: string): string[] {
  const v = (typeName || '').trim().toUpperCase();
  if (v.includes('MOTO'))
    return [
      'MOTOCICLETA',
      'Motocicleta',
      'MOTO',
      'Moto',
      'moto',
      'motocicleta',
    ];
  if (
    v.includes('CAMION') ||
    v.includes('UTIL') ||
    v.includes('VAN') ||
    v.includes('PICK')
  ) {
    return [
      'CAMIONETA',
      'Camioneta',
      'UTILITARIO',
      'Utilitario',
      'utilitario',
      'camioneta',
      'VAN',
      'Van',
    ];
  }
  return ['AUTO', 'Auto', 'auto', 'AUTOMOVIL', 'Automovil'];
}

export function matchesVehicleType(typeA: string, typeB: string): boolean {
  const a = (typeA || '').trim().toUpperCase();
  const b = (typeB || '').trim().toUpperCase();
  if (a === b) return true;
  for (const group of Object.values(VEHICLE_CATEGORIES)) {
    if (group.some((t) => a.includes(t)) && group.some((t) => b.includes(t)))
      return true;
  }
  return false;
}

export function categorizeVehicleType(
  raw: string,
): 'AUTO' | 'MOTO' | 'CAMIONETA' {
  const upper = (raw || '').trim().toUpperCase();
  if (upper.includes('MOTO')) return 'MOTO';
  if (
    upper.includes('CAMION') ||
    upper.includes('UTIL') ||
    upper.includes('VAN') ||
    upper.includes('PICK')
  )
    return 'CAMIONETA';
  return 'AUTO';
}
```

**Esfuerzo estimado:** 30 minutos

---

### ✅ DUP-02 · Consulta de reservas activas por plaza — Bloque copiado 2 veces

**Importancia: 8/10**

Código exactamente igual en [`ParkingSpace.Service.ts`](file:///c:/Users/Valentino/Documents/2026/Backend/src/ParkingSpace/ParkingSpace.Service.ts) en los métodos `update()` (L86-92) y `remove()` (L109-115):

```typescript
// Duplicado en L86-92 y L109-115
const em = (this.reservationRepo as any).em;
const { Reservation } = await import('../Reservation/Reservation.Entity.js');
const activeReservations = await em.find(Reservation, {
  parkingSpace: { id },
  status: { $in: ['PENDIENTE', 'CONFIRMADA', 'EN CURSO'] },
  endTime: { $gte: new Date() },
});
```

**Remediación — Extraer método privado en `ParkingSpaceService`:**

```typescript
// Agregar a ParkingSpaceService
private async findActiveReservationsForSpace(spaceId: string): Promise<any[]> {
  const em = (this.reservationRepo as any).em;
  const { Reservation } = await import('../Reservation/Reservation.Entity.js');
  return em.find(Reservation, {
    parkingSpace: { id: spaceId },
    status: { $in: ['PENDIENTE', 'CONFIRMADA', 'EN CURSO'] },
    endTime: { $gte: new Date() },
  });
}
```

Luego reemplazar en `update()` y `remove()`:

```typescript
const activeReservations = await this.findActiveReservationsForSpace(id);
```

**Esfuerzo estimado:** 15 minutos

---

### ✅ DUP-03 · `formatTime` / `getHHMM` — Función de formateo de hora unificada

**Importancia: 6/10**

Misma lógica en:

| Archivo                                                                                                                              | Nombre       | Líneas   |
| ------------------------------------------------------------------------------------------------------------------------------------ | ------------ | -------- |
| [`Reservation.Service.ts`](file:///c:/Users/Valentino/Documents/2026/Backend/src/Reservation/Reservation.Service.ts#L40-L44)         | `getHHMM`    | L40-44   |
| [`Reservation.Repository.ts`](file:///c:/Users/Valentino/Documents/2026/Backend/src/Reservation/Reservation.Repository.ts#L114-L118) | `formatTime` | L114-118 |

```typescript
// Reservation.Service.ts L40
const getHHMM = (d: Date) => {
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

// Reservation.Repository.ts L114
const formatTime = (d: Date) => {
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
};
```

**Remediación → Extraer a `src/Shared/utils/dateUtils.ts`:**

```typescript
export function formatTimeHHMM(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}
```

**Esfuerzo estimado:** 10 minutos

---

## 2. CUASI-DUPLICADOS

---

### ✅ DUP-04 · Lógica de `matchesType` unificada

**Importancia: 9/10**

La lógica de comparación de tipos de vehículo está implementada de 4 maneras distintas con listas de sinónimos ligeramente diferentes:

| #   | Archivo                                                                                                                               | Método                  | Incluye 'SUV'? | Incluye 'bici'? | Case      |
| --- | ------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- | -------------- | --------------- | --------- |
| 1   | [`ParkingPrice.Repository.ts`](file:///c:/Users/Valentino/Documents/2026/Backend/src/ParkingPrice/ParkingPrice.Repository.ts#L86-L97) | `matchesType()`         | ✅             | ✅              | lowercase |
| 2   | [`ParkingSpace.Service.ts`](file:///c:/Users/Valentino/Documents/2026/Backend/src/ParkingSpace/ParkingSpace.Service.ts#L135-L146)     | `matchesVehicleType()`  | ❌             | ❌              | UPPERCASE |
| 3   | [`Parking.Service.ts`](file:///c:/Users/Valentino/Documents/2026/Backend/src/Parking/Parking.Service.ts#L26-L28)                      | Filtros inline          | ❌             | ❌              | UPPERCASE |
| 4   | [`Parking.Service.ts`](file:///c:/Users/Valentino/Documents/2026/Backend/src/Parking/Parking.Service.ts#L127-L128)                    | `isMoto()`, `isTruck()` | ✅ (`PICKUP`)  | ❌              | UPPERCASE |

> ⚠️ **Riesgo funcional**: Las variantes no coinciden. `matchesType` en ParkingPrice incluye `'suv'` y `'bici'` pero las demás no. Esto puede causar inconsistencias al resolver precios vs. disponibilidad.

**Remediación** → Usar la función `matchesVehicleType()` centralizada propuesta en DUP-01.

**Esfuerzo estimado:** 45 minutos (requiere verificar que no se rompan queries)

---

### ✅ DUP-05 · Categorización de `vehicleType` por string duplicada ~6 veces

**Importancia: 8/10**

La lógica `if (raw.includes('MOTO')) category = 'MOTO'; else if (raw.includes('CAMION')...)` aparece en:

1. [`Parking.Service.ts`](file:///c:/Users/Valentino/Documents/2026/Backend/src/Parking/Parking.Service.ts#L74-L84) `formatParkingResponse` → L74-84
2. [`Parking.Service.ts`](file:///c:/Users/Valentino/Documents/2026/Backend/src/Parking/Parking.Service.ts#L127-L128) `enrichWithLiveAvailability` → L127-128
3. [`Parking.Service.ts`](file:///c:/Users/Valentino/Documents/2026/Backend/src/Parking/Parking.Service.ts#L171-L173) `enrichWithLiveAvailability` → L171-173 (segundo uso)
4. [`ParkingPrice.Repository.ts`](file:///c:/Users/Valentino/Documents/2026/Backend/src/ParkingPrice/ParkingPrice.Repository.ts#L145-L149) `findByParking` → L145-149
5. [`ParkingPrice.Repository.ts`](file:///c:/Users/Valentino/Documents/2026/Backend/src/ParkingPrice/ParkingPrice.Repository.ts#L67-L81) `findOfficialVehicleType` → L67-81
6. [`ParkingSpace.Service.ts`](file:///c:/Users/Valentino/Documents/2026/Backend/src/ParkingSpace/ParkingSpace.Service.ts#L45-L52) `createBulkManual` → prefixMap L45-52

**Remediación** → Usar `categorizeVehicleType()` centralizada del módulo propuesto en DUP-01.

**Esfuerzo estimado:** 30 minutos

---

### ✅ DUP-06 · Filtros de `spaces` por tipo de vehículo — Extraído a helper

**Importancia: 7/10**

El mismo patrón de filtrado de espacios aparece **3 veces** en [`Parking.Service.ts`](file:///c:/Users/Valentino/Documents/2026/Backend/src/Parking/Parking.Service.ts):

```typescript
// Patrón repetido en L26-28, L171-173, y cálculos de capacidad
const autoSpaces = spaces.filter(
  (s) => s.vehicleType?.toUpperCase() === 'AUTO' && s.isActive,
);
const motoSpaces = spaces.filter(
  (s) =>
    ['MOTOCICLETA', 'MOTO'].includes(s.vehicleType?.toUpperCase()) &&
    s.isActive,
);
const truckSpaces = spaces.filter(
  (s) =>
    ['CAMIONETA', 'VAN', 'UTILITARIO'].includes(s.vehicleType?.toUpperCase()) &&
    s.isActive,
);
```

**Remediación — Extraer helper:**

```typescript
// src/Shared/utils/vehicleTypes.ts
import { ParkingSpace } from '../ParkingSpace/ParkingSpace.Entity.js';

export function groupSpacesByVehicleType(spaces: ParkingSpace[]) {
  const active = spaces.filter((s) => s.isActive);
  return {
    auto: active.filter((s) => categorizeVehicleType(s.vehicleType) === 'AUTO'),
    moto: active.filter((s) => categorizeVehicleType(s.vehicleType) === 'MOTO'),
    camioneta: active.filter(
      (s) => categorizeVehicleType(s.vehicleType) === 'CAMIONETA',
    ),
  };
}
```

**Esfuerzo estimado:** 20 minutos

---

### ✅ DUP-07 · `findByOwner` vs `findByOwnerId` en Parking — Funcionalidad unificada

**Importancia: 6/10**

[`Parking.Controller.ts`](file:///c:/Users/Valentino/Documents/2026/Backend/src/Parking/Parking.Controller.ts) tiene **3 métodos** que buscan parkings por owner:

| Método          | Línea | Usa catchAsync?       | Service method                           |
| --------------- | ----- | --------------------- | ---------------------------------------- |
| `findByOwner`   | L32   | ❌ (try/catch manual) | `findByOwner()`                          |
| `findByOwnerId` | L62   | ✅                    | `findByOwnerId()`                        |
| —               | —     | —                     | Ambos llaman al repo con el mismo filtro |

En el repositorio, [`findByOwnerId`](file:///c:/Users/Valentino/Documents/2026/Backend/src/Parking/Parking.Repository.ts#L24) y [`findByOwner`](file:///c:/Users/Valentino/Documents/2026/Backend/src/Parking/Parking.Repository.ts#L28) hacen prácticamente lo mismo (el segundo agrega `orderBy: { name: 'ASC' }`).

**Remediación** → Unificar a un solo método `findByOwnerId` con opción de ordenamiento:

```typescript
// Parking.Repository.ts — eliminar findByOwner, agregar orderBy a findByOwnerId
async findByOwnerId(ownerId: string): Promise<Parking[]> {
  return await this.em.find(Parking, { owner: { id: ownerId } },
    { populate: ['owner', 'parkingpriceHistory', 'parkingSpaces'] as any, orderBy: { name: 'ASC' } });
}
```

Y eliminar `findByOwner` del controller y el service.

**Esfuerzo estimado:** 20 minutos

---

### ✅ DUP-08 · `findActive` en `Parking.Controller.ts` usa `catchAsync`

**Importancia: 5/10**

En [`Parking.Controller.ts`](file:///c:/Users/Valentino/Documents/2026/Backend/src/Parking/Parking.Controller.ts#L17-L30), los métodos `findActive` (L17) y `findByOwner` (L32) usan try/catch manual mientras que **todos los demás** métodos usan `catchAsync`. Es inconsistente y duplica el manejo de errores.

**Remediación:**

```typescript
// Reemplazar:
public findActive = async (_req: Request, res: Response) => {
  try { ... } catch (error: any) { ... }
};

// Por:
public findActive = catchAsync(async (_req: Request, res: Response) => {
  const parkings = await this.parkingService.findActive();
  return res.status(200).json({
    message: parkings.length === 0 ? 'No se encontraron estacionamientos activos' : 'Estacionamientos encontrados',
    data: parkings,
  });
});
```

**Esfuerzo estimado:** 10 minutos

---

## 3. DUPLICADOS ESTRUCTURALES

---

### DUP-09 · Patrón CRUD del Repository — Idéntico en 10+ archivos

**Importancia: 10/10** — Mayor fuente de duplicación del proyecto

**~65% de cada archivo Repository** es boilerplate copiado. Cada repositorio implementa exactamente:

```typescript
constructor(private em: EntityManager) {}

async findAll(): Promise<T[]> {
  return await this.em.find(Entity, { isActive: true });
}

async findOne(item: { id: string }): Promise<T | null> {
  return await this.em.findOne(Entity, { id: item.id, isActive: true });
}

async add(data: any): Promise<T> {
  const entity = this.em.create(Entity, data);
  await this.em.flush();
  return entity;
}

async update(id: string, data: any): Promise<T | null> {
  const entity = await this.findOne({ id });
  if (!entity) return null;
  this.em.assign(entity, data);
  await this.em.flush();
  return entity;
}

async remove(item: { id: string }): Promise<boolean> {
  const entity = await this.findOne({ id: item.id });
  if (!entity) return false;
  entity.isActive = false; // o entity.status = 'X'
  await this.em.flush();
  return true;
}
```

**Archivos afectados (10):** BrandRepository, InsuranceRepository, VehicleTypeRepository, ModelRepository, ServiceCatalogRepository, ParkingSpaceRepository, EmployeeShiftRepository, UserRepository, VehicleRepository, ParkingPriceRepository (parcial), ServicePriceRepository (parcial).

**Remediación — Crear `AbstractRepository<T>` genérico:**

```typescript
// src/Shared/AbstractRepository.ts
import { EntityManager, EntityClass } from '@mikro-orm/core';
import { Repository } from './base.Repository.js';

export abstract class AbstractRepository<
  T extends { id: string },
> implements Repository<T> {
  constructor(
    protected readonly em: EntityManager,
    private readonly entityClass: EntityClass<T>,
    private readonly softDeleteField: string = 'isActive',
    private readonly softDeleteValue: any = false,
    private readonly activeFilter: Record<string, any> = { isActive: true },
    private readonly defaultPopulate: string[] = [],
  ) {}

  async findAll(): Promise<T[]> {
    return await this.em.find(
      this.entityClass,
      this.activeFilter,
      this.defaultPopulate.length
        ? { populate: this.defaultPopulate as any }
        : {},
    );
  }

  async findOne(item: { id: string }): Promise<T | null> {
    return await this.em.findOne(
      this.entityClass,
      { id: item.id, ...this.activeFilter } as any,
      this.defaultPopulate.length
        ? { populate: this.defaultPopulate as any }
        : {},
    );
  }

  async add(data: any): Promise<T> {
    const entity = this.em.create(this.entityClass, data);
    await this.em.flush();
    return entity;
  }

  async update(id: string, data: any): Promise<T | null> {
    const entity = await this.findOne({ id });
    if (!entity) return null;
    this.em.assign(entity, data);
    await this.em.flush();
    return entity;
  }

  async remove(item: { id: string }): Promise<boolean> {
    const entity = await this.findOne({ id: item.id });
    if (!entity) return false;
    (entity as any)[this.softDeleteField] = this.softDeleteValue;
    await this.em.flush();
    return true;
  }
}
```

**Ejemplo de uso — `BrandRepository` de 35 líneas → 8 líneas:**

```typescript
import { EntityManager } from '@mikro-orm/core';
import { AbstractRepository } from '../../Shared/AbstractRepository.js';
import { Brand } from './Brand.Entity.js';

export class BrandRepository extends AbstractRepository<Brand> {
  constructor(em: EntityManager) {
    super(em, Brand, 'isActive', false, { isActive: true });
  }
}
```

**Esfuerzo estimado:** 2-3 horas (crear base + migrar 10 repos)

---

### DUP-10 · Patrón CRUD del Service — Idéntico en 6+ archivos

**Importancia: 8/10**

Los services simples (Brand, Insurance, VehicleType, ServiceCatalog) son 100% pass-through:

```typescript
async findAll() { return await this.repo.findAll(); }
async findOne(id: string) { return await this.repo.findOne({ id }); }
async create(data: any) { return await this.repo.add(data); }
async update(id: string, data: any) { return await this.repo.update(id, data); }
async remove(id: string) { return await this.repo.remove({ id }); }
```

**Archivos afectados:** BrandService, InsuranceService, VehicleTypeService, ServiceCatalogService, y parcialmente InvoiceService, ServicePriceService.

**Remediación — Crear `BaseCrudService<T>`:**

```typescript
// src/Shared/BaseCrudService.ts
import { Repository } from './base.Repository.js';

export class BaseCrudService<T> {
  constructor(protected readonly repo: Repository<T>) {}

  async findAll(): Promise<T[]> {
    return this.repo.findAll();
  }
  async findOne(id: string): Promise<T | null> {
    return this.repo.findOne({ id });
  }
  async create(data: Partial<T>): Promise<T> {
    return this.repo.add(data);
  }
  async update(id: string, data: Partial<T>): Promise<T | null> {
    return this.repo.update(id, data);
  }
  async remove(id: string): Promise<boolean> {
    return this.repo.remove({ id });
  }
}
```

**Ejemplo — `BrandService` de 20 líneas → 6 líneas:**

```typescript
import { BaseCrudService } from '../../Shared/BaseCrudService.js';
import { Brand } from './Brand.Entity.js';

export class BrandService extends BaseCrudService<Brand> {}
```

**Esfuerzo estimado:** 1.5 horas

---

### DUP-11 · Patrón CRUD del Controller — Idéntico en 6+ archivos

**Importancia: 8/10**

Todos los controllers repiten la misma estructura:

```typescript
public findAll = catchAsync(async (_req: Request, res: Response) => {
  const items = await this.service.findAll();
  res.status(200).json({ data: items });
});

public findOne = catchAsync(async (req: Request, res: Response) => {
  const item = await this.service.findOne(req.params.id as string);
  if (!item) throw new AppError('...no encontrado', 404);
  res.status(200).json({ data: item });
});

public create = catchAsync(async (req: Request, res: Response) => {
  const item = await this.service.create(req.body);
  res.status(201).json({ message: '...creado', data: item });
});

// update, remove...
```

**Archivos afectados:** BrandController, InsuranceController, VehicleTypeController, ModelController, ServiceCatalogController, InvoiceController (parcial).

**Remediación — Crear `BaseCrudController<T>`:**

```typescript
// src/Shared/BaseCrudController.ts
import { Request, Response } from 'express';
import { catchAsync } from './utils/catchAsync.js';
import { AppError } from './utils/AppError.js';
import { BaseCrudService } from './BaseCrudService.js';

export class BaseCrudController<T> {
  constructor(
    protected readonly service: BaseCrudService<T>,
    protected readonly entityName: string,
  ) {}

  public findAll = catchAsync(async (_req: Request, res: Response) => {
    const items = await this.service.findAll();
    res.status(200).json({ data: items });
  });

  public findOne = catchAsync(async (req: Request, res: Response) => {
    const item = await this.service.findOne(req.params.id as string);
    if (!item) throw new AppError(`${this.entityName} no encontrado/a`, 404);
    res.status(200).json({ data: item });
  });

  public create = catchAsync(async (req: Request, res: Response) => {
    const item = await this.service.create(req.body);
    res
      .status(201)
      .json({ message: `${this.entityName} creado/a con éxito`, data: item });
  });

  public update = catchAsync(async (req: Request, res: Response) => {
    const item = await this.service.update(req.params.id as string, req.body);
    if (!item) throw new AppError(`${this.entityName} no encontrado/a`, 404);
    res.status(200).json({
      message: `${this.entityName} actualizado/a con éxito`,
      data: item,
    });
  });

  public remove = catchAsync(async (req: Request, res: Response) => {
    const deleted = await this.service.remove(req.params.id as string);
    if (!deleted) throw new AppError(`${this.entityName} no encontrado/a`, 404);
    res
      .status(200)
      .json({ message: `${this.entityName} eliminado/a con éxito` });
  });
}
```

**Esfuerzo estimado:** 1.5 horas

---

### DUP-12 · Patrón de Route — Boilerplate idéntico en 10+ archivos

**Importancia: 7/10**

Cada archivo `*.Route.ts` repite exactamente:

```typescript
import { Router } from 'express';
import { validateSchema } from '../Shared/middlewares/ValidateSchemas.js';
import { orm } from '../Shared/db/orm.js';
// imports de Controller, Repository, Service, Schemas...

export const router = Router();
const repo = new XRepository(orm.em);
const service = new XService(repo);
const controller = new XController(service);

router.get('/', controller.findAll);
router.get('/:id', validateSchema(idSchema), controller.findOne);
router.post('/', validateSchema(createSchema), controller.create);
router.put(
  '/:id',
  validateSchema(idSchema),
  validateSchema(updateSchema),
  controller.update,
);
router.patch(
  '/:id',
  validateSchema(idSchema),
  validateSchema(updateSchema),
  controller.update,
);
router.delete('/:id', validateSchema(idSchema), controller.remove);
```

**Archivos afectados:** Brand.Route, Insurance.Route, VehicleType.Route, Model.Route, ServiceCatalog.Route, Invoice.Route (parcial).

**Remediación — Factory de rutas CRUD:**

```typescript
// src/Shared/createCrudRouter.ts
import { Router } from 'express';
import { validateSchema } from './middlewares/ValidateSchemas.js';
import { ZodSchema } from 'zod';

interface CrudRouterConfig {
  controller: any;
  idSchema: ZodSchema;
  createSchema: ZodSchema;
  updateSchema: ZodSchema;
}

export function createCrudRouter(config: CrudRouterConfig): Router {
  const { controller, idSchema, createSchema, updateSchema } = config;
  const router = Router();

  router.get('/', controller.findAll);
  router.get('/:id', validateSchema(idSchema), controller.findOne);
  router.post('/', validateSchema(createSchema), controller.create);
  router.put(
    '/:id',
    validateSchema(idSchema),
    validateSchema(updateSchema),
    controller.update,
  );
  router.patch(
    '/:id',
    validateSchema(idSchema),
    validateSchema(updateSchema),
    controller.update,
  );
  router.delete('/:id', validateSchema(idSchema), controller.remove);

  return router;
}
```

**Esfuerzo estimado:** 1 hora

---

## 4. DUPLICACIÓN DE DATOS

---

### ✅ DUP-13 · Estados de reserva — Strings mágicos reemplazados por enum `ReservationStatus`

**Importancia: 7/10**

Los estados `'PENDIENTE'`, `'CONFIRMADA'`, `'EN CURSO'`, `'FINALIZADA'`, `'CANCELADA'` aparecen como strings literales en:

| Archivo                   | Cantidad de ocurrencias |
| ------------------------- | ----------------------- |
| Reservation.Repository.ts | 12                      |
| Reservation.Service.ts    | 8                       |
| ParkingSpace.Service.ts   | 2                       |
| Parking.Repository.ts     | 4                       |
| Parking.Service.ts        | 2                       |
| Reservation.Schema.ts     | 1 (enum en Zod)         |

**Remediación — Crear enum centralizado:**

```typescript
// src/Shared/constants/reservationStatus.ts
export enum ReservationStatus {
  PENDIENTE = 'PENDIENTE',
  CONFIRMADA = 'CONFIRMADA',
  EN_CURSO = 'EN CURSO',
  FINALIZADA = 'FINALIZADA',
  CANCELADA = 'CANCELADA',
}

export const ACTIVE_RESERVATION_STATUSES = [
  ReservationStatus.PENDIENTE,
  ReservationStatus.CONFIRMADA,
  ReservationStatus.EN_CURSO,
] as const;
```

**Esfuerzo estimado:** 30 minutos

---

### ✅ DUP-14 · Estados de usuario — Strings mágicos reemplazados por enum `UserStatus`/`UserType`

**Importancia: 6/10**

`'ACTIVO'`, `'BAJA'`, `'CLIENTE'`, `'DUEÑO'`, `'EMPLEADO'`, `'ADMINISTRADOR'` aparecen como literales en:
User.Service.ts, User.Repository.ts, User.Entity.ts, Reservation.Service.ts, Vehicle.Service.ts, Parking.Service.ts, EmployeeShift.Service.ts.

**Remediación:**

```typescript
// src/Shared/constants/userConstants.ts
export enum UserStatus {
  ACTIVO = 'ACTIVO',
  BAJA = 'BAJA',
}
export enum UserType {
  CLIENTE = 'CLIENTE',
  DUENO = 'DUEÑO',
  EMPLEADO = 'EMPLEADO',
  ADMINISTRADOR = 'ADMINISTRADOR',
}
```

**Esfuerzo estimado:** 25 minutos

---

### ✅ DUP-15 · `TimeRegex` duplicada — Reemplazada por `TIME_REGEX` en `validation.ts`

**Importancia: 4/10**

La regex `/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/` está definida en:

1. [`EmployeeShift.Schema.ts`](file:///c:/Users/Valentino/Documents/2026/Backend/src/EmployeeShift/EmployeeShift.Schema.ts#L15) L15
2. [`Parking.Schema.ts`](file:///c:/Users/Valentino/Documents/2026/Backend/src/Parking/Parking.Schema.ts#L3) L3

**Remediación:**

```typescript
// src/Shared/utils/validation.ts
export const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;
```

**Esfuerzo estimado:** 5 minutos

---

### DUP-16 · Entidades catálogo — Brand, Insurance, VehicleType idénticas

**Importancia: 5/10**

Estas 3 entidades tienen exactamente la misma estructura:

```typescript
@Entity()
export class X {
  @PrimaryKey({ type: 'string' })
  id: string = crypto.randomUUID();

  @Property({ type: 'string' })
  name!: string;

  @Property({ type: 'boolean', default: true })
  isActive?: boolean = true;
}
```

**Archivos:**

- [`Brand.Entity.ts`](file:///c:/Users/Valentino/Documents/2026/Backend/src/Vehicle/Brand/Brand.Entity.ts)
- [`Insurance.Entity.ts`](file:///c:/Users/Valentino/Documents/2026/Backend/src/Vehicle/Insurance/Insurance.Entity.ts)
- [`VehicleType.Entity.ts`](file:///c:/Users/Valentino/Documents/2026/Backend/src/Vehicle/VehicleType/VehicleType.Entity.ts)
- [`ServiceCatalog.Entity.ts`](file:///c:/Users/Valentino/Documents/2026/Backend/src/ServiceCatalog/ServiceCatalog.Entity.ts) (agrega `description`)

> ℹ️ Con MikroORM no se puede usar herencia de clase para entidades fácilmente sin configurar estrategias de herencia de tabla. Marcar como duplicación aceptable por restricciones del ORM.

**Remediación:** Duplicación aceptable en este caso dado las limitaciones de MikroORM. Alternativamente usar `@Entity({ discriminatorColumn: ... })` si algún día se consolidan.

**Esfuerzo estimado:** N/A (aceptable)

---

## 5. Hallazgos Adicionales (No duplicación, pero relacionados)

---

### ✅ EXTRA-01 · `addPublicUser` no usa `createUser` — **Refactorizado**

**Importancia: 7/10**

[`addPublicUser`](file:///c:/Users/Valentino/Documents/2026/Backend/src/User/User.Service.ts#L42-L56) (L42-56) duplica la lógica de [`createUser`](file:///c:/Users/Valentino/Documents/2026/Backend/src/User/User.Service.ts#L9-L19) (L9-19): verifica email, hashea password, excluye password del return. `addEmployee` (L58) sí usa `createUser`.

**Remediación — Refactorizar `addPublicUser` para usar `createUser`:**

```typescript
async addPublicUser(userData: Partial<User>): Promise<Omit<User, 'password'>> {
  if (userData.type === 'ADMINISTRADOR' || userData.type === 'EMPLEADO') {
    throw new AppError('No podés registrarte con ese tipo de usuario', 400);
  }
  return this.createUser(userData, { type: userData.type || 'CLIENTE' });
}
```

**Esfuerzo estimado:** 10 minutos

---

### ✅ EXTRA-02 · `addPublicUser` lanzaba `Error` en lugar de `AppError` — **Corregido**

**Importancia: 5/10**

En [`User.Service.ts` L44](file:///c:/Users/Valentino/Documents/2026/Backend/src/User/User.Service.ts#L44), se usa `throw new Error(...)` en lugar de `throw new AppError(...)`. Esto genera un 500 en lugar de un 409/400 apropiado.

```typescript
// ❌ Actual
if (existing) throw new Error('El email ya está registrado');
// ✅ Corrección
if (existing) throw new AppError('El email ya está registrado', 409);
```

---

### EXTRA-03 · Acceso directo a `(this.repo as any).em` — Anti-patrón de encapsulación

**Importancia: 6/10**

En [`Reservation.Service.ts`](file:///c:/Users/Valentino/Documents/2026/Backend/src/Reservation/Reservation.Service.ts#L103) L103, L162 y [`ParkingSpace.Service.ts`](file:///c:/Users/Valentino/Documents/2026/Backend/src/ParkingSpace/ParkingSpace.Service.ts#L86) L86, L109 se accede al `em` interno del repositorio con `(this.repo as any).em`. Esto rompe la abstracción del Repository pattern.

**Remediación:** Agregar métodos apropiados a los repositorios para estas queries.

---

## Resumen de Priorización

| #   | ID       | Importancia | Esfuerzo | Estado          | Impacto                                  |
| --- | -------- | ----------- | -------- | --------------- | ---------------------------------------- |
| 1   | DUP-09   | 10/10       | 2-3h     | 🔲 Pendiente    | Elimina ~400 líneas                      |
| 2   | DUP-01   | 9/10        | 30min    | ✅ Implementado | Elimina inconsistencias funcionales      |
| 3   | DUP-04   | 9/10        | 45min    | ✅ Implementado | Elimina bugs de inconsistencia           |
| 4   | DUP-10   | 8/10        | 1.5h     | 🔲 Pendiente    | Elimina ~120 líneas                      |
| 5   | DUP-11   | 8/10        | 1.5h     | 🔲 Pendiente    | Elimina ~200 líneas                      |
| 6   | DUP-05   | 8/10        | 30min    | ✅ Implementado | Centraliza lógica de negocio             |
| 7   | DUP-02   | 8/10        | 15min    | ✅ Implementado | Elimina copy-paste                       |
| 8   | DUP-13   | 7/10        | 30min    | ✅ Implementado | Type-safety en estados de reserva        |
| 9   | DUP-06   | 7/10        | 20min    | ✅ Implementado | Simplifica Parking.Service               |
| 10  | DUP-12   | 7/10        | 1h       | 🔲 Pendiente    | Reduce boilerplate de rutas              |
| 11  | EXTRA-01 | 7/10        | 10min    | ✅ Implementado | Elimina lógica duplicada en User.Service |
| 12  | DUP-07   | 6/10        | 20min    | ✅ Implementado | Elimina métodos redundantes              |
| 13  | DUP-14   | 6/10        | 25min    | ✅ Implementado | Type-safety en roles de usuario          |
| 14  | DUP-03   | 6/10        | 10min    | ✅ Implementado | Centraliza formateo                      |
| 15  | DUP-08   | 5/10        | 10min    | ✅ Implementado | Consistencia en manejo de errores        |
| 16  | EXTRA-02 | 5/10        | 5min     | ✅ Implementado | AppError correcto en registro público    |
| 17  | DUP-15   | 4/10        | 5min     | ✅ Implementado | Centraliza regex de tiempo               |

**Tiempo total estimado de refactorización restante:** ~8-10 horas

---

## Módulo de Utilidades Creado

Se han creado los siguientes archivos en `src/Shared/`:

| Archivo                                                                                                       | Propósito                                                                    |
| ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| [`utils/vehicleTypes.ts`](file:///c:/Users/Valentino/Documents/2026/Backend/src/Shared/utils/vehicleTypes.ts) | Clasificación y comparación de tipos de vehículo                             |
| [`utils/dateUtils.ts`](file:///c:/Users/Valentino/Documents/2026/Backend/src/Shared/utils/dateUtils.ts)       | Formateo de fechas (`formatTimeHHMM`)                                        |
| [`utils/validation.ts`](file:///c:/Users/Valentino/Documents/2026/Backend/src/Shared/utils/validation.ts)     | `TIME_REGEX` centralizada                                                    |
| [`utils/queryHelpers.ts`](file:///c:/Users/Valentino/Documents/2026/Backend/src/Shared/utils/queryHelpers.ts) | `overlapFilter()` para queries de solapamiento                               |
| [`constants/status.ts`](file:///c:/Users/Valentino/Documents/2026/Backend/src/Shared/constants/status.ts)     | `ReservationStatus`, `UserStatus`, `UserType`, `ACTIVE_RESERVATION_STATUSES` |
