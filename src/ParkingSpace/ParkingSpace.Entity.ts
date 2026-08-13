import { Rel } from "@mikro-orm/core";
import { Entity, ManyToOne, PrimaryKey, Property } from "@mikro-orm/decorators/legacy";
import crypto from "node:crypto";
import { Parking } from "../Parking/Parking.Entity.js";

@Entity()
export class ParkingSpace {

  @PrimaryKey()
  id: string = crypto.randomUUID();

  @Property({ type: 'string', nullable: false })
  spaceCode!: string;

  @Property({ type: 'string', nullable: false })
  state!: string;

  @Property({ type: 'string', nullable: false})
  vehicleType!: string;

  @ManyToOne(() => Parking, { eager: true })
  parking!: Rel<Parking>;

}