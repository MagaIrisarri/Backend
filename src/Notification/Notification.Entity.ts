import { Entity, PrimaryKey, Property, ManyToOne, Index } from '@mikro-orm/decorators/legacy';
import { Rel } from '@mikro-orm/core';
import crypto from "node:crypto";
import { User } from '../User/User.Entity.js';

// Aviso dentro de la aplicación para un usuario; se lee con polling (GET /api/notifications).
@Entity()
@Index({ properties: ['recipient', 'readAt'] })
@Index({ properties: ['recipient', 'createdAt'] }) // L-31: la ventana de días y la paginación van por fecha
export class Notification {
  @PrimaryKey({ type: 'string' })
  id: string = crypto.randomUUID();

  @ManyToOne(() => User)
  recipient!: Rel<User>;

  @Property({ type: 'string' })
  type!: string; // NotificationType

  @Property({ type: 'string' })
  title!: string;

  @Property({ type: 'string', length: 500 })
  message!: string;

  @Property({ type: 'string', nullable: true })
  reservationId?: string | null;

  // Avisos de una sucursal sin reserva (SUCURSAL_LLENA, SUCURSAL_PAUSADA): al tocarlos, el panel abre esa sucursal.
  @Property({ type: 'string', nullable: true })
  parkingId?: string | null;

  @Property({ type: 'datetime' })
  createdAt?: Date = new Date();

  // Vacío mientras no se leyó.
  @Property({ type: 'datetime', nullable: true })
  readAt?: Date | null;
}
