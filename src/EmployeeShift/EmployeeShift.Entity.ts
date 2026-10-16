import { Entity, PrimaryKey, Property, ManyToOne, Enum } from '@mikro-orm/decorators/legacy';
import { Rel } from '@mikro-orm/core';
import crypto from "node:crypto";

import { User } from '../User/User.Entity.js';
import { Parking } from '../Parking/Parking.Entity.js';
import { LocalDateType } from '../Shared/db/LocalDateType.js';

export enum DayOfWeek {
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
  SUNDAY = 'SUNDAY',
}

@Entity()
export class EmployeeShift {
  @PrimaryKey({ type: 'string' })
  id: string = crypto.randomUUID();

  @Enum(() => DayOfWeek)
  dayOfWeek!: DayOfWeek;

  @Property({ type: 'string' })
  startTime!: string;

  @Property({ type: 'string' })
  endTime!: string;

  @Property({ type: 'boolean', default: true })
  isActive?: boolean = true;

  // L-01: vigencia de la fila en la semana tipo, [validFrom, validTo). Sin validFrom vale desde siempre (las anteriores a la vigencia).
  @Property({ type: LocalDateType, nullable: true })
  validFrom?: string | null = null;

  @Property({ type: LocalDateType, nullable: true })
  validTo?: string | null = null;

  @ManyToOne(() => User, { eager: true })
  employee!: Rel<User>;

  @ManyToOne(() => Parking, { eager: true })
  parking!: Rel<Parking>;
}