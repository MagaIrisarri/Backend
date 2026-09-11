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
    const spaces = this.parkingSpaces?.isInitialized() ? this.parkingSpaces.getItems() : [];
    const autoSpaces = spaces.filter((s) => s.vehicleType?.toUpperCase() === 'AUTO' && s.isActive);
    const motoSpaces = spaces.filter((s) => ['MOTOCICLETA', 'MOTO'].includes(s.vehicleType?.toUpperCase()) && s.isActive);
    const truckSpaces = spaces.filter((s) => ['CAMIONETA', 'VAN', 'UTILITARIO'].includes(s.vehicleType?.toUpperCase()) && s.isActive);

    const carCap = this.carCapacity ?? (autoSpaces.length > 0 ? autoSpaces.length : 0);
    const motoCap = this.motorcycleCapacity ?? (motoSpaces.length > 0 ? motoSpaces.length : 0);
    const truckCap = this.truckCapacity ?? (truckSpaces.length > 0 ? truckSpaces.length : 0);

    const occupiedCar = autoSpaces.filter((s) => s.state === 'OCUPADO').length;
    const occupiedMoto = motoSpaces.filter((s) => s.state === 'OCUPADO').length;
    const occupiedTruck = truckSpaces.filter((s) => s.state === 'OCUPADO').length;

    const availableCarSpaces = Math.max(0, carCap - occupiedCar);
    const availableMotorcycleSpaces = Math.max(0, motoCap - occupiedMoto);
    const availableTruckSpaces = Math.max(0, truckCap - occupiedTruck);

    return {
      id: this.id,
      locality: this.locality,
      postalCode: this.postalCode,
      address: this.address,
      carCapacity: carCap,
      motorcycleCapacity: motoCap,
      truckCapacity: truckCap,
      availableCarSpaces,
      availableMotorcycleSpaces,
      availableTruckSpaces,
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
      prices: this.parkingpriceHistory?.isInitialized()
        ? (() => {
            const activePrices = this.parkingpriceHistory
              .getItems()
              .filter((p) => p.expirationDate === null);
            const byCategory = new Map<string, { id: string; vehicleType: string; price: number }>();
            for (const p of activePrices) {
              const raw = (p.vehicleType || '').trim().toUpperCase();
              let category = 'AUTO';
              if (raw.includes('MOTO')) category = 'MOTO';
              else if (
                raw.includes('CAMION') ||
                raw.includes('UTIL') ||
                raw.includes('VAN') ||
                raw.includes('PICK')
              ) {
                category = 'CAMIONETA';
              }
              byCategory.set(category, {
                id: p.id,
                vehicleType: category,
                price: Number(p.price),
              });
            }
            return Array.from(byCategory.values());
          })()
        : [],
    };
  }
}