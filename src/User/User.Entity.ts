import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { v4 } from 'uuid';
@Entity()
export class User {

  @PrimaryKey({ type: 'string' })
  id: string = v4();

  @Property({ type: 'number', unique: true })
  dni!: number;

  @Property({ type: 'string' })
  last_name!: string;

  @Property({ type: 'string' })
  name!: string;

  @Property({ type: 'date' })
  date_of_birth!: Date;

  @Property({ type: 'string', unique: true })
  email!: string;

  @Property({ type: 'string', unique: true })
  phone!: string;
  
  @Property({ type: 'string' })
  password!: string;

  @Property({ type: 'string' })
  file!: string;
 /* 
  @Property({ type: 'date' })
  createdAt: Date = new Date();

  @Property({ type: 'date', onUpdate: () => new Date() })
  updatedAt: Date = new Date();
*/

  }


