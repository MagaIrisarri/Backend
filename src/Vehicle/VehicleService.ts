import { Vehicle } from "./VehicleEntity.js";
import { VehicleRepository } from "./VehicleRepository.js";

export class VehicleService {
    constructor(private repo: VehicleRepository) { }

    findAll(): Vehicle[] | undefined {
        return this.repo.findAll();
    }

    findOne(id: string): Vehicle | undefined {
        return this.repo.findOne({ id });
    }

    add(input: Omit<Vehicle, "id">): Vehicle| undefined {
        const vehicleNew = new Vehicle(
          input.licensePlate,  
          input.brand,    
          input.model, 
          input.insurance, 
          input.userId,
          input.vehicleTypeId
        );
        const vehicle = this.repo.findOneForlicensePlate (input.licensePlate);
        if(!vehicle){
            this.repo.add(vehicleNew);
            return vehicleNew;};
    }

    update(id: string, input: Partial<Vehicle>): Vehicle | undefined {
        return this.repo.update({ id, ...input } as Vehicle);
    }

    remove(id: string): { id: string } | undefined {
        return this.repo.remove({ id });
    }
}


