import { Cascade, Collection, Rel } from "@mikro-orm/core";
import { Entity, ManyToOne, OneToMany, PrimaryKey, Property } from "@mikro-orm/decorators/legacy";
import crypto from "node:crypto";
import { ParkingPrice } from "../ParkingPrice/ParkingPrice.Entity.js";
import { ParkingSpace } from "../ParkingSpace/ParkingSpace.Entity.js";
import { User } from "../User/User.Entity.js";
import { DEFAULT_RESERVATION_MARGIN_MINUTES } from "../Shared/constants/schedule.js";

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

  // La capacidad de cada tipo es la cantidad de plazas activas de ese tipo (R-30): no se guarda aparte (las columnas viejas las borra pnpm db:drop-legacy, L-39).

  @Property({ type: 'time' })
  openingTime!: string;

  @Property({ type: 'time' })
  closingTime!: string;

  @Property({ type: 'number', default: 1 })
  minReservationHours: number = 1;

  @Property({ type: 'number' })
  maxReservationHours!: number;

  // Minutos libres entre dos reservas de la misma plaza (R-22). La columna vieja en horas queda sin uso (L-39).
  @Property({ type: 'number', fieldName: 'reservation_margin_minutes', default: DEFAULT_RESERVATION_MARGIN_MINUTES })
  reservationMargin: number = DEFAULT_RESERVATION_MARGIN_MINUTES;

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