import { Cascade, Collection, Rel, } from "@mikro-orm/core"
import { Entity, PrimaryKey, Property, } from "@mikro-orm/decorators/legacy";
import crypto from "node:crypto"

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


/*
export class Parking {
  id: string;
  locality: string;
  postalCode: string;
  address: string;
  carCapacity: number;
  motorcycleCapacity: number;
  
  constructor(
    id: string = crypto.randomUUID(),
    locality: string,
    postalCode: string,
    address: string,
    carCapacity: number,
    motorcycleCapacity: number,
  ) {
    this.id = id;
    this.locality = locality;
    this.postalCode = postalCode;
    this.address = address;
    this.carCapacity = carCapacity;
    this.motorcycleCapacity = motorcycleCapacity;
  }
}
*/