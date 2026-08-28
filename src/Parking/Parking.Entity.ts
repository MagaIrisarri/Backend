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

  @Property({ type: 'string', nullable: false })
  locality!: string;

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

  toJSON() {
    return {
      id: this.id,
      locality: this.locality,
      postalCode: this.postalCode,
      address: this.address,
      carCapacity: this.carCapacity,
      motorcycleCapacity: this.motorcycleCapacity,
      truckCapacity: this.truckCapacity,
      openingTime: this.openingTime,
      closingTime: this.closingTime,
      minReservationHours: this.minReservationHours,
      maxReservationHours: this.maxReservationHours,
      reservationMargin: this.reservationMargin,
      isActive: this.isActive,
      name: this.name,
      latitude: this.latitude,
      longitude: this.longitude,
      imageUrl: this.imageUrl,
      owner: this.owner,
    };
  }
}