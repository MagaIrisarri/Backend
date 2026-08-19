import { Entity, PrimaryKey, Property, ManyToOne } from '@mikro-orm/decorators/legacy';
import { v4 } from 'uuid';
import { Brand } from './Brand/Brand.Entity.js';
import { Model } from './Model/Model.Entity.js';
import { VehicleType } from './VehicleType/VehicleType.Entity.js';
import { Insurance } from './Insurance/Insurance.Entity.js';

@Entity()
export class Vehicle {
  @PrimaryKey({ type: 'string' })
  id: string = v4();

  @Property({ type: 'string', unique: true })
  plate!: string;

  @Property({ type: 'string', nullable: true })
  color?: string;

  @Property({ type: 'integer', nullable: true })
  year?: number;

  @Property({ type: 'string', nullable: true })
  observations?: string;
  
  @Property({ type: 'boolean' })
  isActive: boolean = true;
  
  @ManyToOne(() => Brand)
  brand!: Brand;

  @ManyToOne(() => Model)
  model!: Model;

  @ManyToOne(() => VehicleType)
  vehicleType!: VehicleType;
  
  @ManyToOne(() => Insurance, { nullable: true })
  insurance?: Insurance;

  @Property({ type: 'date' })
  createdAt: Date = new Date();

  @Property({ type: 'date', onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}