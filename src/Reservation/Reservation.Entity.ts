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

  // Cuándo se hizo la reserva (orden de "Mis reservas"). Nulo solo en las anteriores a la columna, hasta que la siembra las completa.
  @Property({ type: 'datetime', nullable: true })
  createdAt?: Date | null = new Date();

  @ManyToOne(() => Vehicle, { eager: true })
  vehicle!: Rel<Vehicle>;

  @ManyToOne(() => ParkingSpace, { eager: true })
  parkingSpace!: Rel<ParkingSpace>;

  @ManyToOne(() => User, { nullable: true, eager: true })
  attendedBy?: Rel<User> | null;

  // Quién registró el ingreso y quién la salida: pueden ser empleados de turnos distintos.
  @ManyToOne(() => User, { nullable: true, eager: true })
  checkedInBy?: Rel<User> | null;

  @ManyToOne(() => User, { nullable: true, eager: true })
  checkedOutBy?: Rel<User> | null;

  // Hora real de la salida; endTime se pisa con ella al registrarla, así que acá queda también para el resumen.
  @Property({ type: 'datetime', nullable: true })
  checkedOutAt?: Date | null;

  // Cliente de mostrador: a quién avisar si no es el titular del vehículo.
  @Property({ type: 'string', nullable: true })
  contactName?: string | null;

  @Property({ type: 'string', nullable: true })
  contactPhone?: string | null;

  // Motivo que da el personal al cancelar (le llega al cliente); vacío si canceló el cliente o el sistema (R-17).
  @Property({ type: 'string', length: 300, nullable: true })
  cancelReason?: string | null;

  // R-27: valoración opcional (1 a 5) que el cliente deja en una reserva finalizada (valoracion_servicio del DER).
  @Property({ type: 'integer', nullable: true })
  rating?: number | null;

  // R-28: cuándo se mandó el recordatorio; vacío mientras no se mandó.
  @Property({ type: 'datetime', nullable: true })
  reminderSentAt?: Date | null;

  @ManyToMany(() => ServicePrice)
  services = new Collection<ServicePrice>(this);

  // L-43: precio por hora vigente al reservar (como la factura): la salida cobra este aunque el dueño cambie la tarifa después.
  // Nulo en las reservas anteriores a la columna, que cobran la vigente al salir (findForCheckout).
  @Property({ type: 'decimal', nullable: true })
  hourlyRate?: number | null;
}