import { Entity, ManyToOne, PrimaryKey, Property, Unique } from '@mikro-orm/decorators/legacy';
import { Rel } from '@mikro-orm/core';
import crypto from "node:crypto";

import { User } from '../User/User.Entity.js';

// Feriados (R-10): los nacionales los carga el administrador (owner null) y cada dueño suma los propios, que solo ve él.
// Un feriado por fecha visible para cada dueño: lo garantiza HolidayService (los NULL no chocan en el índice).
@Entity()
@Unique({ properties: ['date', 'owner'] })
export class Holiday {
  @PrimaryKey({ type: 'string' })
  id: string = crypto.randomUUID();

  @Property({ type: 'string', length: 10 })
  date!: string; // YYYY-MM-DD

  @Property({ type: 'string' })
  name!: string;

  @Property({ type: 'string', default: 'manual' })
  origin: 'oficial' | 'manual' = 'manual';

  @ManyToOne(() => User, { nullable: true })
  owner?: Rel<User> | null;
}
