import { Entity, PrimaryKey, Property } from "@mikro-orm/decorators/legacy";
import crypto from "node:crypto";

@Entity()
export class VehicleType {
  @PrimaryKey({ type: 'string' })
  id: string = crypto.randomUUID(); 

  @Property({ type: 'string' })
  name!: string;

  @Property({ type: 'boolean', default: true })
  isActive?: boolean = true;
}