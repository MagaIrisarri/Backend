import { Entity, PrimaryKey, Property, ManyToOne, Enum, BeforeCreate, BeforeUpdate } from "@mikro-orm/decorators/legacy";
import { Rel } from "@mikro-orm/core";
import crypto from "node:crypto";
import { Parking } from "../Parking/Parking.Entity.js";
import { categorizeVehicleType } from "../Shared/utils/vehicleTypes.js";

export enum SpaceState {
  LIBRE = "LIBRE",
  OCUPADO = "OCUPADO",
  MANTENIMIENTO = "MANTENIMIENTO",
}

@Entity()
export class ParkingSpace {
  @PrimaryKey({ type: 'string' })
  id: string = crypto.randomUUID();

  @Property({ type: 'string' })
  spaceCode!: string; // Ej: "A-01", "M-05"

  @Property({ type: 'string' })
  vehicleType!: string; // siempre la categoría: 'AUTO', 'MOTO' o 'CAMIONETA' (ver normalizeVehicleType)

  @Enum({ items: () => SpaceState, default: SpaceState.LIBRE })
  state: SpaceState = SpaceState.LIBRE;

  @Property({ type: 'boolean', default: true })
  isActive: boolean = true;

  @ManyToOne(() => Parking)
  parking!: Rel<Parking>;

  // Llegue "Moto", "MOTOCICLETA" o "Camioneta", se guarda la categoría: así todas las plazas usan el mismo texto.
  @BeforeCreate()
  @BeforeUpdate()
  normalizeVehicleType() {
    this.vehicleType = categorizeVehicleType(this.vehicleType);
  }
}