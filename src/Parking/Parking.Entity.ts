import { Cascade, Collection, Rel } from "@mikro-orm/core";
import { Entity, ManyToOne, OneToMany, PrimaryKey, Property } from "@mikro-orm/decorators/legacy";
import crypto from "node:crypto";
import { ParkingPrice } from "../ParkingPrice/ParkingPrice.Entity.js";
import { ParkingSpace } from "../ParkingSpace/ParkingSpace.Entity.js";
import { User } from "../User/User.Entity.js";

@Entity()
export class Parking {
  @PrimaryKey({ type: 'string' })
  id: string = crypto.randomUUID();

  // Provincia: en Argentina hay localidades con el mismo nombre en distintas provincias (San Martín, Concepción…).
  // Nullable solo por las filas previas; el alta la exige y el seeder la completa.
  @Property({ type: 'string', nullable: true })
  province?: string | null;

  @Property({ type: 'string', nullable: false })
  locality!: string;

  // Barrio o zona (Centro, Pichincha…): es lo que la gente busca en el mapa; la localidad es la ciudad.
  @Property({ type: 'string', nullable: true })
  neighborhood?: string | null;

  @Property({ type: 'string', nullable: false })
  postalCode!: string;

  @Property({ type: 'string', nullable: false })
  address!: string;

  @Property({ type: 'number', nullable: true })
  carCapacity?: number;

  @Property({ type: 'number', nullable: true })
  motorcycleCapacity?: number;
  
  @Property({ type: 'number', nullable: true })
  truckCapacity?: number;

  @Property({ type: 'time' })
  openingTime!: string;

  @Property({ type: 'time' })
  closingTime!: string;

  @Property({ type: 'number', default: 1 })
  minReservationHours: number = 1;

  @Property({ type: 'number' })
  maxReservationHours!: number;

  @Property({ type: 'number', default: 1 })
  reservationMargin: number = 1;

  @Property({ type: 'boolean', default: true })
  isActive?: boolean = true;

  @Property({ type: 'string', nullable: false })
  name!: string;

  @Property({ type: 'double', precision: 10, scale: 7 })
  latitude!: number;

  @Property({ type: 'double', precision: 10, scale: 7 })
  longitude!: number;

  @Property({ type: 'string', nullable: true })
  imageUrl?: string;

  @ManyToOne(() => User)
  owner!: Rel<User>;

  @OneToMany(() => ParkingPrice, (parkingprice) => parkingprice.parking, {
    mappedBy: 'parking',
    cascade: [Cascade.REMOVE],
  })
  parkingpriceHistory = new Collection<ParkingPrice>(this);

  @OneToMany(() => ParkingSpace, (parkingspace) => parkingspace.parking, {
    mappedBy: 'parking',
    cascade: [Cascade.REMOVE],
  })
  parkingSpaces = new Collection<ParkingSpace>(this);
}