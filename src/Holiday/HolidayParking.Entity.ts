import { Entity, PrimaryKey, ManyToOne, Unique } from '@mikro-orm/decorators/legacy';
import { Rel } from '@mikro-orm/core';
import crypto from "node:crypto";

import { Parking } from '../Parking/Parking.Entity.js';
import { Holiday } from './Holiday.Entity.js';

// Existe solo si la sucursal abre ese feriado: por defecto cierra (R-10, D-01).
@Entity()
@Unique({ properties: ['holiday', 'parking'] })
export class HolidayParking {
  @PrimaryKey({ type: 'string' })
  id: string = crypto.randomUUID();

  @ManyToOne(() => Holiday)
  holiday!: Rel<Holiday>;

  @ManyToOne(() => Parking)
  parking!: Rel<Parking>;
}
