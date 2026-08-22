import {Entity,PrimaryKey,Property,ManyToOne,Enum} from '@mikro-orm/decorators/legacy';
import { Rel } from '@mikro-orm/core';
import crypto from 'node:crypto';

import { User } from '../User/User.Entity.js';
import { Parking } from '../Parking/Parking.Entity.js';

export enum DayOfWeek {
  MONDAY = 'LUNES',
  TUESDAY = 'MARTES',
  WEDNESDAY = 'MIERCOLES',
  THURSDAY = 'JUEVES',
  FRIDAY = 'VIERNES',
  SATURDAY = 'SABADO',
  SUNDAY = 'DOMINGO',
}

@Entity()
export class EmployeeShift {
  @PrimaryKey({ type: 'string' })
  id: string = crypto.randomUUID();

  @Enum(() => DayOfWeek)
  dayOfWeek!: DayOfWeek;

  @Property({ type: 'time' })
  startTime!: string;

  @Property({ type: 'time' })
  endTime!: string;

  @Property({ type: 'boolean', default: true })
  isActive: boolean = true;

  @ManyToOne(() => User)
  employee!: Rel<User>;

  @ManyToOne(() => Parking)
  parking!: Rel<Parking>;

  @Property({ onCreate: () => new Date() })
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}