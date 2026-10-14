import { Entity, PrimaryKey, ManyToOne, Unique } from '@mikro-orm/decorators/legacy';
import { Rel } from '@mikro-orm/core';
import crypto from "node:crypto";

import { Parking } from '../Parking/Parking.Entity.js';
import { Holiday } from './Holiday.Entity.js';

// Existe solo si la sucursal se adhiere al feriado y cierra ese día: por defecto trabaja (R-10, D-09).
// Reemplaza a HolidayParking ("abre"), que tenía la semántica invertida; su tabla vieja queda sin uso.
@Entity()
@Unique({ properties: ['holiday', 'parking'] })
export class HolidayAdhesion {
  @PrimaryKey({ type: 'string' })
  id: string = crypto.randomUUID();

  @ManyToOne(() => Holiday)
  holiday!: Rel<Holiday>;

  @ManyToOne(() => Parking)
  parking!: Rel<Parking>;
}
