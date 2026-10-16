import { Entity, PrimaryKey, Property, ManyToOne, Enum } from '@mikro-orm/decorators/legacy';
import { Rel } from '@mikro-orm/core';
import crypto from "node:crypto";

import { Parking } from '../Parking/Parking.Entity.js';
import { DayOfWeek } from './EmployeeShift.Entity.js';
import { LocalDateType } from '../Shared/db/LocalDateType.js';

// Cierre semanal recurrente de la semana tipo (R-05).
@Entity()
export class ShiftClosure {
  @PrimaryKey({ type: 'string' })
  id: string = crypto.randomUUID();

  @Enum(() => DayOfWeek)
  dayOfWeek!: DayOfWeek;

  @Property({ type: 'string' })
  startTime!: string;

  @Property({ type: 'string' })
  endTime!: string;

  // L-01: vigencia, [validFrom, validTo); sin validTo es el vigente. Igual que EmployeeShift.
  @Property({ type: LocalDateType, nullable: true })
  validFrom?: string | null = null;

  @Property({ type: LocalDateType, nullable: true })
  validTo?: string | null = null;

  @ManyToOne(() => Parking)
  parking!: Rel<Parking>;
}
