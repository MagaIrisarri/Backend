import { Rel } from "@mikro-orm/core";
import { Entity, ManyToOne, PrimaryKey, Property } from "@mikro-orm/decorators/legacy";
import crypto from "node:crypto";
import { Parking } from "../Parking/Parking.Entity.js";

@Entity()
export class ParkingPrice {

  @PrimaryKey()
  id: string = crypto.randomUUID();

  @Property({ type: 'string', nullable: false })
  vehicleType!: string;

  @Property({ type: 'decimal', nullable: false })
  price!: number;

  @Property({ type: 'date', nullable: true })
  expirationDate!: Date | null;

  @ManyToOne(() => Parking, { eager: true })
  parking!: Rel<Parking>; 

}