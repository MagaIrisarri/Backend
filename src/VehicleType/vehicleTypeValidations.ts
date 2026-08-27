import { NextFunction, Request, Response } from "express";
import { VehicleTypeSchema } from "./vehicleTypeSchema.js";

export const sanitizeVehicleTypeInput = (req: Request, res: Response, next: NextFunction) => {
  req.body.sanitizedVehicleTypeInput = {
    name: req.body.name,
    description: req.body.description,
    code: req.body.code,
  };

  Object.keys(req.body.sanitizedVehicleTypeInput).forEach((key) => {
    if (req.body.sanitizedVehicleTypeInput[key] === undefined) {
      delete req.body.sanitizedVehicleTypeInput[key];
    }
  });

  next();
};

export const validateVehicleTypeSchema = async (req: Request, res: Response, next: NextFunction) => {
  const result = await VehicleTypeSchema.safeParseAsync(req.body.sanitizedVehicleTypeInput);

  if (!result.success) {
    return res.status(400).json({
      message: 'Validation error',
      error: result.error,
    });
  }

  req.body.sanitizedVehicleTypeInput = result.data;
  next();
};