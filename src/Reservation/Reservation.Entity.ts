import { Entity, PrimaryKey, Property, ManyToOne} from '@mikro-orm/decorators/legacy';
import { Rel } from '@mikro-orm/core';
import crypto from "node:crypto";
import { Vehicle } from '../Vehicle/Vehicle.Entity.js';
import { ParkingSpace } from '../ParkingSpace/ParkingSpace.Entity.js';
import { User } from '../User/User.Entity.js';

@Entity()
export class Reservation {
  @PrimaryKey({ type: 'string' })
  id: string = crypto.randomUUID();

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
}