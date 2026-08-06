import crypto from "node:crypto"

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