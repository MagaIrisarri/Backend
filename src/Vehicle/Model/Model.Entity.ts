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

  // Descripción del tipo de automotor en el CSV del DNRPA ("PICK-UP CABINA DOBLE"). La tabla DnrpaTypeMap
  // dice a qué tipo va cada descripción (RA-26). Nullable por los modelos cargados antes: la próxima importación la completa.
  @Property({ type: 'string', nullable: true })
  dnrpaDescription?: string | null;
}