import { Entity, PrimaryKey, Property, ManyToOne } from "@mikro-orm/decorators/legacy";
import { Brand } from '../Brand/Brand.Entity.js';
import { VehicleType } from '../VehicleType/VehicleType.Entity.js';
import crypto from "node:crypto";

@Entity()
export class Model {
  @PrimaryKey({ type: 'string' })
  id: string = crypto.randomUUID();

  @Property({ type: 'string' })
  name!: string; 

  @Property({ type: 'boolean', default: true })
  isActive?: boolean = true;

  @ManyToOne(() => Brand)
  brand!: Brand;

  @ManyToOne(() => VehicleType)
  vehicleType!: VehicleType;
}