import crypto from "node:crypto"

export class VehicleType {
  constructor(
  public name: string,
  public description: string,
  public code: string, 
  public id = crypto.randomUUID() 
) { }
}