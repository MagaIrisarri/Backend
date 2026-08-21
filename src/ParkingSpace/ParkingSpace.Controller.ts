import { Request, Response } from "express";
import { orm } from "../Shared/db/orm.js";

import { ParkingSpaceService } from "./ParkingSpace.Service.js";

import { ParkingSpaceSchema, AvailableSpacesByVehicleTypeSchema } from "./ParkingSpace.Schema.js";
import { ParkingIdSchema } from "../Parking/Parking.Schema.js";

const parkingspaceService = new ParkingSpaceService(orm.em);

async function add(req: Request, res: Response) {

  const parkingIdInput = await ParkingIdSchema.safeParseAsync(req.params);

  if (!parkingIdInput.success) {
    return res.status(400).json({
      message: 'Parking ID validation error',
      error: parkingIdInput.error,
    });
  }

  const parkingSpaceInput = await ParkingSpaceSchema.safeParseAsync(
    req.body
  );

  if (!parkingSpaceInput.success) {
    return res.status(400).json({
      message: 'Parking space validation error',
      error: parkingSpaceInput.error,
    });
  }

  try {
    
    const parkingSpace = await parkingspaceService.createParkingSpace(
      parkingIdInput.data,
      parkingSpaceInput.data
    );

    return res.status(201).json({
      message: 'Parking space created successfully',
      data: parkingSpace,
    });

  } catch (error: any) {

    return res.status(500).json({
      message: 'Error creating parking space',
      error: error.message,
    });

  }
}

async function findSpacesByParking(req: Request, res: Response) {

  const parkingIdInput = await ParkingIdSchema.safeParseAsync(req.params);

  if (!parkingIdInput.success) {
    return res.status(400).json({
      message: 'Parking ID validation error',
      error: parkingIdInput.error,
    });
  }

  try {

    const spaces = await parkingspaceService.findSpacesByParking(parkingIdInput.data);

    const message = 
      spaces.length === 0
        ? 'No parking spaces found'
        : 'Parking spaces found';

    return res.status(200).json({
      message,
      data: spaces,
    });

  } catch (error: any) {

    return res.status(500).json({
      message: 'Error getting parking spaces',
      error: error.message,
    });
    
  }
}

async function findAvailableSpaces(req: Request, res: Response) {

  const parkingIdInput = await ParkingIdSchema.safeParseAsync(req.params);

  if (!parkingIdInput.success) {
    return res.status(400).json({
      message: 'Parking ID validation error',
      error: parkingIdInput.error,
    });
  }

  try {

    const spaces = await parkingspaceService.findAvailableSpaces(
      parkingIdInput.data
    );

    const message =
      spaces.length === 0
        ? 'No available parking spaces'
        : 'Available parking spaces found';

    return res.status(200).json({
      message,
      data: spaces,
    });

  } catch (error: any) {

    return res.status(500).json({
      message: 'Error getting available parking spaces',
      error: error.message,
    });

  }
}

async function findAvailableSpacesByVehicleType(req: Request, res: Response) {

  const input = await AvailableSpacesByVehicleTypeSchema.safeParseAsync(req.params);

  if (!input.success) {
    return res.status(400).json({
      message: 'Parameters validation error',
      error: input.error,
    });
  }

  try {

    const spaces = await parkingspaceService.findAvailableSpacesByVehicleType(
        { id: input.data.id },
        input.data.vehicleType
      );

    const message =
      spaces.length === 0
        ? 'No available parking spaces for this vehicle type'
        : 'Available parking spaces found';

    return res.status(200).json({
      message,
      data: spaces,
    });

  } catch (error: any) {

    return res.status(500).json({
      message: 'Error getting available parking spaces',
      error: error.message,
    });

  }
}

export { add, findSpacesByParking, findAvailableSpaces, findAvailableSpacesByVehicleType };