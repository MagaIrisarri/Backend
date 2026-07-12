const vehicles = []; // En memoria (reemplazar con BD)
export class VehicleRepository {
    findAll() {
        return vehicles;
    }
    findOne(item) {
        return vehicles.find((vehicle) => vehicle.id === item.id);
    }
    add(item) {
        vehicles.push(item);
        return item;
    }
    update(item) {
        const vehicleIndex = vehicles.findIndex(vehicle => vehicle.id === item.id);
        if (vehicleIndex >= 0) {
            vehicles[vehicleIndex] = { ...vehicles[vehicleIndex], ...item };
        }
        return vehicles[vehicleIndex];
    }
    remove(item) {
        const vehicleIndex = vehicles.findIndex((vehicle) => vehicle.id === item.id);
        if (vehicleIndex >= 0) {
            vehicles.splice(vehicleIndex, 1);
            return { id: item.id };
        }
        else {
            return undefined;
        }
    }
    findOneForlicensePlate(licensePlate) {
        return vehicles.find((vehicle) => vehicle.licensePlate === licensePlate);
    }
    findByUser(userId) {
        const vehiclesUser = [];
        vehicles.forEach((vehicle) => { if (vehicle.userId === userId) {
            vehiclesUser.push(vehicle);
        } });
        return vehiclesUser;
    }
}
//# sourceMappingURL=VehicleRepository.js.map