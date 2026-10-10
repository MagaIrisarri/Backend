import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import crypto from "node:crypto";


@Entity()
export class User {
  @PrimaryKey({ type: 'string' })
  id: string = crypto.randomUUID();

  @Property({ type: 'string', unique: true })
  dni!: string;

  @Property({ type: 'string' })
  name!: string;

  @Property({ type: 'string' })
  last_name!: string;

  @Property({ type: 'string', unique: true })
  email!: string;

  @Property({ type: 'date' })
  date_of_birth!: Date;

  @Property({ type: 'string', unique: true })
  phone!: string;
  
  // hidden: nunca se serializa a JSON (tampoco anidado en reservas, vehículos o sucursales); el login la sigue leyendo.
  @Property({ type: 'string', hidden: true })
  password!: string;

  @Property({ type: 'string', default: 'CLIENTE' })
  type!: string; // 'CLIENTE', 'DUEÑO', 'EMPLEADO', 'ADMIN'
   
  @Property({ type: 'string', default: 'ACTIVO' })
  status!: string; // 'ACTIVO', 'BAJA'

  @Property({ type: 'string', nullable: true })
  ownerId?: string;

  // Solo empleados: sucursal donde trabaja
  @Property({ type: 'string', nullable: true })
  parkingId?: string;
}
