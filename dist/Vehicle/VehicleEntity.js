import crypto from "node:crypto";
export class Vehicle {
    constructor(licensePlate, brand, model, insurance, userId, vehicleTypeId, id = crypto.randomUUID()) {
        this.licensePlate = licensePlate;
        this.brand = brand;
        this.model = model;
        this.insurance = insurance;
        this.userId = userId;
        this.vehicleTypeId = vehicleTypeId;
        this.id = id;
    }
}
//# sourceMappingURL=VehicleEntity.js.map