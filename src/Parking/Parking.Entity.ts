import { Cascade, Collection } from "@mikro-orm/core"
import { Entity, OneToMany, PrimaryKey, Property, } from "@mikro-orm/decorators/legacy";
import crypto from "node:crypto";
import { ParkingPrice } from "../ParkingPrice/ParkingPrice.Entity.js";

@Entity()
export class Parking {

  @PrimaryKey()
  id: string = crypto.randomUUID();

  @Property({ type: 'string', nullable: false })
  locality!: string; 

  @Property({ type: 'string', nullable: false })
  postalCode!: string;

  @Property({ type: 'string', nullable: false })
  address!: string;

  @Property({ type: 'number', nullable: true })
  carCapacity!: number;

  @Property({ type: 'number', nullable: true })
  motorcycleCapacity!: number;

  @OneToMany(() => ParkingPrice, (parkingprice) => parkingprice.parking, {
    mappedBy: 'parking',
    cascade: [Cascade.REMOVE],
  })
  parkingpriceHistory = new Collection<ParkingPrice>(this)

  toJSON() {
    return {
      id: this.id,
      locality: this.locality,
      postalCode: this.postalCode,
      address: this.address,
      carCapacity: this.carCapacity,
      motorcycleCapacity: this.motorcycleCapacity,
    };
  }
}
