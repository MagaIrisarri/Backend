import { Entity, PrimaryKey, Property, OneToOne } from '@mikro-orm/decorators/legacy';
import { Rel } from '@mikro-orm/core'
import crypto from "node:crypto";
import { Reservation } from "../Reservation/Reservation.Entity.js";
import { LocalDateType } from '../Shared/db/LocalDateType.js';

@Entity()
export class Invoice {
  @PrimaryKey({ type: 'string' })
  id: string = crypto.randomUUID();

  // datetime y no date: una columna date se lee como 'YYYY-MM-DD' (string) y rechaza el Date que asigna el pago.
  @Property({ type: 'datetime', nullable: true })
  paymentDate?: Date | null;

  @Property({ type: 'string' })
  paymentMethod!: string; 

  @Property({ type: 'decimal' })
  totalAmount!: number;

  // Detalle del cobro al hacer el check-out (R-14): total = (reservedHours + extraHours) × hourlyRate + servicesAmount.
  // Nulos en las facturas anteriores a este detalle.
  @Property({ type: 'integer', nullable: true })
  reservedHours?: number | null;

  @Property({ type: 'integer', nullable: true })
  extraHours?: number | null;

  @Property({ type: 'decimal', nullable: true })
  hourlyRate?: number | null; // tarifa vigente en el momento del cobro

  @Property({ type: 'decimal', nullable: true })
  servicesAmount?: number | null;

  @Property({ type: 'string', default: 'PENDIENTE' })
  status?: string = 'PENDIENTE'; 

  @Property({ type: LocalDateType })
  createdAt?: Date = new Date();

  @OneToOne(() => Reservation, { owner: true, eager: true })
  reservation!: Rel<Reservation>;
}