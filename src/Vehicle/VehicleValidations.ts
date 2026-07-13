import { NextFunction, Request, Response } from "express"
import { VehicleSchema } from "./VehicleSchema.js"

export const sanitizeVehicleInput = (req: Request, res: Response, next: NextFunction) => {
    req.body.sanitizedVehicleInput = {
        licensePlate: req.body.licensePlate,
        brand: req.body.brand,
        model: req.body.model,
        insurance: req.body.insurance,
        userId: req.body.userId,
        vehicleTypeId: req.body.vehicleTypeId,
    }

    Object.keys(req.body.sanitizedVehicleInput).forEach((key) => {
        if (req.body.sanitizedVehicleInput[key] === undefined) {
            delete req.body.sanitizedVehicleInput[key]
        }
    })

    next()
}

export const validateVehicleSchema = async (req: Request, res: Response, next: NextFunction) => {
    const result = await VehicleSchema.safeParseAsync(req.body.sanitizedVehicleInput);

    if (!result.success) {
        return res.status(400).json({ message: "Validation error", error: result.error });
    }

    req.body.sanitizedVehicleInput = result.data;
    next();
}
