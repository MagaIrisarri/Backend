import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import crypto from "node:crypto";

// R-29: respuesta (403) a quien todavía tiene el DNI como contraseña e intenta cargar un vehículo o reservar.
export const MUST_CHANGE_PASSWORD = 'Tenés una contraseña temporal (tu DNI, si la cuenta se creó en el mostrador): cambiala desde tu perfil para registrar vehículos y reservar';


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

  // Nacimiento y teléfono quedan vacíos en el cliente que da de alta el mostrador (R-29) hasta que los completa él.
  @Property({ type: 'date', nullable: true })
  date_of_birth?: Date | null;

  @Property({ type: 'string', unique: true, nullable: true })
  phone?: string | null;
  
  // hidden: nunca se serializa a JSON (tampoco anidado en reservas, vehículos o sucursales); el login la sigue leyendo.
  @Property({ type: 'string', hidden: true })
  password!: string;

  // R-29: cuenta creada en el mostrador con el DNI como contraseña. Hasta cambiarla no registra vehículos ni reserva.
  @Property({ type: 'boolean', default: false })
  mustChangePassword?: boolean = false;

  @Property({ type: 'string', default: 'CLIENTE' })
  type!: string; // 'CLIENTE', 'DUEÑO', 'EMPLEADO', 'ADMIN'
   
  @Property({ type: 'string', default: 'ACTIVO' })
  status!: string; // 'ACTIVO', 'BAJA'

  @Property({ type: 'string', nullable: true })
  ownerId?: string;

  // Solo empleados: sucursal donde trabaja
  @Property({ type: 'string', nullable: true })
  parkingId?: string;

  // Datos fiscales del dueño (los carga en su perfil). El CUIT se guarda con guiones: 30-12345678-9.
  @Property({ type: 'string', nullable: true })
  businessName?: string | null;

  @Property({ type: 'string', nullable: true })
  cuit?: string | null;

  @Property({ type: 'string', nullable: true })
  vatCondition?: string | null;

  @Property({ type: 'string', nullable: true })
  fiscalAddress?: string | null;

  // Tipos de aviso que el usuario apagó (solo los de MUTABLE_NOTIFICATIONS); NotificationService.notify los saltea.
  @Property({ type: 'json', nullable: true })
  mutedNotifications?: string[] | null = [];

  // Alta y última modificación. Nullable: los usuarios que ya existían quedan sin fecha de alta (null) al actualizar el esquema.
  @Property({ type: 'datetime', nullable: true })
  createdAt?: Date | null = new Date();

  @Property({ type: 'datetime', nullable: true, onUpdate: () => new Date() })
  updatedAt?: Date | null = new Date();
}
