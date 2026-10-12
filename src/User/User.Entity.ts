import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import crypto from "node:crypto";


@Entity()
export class User {
  @PrimaryKey({ type: 'string' })
  id: string = crypto.randomUUID();

  // dni, email, date_of_birth y password son nulos solo en el cliente de mostrador (guest).
  @Property({ type: 'string', unique: true, nullable: true })
  dni?: string | null;

  @Property({ type: 'string' })
  name!: string;

  @Property({ type: 'string' })
  last_name!: string;

  @Property({ type: 'string', unique: true, nullable: true })
  email?: string | null;

  @Property({ type: 'date', nullable: true })
  date_of_birth?: Date | null;

  @Property({ type: 'string', unique: true })
  phone!: string;
  
  // hidden: nunca se serializa a JSON (tampoco anidado en reservas, vehículos o sucursales); el login la sigue leyendo.
  @Property({ type: 'string', hidden: true, nullable: true })
  password?: string | null;

  // Cliente que dejó sus datos en el mostrador sin crear cuenta.
  @Property({ type: 'boolean', default: false })
  guest?: boolean = false;

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
