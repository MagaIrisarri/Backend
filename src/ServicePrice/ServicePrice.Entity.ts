import { Rel } from "@mikro-orm/core";
import { Entity, ManyToOne, PrimaryKey, Property } from "@mikro-orm/decorators/legacy";
import crypto from "node:crypto";
import { ServiceCatalog } from "../ServiceCatalog/ServiceCatalog.Entity.js";
import { Parking } from "../Parking/Parking.Entity.js";

@Entity()
export class ServicePrice {
  @PrimaryKey({ type: 'string' })
  id: string = crypto.randomUUID();

  @Property({ type: 'decimal' })
  price!: number;

  @Property({ type: 'date', nullable: true })
  expirationDate?: Date | null = null;

  @Property({ type: 'date' })
  startDate?: Date = new Date();

  @ManyToOne(() => ServiceCatalog, { eager: true })
  serviceCatalog!: Rel<ServiceCatalog>;

  @ManyToOne(() => Parking, { eager: true })
  parking!: Rel<Parking>;
}