import { Request, Response } from 'express';
import { VehicleTypeRepository } from './vehicleTypeRepository.js';
import { VehicleTypeService } from './vehicleTypeService.js';

const service = new VehicleTypeService(new VehicleTypeRepository());

export const add = (req: Request, res: Response) => {
  const vehicleType = service.add(req.body.sanitizedVehicleTypeInput);

  if (!vehicleType) {
    return res.status(409).send({ message: "A vehicle type with this code already exists" });
  }

  return res.status(201).json(vehicleType);
}

export const findAll = (req: Request, res: Response) => {
    res.json(service.findAll());
}

export const findOne = (req: Request, res: Response) => {
    const id = req.params.id as string;
    const vehicleType = service.findOne(id);

    if (!vehicleType)
        return res.status(404).send({ message: "Vehicle type not found" });

    return res.json(vehicleType);
}

export const remove = (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = service.remove(id);

    if (!result)
        return res.status(500).json({ message: "There was an internal error deleting the vehicle type" })

    return res.json({ message: `Vehicle type with id: ${result.id} successfully deleted` })
}

export const update = (req: Request, res: Response) => {
    const id = req.params.id as string;
    const vehicleType = service.update(id, req.body.sanitizedVehicleTypeInput);

    if (!vehicleType)
        return res.status(404).send({ message: "Vehicle type not found" });

    res.json({ message: "Vehicle type updated successfully", data: vehicleType });
}
