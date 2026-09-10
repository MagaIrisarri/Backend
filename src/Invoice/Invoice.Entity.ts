import { Entity, PrimaryKey, Property, OneToOne } from '@mikro-orm/decorators/legacy';
import { Rel } from '@mikro-orm/core'
import crypto from "node:crypto";
import { Reservation } from "../Reservation/Reservation.Entity.js";

@Entity()
export class Invoice {
  @PrimaryKey({ type: 'string' })
  id: string = crypto.randomUUID();

  @Property({ type: 'date', nullable: true })
  paymentDate?: Date | null;

  @Property({ type: 'string' })
  paymentMethod!: string; 

  @Property({ type: 'decimal' })
  totalAmount!: number;

  @Property({ type: 'string', default: 'PENDIENTE' })
  status?: string = 'PENDIENTE'; 

  @Property({ type: 'date' })
  createdAt?: Date = new Date();

  @OneToOne(() => Reservation, { owner: true, eager: true })
  reservation!: Rel<Reservation>;
}