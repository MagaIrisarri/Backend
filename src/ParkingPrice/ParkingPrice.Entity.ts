import { Entity, ManyToOne, PrimaryKey, Property } from "@mikro-orm/decorators/legacy";
import { Rel } from "@mikro-orm/core";
import { Parking } from "../Parking/Parking.Entity.js";
import crypto from "node:crypto";

@Entity()
export class ParkingPrice {
  @PrimaryKey({ type: 'string' })
  id: string = crypto.randomUUID();

  @Property({ type: 'string', nullable: false })
  vehicleType!: string;

  @Property({ type: 'decimal', nullable: false })
  price!: number;

  @Property({ type: 'date', nullable: true })
  expirationDate?: Date | null = null;

  @Property({ type: 'date' })
  startDate?: Date = new Date();

  @ManyToOne(() => Parking, { eager: true })
  parking!: Rel<Parking>;
}