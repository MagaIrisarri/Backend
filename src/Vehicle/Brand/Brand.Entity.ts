import { Entity, PrimaryKey, Property } from "@mikro-orm/decorators/legacy";
import { v4 } from 'uuid';
@Entity()
export class Brand {
  @PrimaryKey({ type: 'string' })
  id: string = v4();

  @Property({ type: 'string' })
  name!: string; 
}