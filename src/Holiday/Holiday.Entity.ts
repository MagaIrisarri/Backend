import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import crypto from "node:crypto";

// Lista general del dueño de feriados (R-10, D-05).
@Entity()
export class Holiday {
  @PrimaryKey({ type: 'string' })
  id: string = crypto.randomUUID();

  @Property({ type: 'string', length: 10, unique: true })
  date!: string; // YYYY-MM-DD

  @Property({ type: 'string' })
  name!: string;

  @Property({ type: 'string', default: 'manual' })
  origin: 'oficial' | 'manual' = 'manual';
}
