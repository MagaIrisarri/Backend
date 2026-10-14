import { Entity, PrimaryKey, Property, ManyToOne, Enum } from "@mikro-orm/decorators/legacy";
import { Rel } from "@mikro-orm/core";
import crypto from "node:crypto";
import { Parking } from "../Parking/Parking.Entity.js";
import { VehicleType } from "../Vehicle/VehicleType/VehicleType.Entity.js";

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
  spaceCode!: string; // Ej: "A-01", "M-05", "UTI-02" (spacePrefix)

  // R-30: la plaza admite un tipo de vehículo; un vehículo solo usa las plazas de su tipo.
  @ManyToOne(() => VehicleType, { eager: true })
  vehicleType!: Rel<VehicleType>;

  @Enum({ items: () => SpaceState, default: SpaceState.LIBRE })
  state: SpaceState = SpaceState.LIBRE;

  @Property({ type: 'boolean', default: true })
  isActive: boolean = true;

  @ManyToOne(() => Parking)
  parking!: Rel<Parking>;
}
