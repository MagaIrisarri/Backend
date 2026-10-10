import { Entity, PrimaryKey, Property, ManyToOne, Unique } from '@mikro-orm/decorators/legacy';
import { Rel } from '@mikro-orm/core';
import crypto from "node:crypto";

import { Parking } from '../Parking/Parking.Entity.js';
import type { DayShift, DayClosure } from './Schedule.js';

// Copia completa del día (D-02): reemplaza a la semana tipo en esa fecha.
// shortcut: L-11, el día es una copia y no sigue cambios posteriores de la semana tipo, pasar a diferencias si el dueño lo pide
@Entity()
@Unique({ properties: ['parking', 'date'] })
export class DayException {
  @PrimaryKey({ type: 'string' })
  id: string = crypto.randomUUID();

  @Property({ type: 'string', length: 10 })
  date!: string; // YYYY-MM-DD en la zona de la sucursal

  @Property({ type: 'json' })
  shifts: DayShift[] = [];

  @Property({ type: 'json' })
  closures: DayClosure[] = [];

  @ManyToOne(() => Parking)
  parking!: Rel<Parking>;
}
