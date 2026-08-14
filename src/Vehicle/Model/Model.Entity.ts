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

  // Relación: Muchos modelos pertenecen a UNA marca
  @ManyToOne(() => Brand)
  brand!: Brand;

  // Relación: Muchos modelos son de UN tipo de vehículo
  @ManyToOne(() => VehicleType)
  vehicleType!: VehicleType;
}