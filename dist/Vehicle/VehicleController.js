import { VehicleRepository } from "./VehicleRepository.js";
import { VehicleService } from "./VehicleService.js";
const service = new VehicleService(new VehicleRepository());
export const findAll = (req, res) => {
    res.json(service.findAll());
};
export const findOne = (req, res) => {
    const id = req.params.id;
    const vehicle = service.findOne(id);
    if (!vehicle)
        return res.status(404).send({ message: "Vehicle not found" });
    return res.json(vehicle);
};
export const add = (req, res) => {
    const vehicle = service.add(req.body.sanitizedVehicleInput);
    if (!vehicle)
        return res.status(409).send({ message: "Ya existe un vehículo con esa patente" });
    return res.status(201).json(vehicle);
};
export const update = (req, res) => {
    const id = req.params.id;
    const vehicle = service.update(id, req.body.sanitizedVehicleInput);
    if (!vehicle)
        return res.status(404).send({ message: "Vehicle not found" });
    res.json({ message: "Vehicle updated successfully", data: vehicle });
};
export const remove = (req, res) => {
    const id = req.params.id;
    const result = service.remove(id);
    if (!result)
        return res.status(500).json({ message: "There was an internal error deleting the Vehicle" });
    return res.json({ message: `Vehicle with id: ${result.id} successfully deleted` });
};
export const findByUser = (req, res) => {
    const userId = req.params.userId;
    return res.json(service.findByUser(userId));
};
//# sourceMappingURL=VehicleController.js.map