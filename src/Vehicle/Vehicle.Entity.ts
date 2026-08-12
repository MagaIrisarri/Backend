import { Entity, PrimaryKey, Property } from "@mikro-orm/decorators/legacy";
import crypto from "node:crypto";

@Entity()
export class Vehicle {

  @PrimaryKey()
  id: string = crypto.randomUUID();

  @Property({ type: 'string', nullable: false })
  patente!: string;

  @Property({ type: 'string', nullable: false })
  marca!: string;

  @Property({ type: 'string', nullable: false })
  modelo!: string;

  @Property({ type: 'string', nullable: false })
  seguro!: string;

  @Property({ type: 'string', nullable: false })
  id_tipoVehiculo!: string;

  toJSON() {
    return {
      id: this.id,
      patente: this.patente,
      marca: this.marca,
      modelo: this.modelo,
      seguro: this.seguro,
      id_tipoVehiculo: this.id_tipoVehiculo,
    };
  }
}