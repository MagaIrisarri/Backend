import { Entity, ManyToOne, PrimaryKey, Property } from "@mikro-orm/decorators/legacy";
import { Rel } from "@mikro-orm/core";
import crypto from "node:crypto";
import { VehicleType } from "../VehicleType/VehicleType.Entity.js";

// RA-26: a qué tipo de vehículo van los modelos de cada descripción del DNRPA ("PICK-UP CABINA DOBLE" → Pick-up).
// Se configura una vez: las importaciones siguientes la usan y solo preguntan por las descripciones nuevas.
@Entity()
export class DnrpaTypeMap {
  @PrimaryKey({ type: 'string' })
  id: string = crypto.randomUUID();

  // descKey de la descripción: sin mayúsculas, tildes, guiones ni espacios.
  @Property({ type: 'string', unique: true })
  descriptionKey!: string;

  // La descripción como vino en el archivo, para mostrarla.
  @Property({ type: 'string' })
  description!: string;

  @ManyToOne(() => VehicleType, { eager: true })
  vehicleType!: Rel<VehicleType>;
}
