import crypto from "node:crypto"

export class Vehicle {
  constructor(
    
    public licensePlate: string,  
    public brand: string,          
    public model: string,          
    public insurance: string,      
    public userId: string,
    public vehicleTypeId: string,
    public id = crypto.randomUUID(),
  ) {}
}


