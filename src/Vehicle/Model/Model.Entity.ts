import { Entity, PrimaryKey, Property, ManyToOne } from "@mikro-orm/decorators/legacy";
import { Brand } from '../Brand/Brand.Entity.js';
import { VehicleType } from '../VehicleType/VehicleType.Entity.js';
import { v4 } from 'uuid';

@Entity()
export class Model {
  @PrimaryKey({ type: 'string' })
  id: string = v4();

  @Property({ type: 'string' })
  name!: string; 

  @ManyToOne(() => Brand)
  brand!: Brand;

  @ManyToOne(() => VehicleType)
  vehicleType!: VehicleType;
}