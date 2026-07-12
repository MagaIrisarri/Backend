import { Vehicle } from "./VehicleEntity.js";
export class VehicleService {
    constructor(repo) {
        this.repo = repo;
    }
    findAll() {
        return this.repo.findAll();
    }
    findOne(id) {
        return this.repo.findOne({ id });
    }
    add(input) {
        const vehicleNew = new Vehicle(input.licensePlate, input.brand, input.model, input.insurance, input.userId, input.vehicleTypeId);
        const vehicle = this.repo.findOneForlicensePlate(input.licensePlate);
        if (!vehicle) {
            this.repo.add(vehicleNew);
            return vehicleNew;
        }
        ;
    }
    update(id, input) {
        return this.repo.update({ id, ...input });
    }
    remove(id) {
        return this.repo.remove({ id });
    }
    findByUser(userId) {
        return this.repo.findByUser(userId);
    }
}
//# sourceMappingURL=VehicleService.js.map