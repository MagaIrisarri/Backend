import { Repository } from "../Shared/base.Repository.js";
import { Vehicle } from './VehicleEntity.js';

const vehicles: Vehicle[] = []; // En memoria (reemplazar con BD)

export class VehicleRepository implements Repository<Vehicle> {

    public findAll(): Vehicle[] | undefined {
        return vehicles;
    }

    public findOne(item: { id: string; }): Vehicle | undefined {
        return vehicles.find((vehicle) => vehicle.id === item.id);
    }

    public add(item: Vehicle): Vehicle | undefined {
        vehicles.push(item);
        return item;
    }

    public update(item: Vehicle): Vehicle | undefined {
        const vehicleIndex = vehicles.findIndex(vehicle => vehicle.id === item.id);

        if (vehicleIndex >= 0) {
            vehicles[vehicleIndex] = { ...vehicles[vehicleIndex], ...item }
        }

        return vehicles[vehicleIndex];
    }

    public remove(item: { id: string; }): { id: string } | undefined {
        const vehicleIndex = vehicles.findIndex((vehicle) => vehicle.id === item.id);

        if (vehicleIndex >= 0) {
            vehicles.splice(vehicleIndex, 1);
            return { id: item.id }
        }
        else {
            return undefined;
        }

    }
    public findOneForlicensePlate(licensePlate: string): Vehicle | undefined {
        return vehicles.find((vehicle) => vehicle.licensePlate === licensePlate);
    }

}
