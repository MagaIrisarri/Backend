import { Entity, ManyToOne, PrimaryKey, Property } from "@mikro-orm/decorators/legacy";
import { Rel } from "@mikro-orm/core";
import { Parking } from "../Parking/Parking.Entity.js";
import { VehicleType } from "../Vehicle/VehicleType/VehicleType.Entity.js";
import crypto from "node:crypto";
import { LocalDateType } from '../Shared/db/LocalDateType.js';

@Entity()
export class ParkingPrice {
  @PrimaryKey({ type: 'string' })
  id: string = crypto.randomUUID();

  // R-30: precio por hora de un tipo de vehículo en esta cochera.
  @ManyToOne(() => VehicleType, { eager: true })
  vehicleType!: Rel<VehicleType>;

  @Property({ type: 'decimal', nullable: false })
  price!: number;

  @Property({ type: LocalDateType, nullable: true })
  expirationDate?: Date | null = null;

  @Property({ type: LocalDateType })
  startDate?: Date = new Date();

  @ManyToOne(() => Parking, { eager: true })
  parking!: Rel<Parking>;
}
