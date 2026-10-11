import { Entity, PrimaryKey, Property, ManyToOne, ManyToMany} from '@mikro-orm/decorators/legacy';
import { Rel, Collection } from '@mikro-orm/core';
import crypto from "node:crypto";
import { Vehicle } from '../Vehicle/Vehicle.Entity.js';
import { ParkingSpace } from '../ParkingSpace/ParkingSpace.Entity.js';
import { User } from '../User/User.Entity.js';
import { ServicePrice } from '../ServicePrice/ServicePrice.Entity.js';

// R-26: código que ve la gente (cod_reserva del DER), sacado del id.
export const reservationCode = (id: string) => 'R-' + id.slice(0, 6).toUpperCase();

@Entity()
export class Reservation {
  @PrimaryKey({ type: 'string' })
  id: string = crypto.randomUUID();

  // Nulo solo en reservas anteriores a R-26, hasta que fillMissingCodes las completa al arrancar.
  @Property({ type: 'string', unique: true, nullable: true })
  code?: string = reservationCode(this.id);

  @Property({ type: 'datetime' })
  startTime!: Date;

  @Property({ type: 'datetime' })
  endTime!: Date;

  @Property({ type: 'string', default: 'PENDIENTE' })
  status?: string = 'PENDIENTE'; 

  @ManyToOne(() => Vehicle, { eager: true })
  vehicle!: Rel<Vehicle>;

  @ManyToOne(() => ParkingSpace, { eager: true })
  parkingSpace!: Rel<ParkingSpace>;

  @ManyToOne(() => User, { nullable: true, eager: true })
  attendedBy?: Rel<User> | null;

  // R-27: valoración opcional (1 a 5) que el cliente deja en una reserva finalizada (valoracion_servicio del DER).
  @Property({ type: 'integer', nullable: true })
  rating?: number | null;

  // R-28: cuándo se mandó el recordatorio por email; vacío mientras no se mandó.
  @Property({ type: 'datetime', nullable: true })
  reminderSentAt?: Date | null;

  @ManyToMany(() => ServicePrice)
  services = new Collection<ServicePrice>(this);
}