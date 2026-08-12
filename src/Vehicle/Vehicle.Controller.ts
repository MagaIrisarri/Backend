import { Request, Response } from 'express';
import { orm } from '../Shared/db/orm.js';
import { VehicleService } from './Vehicle.Service.js';
import {
  VehicleSchema,
  VehicleIdSchema,
  UpdateVehicleSchema,
} from './Vehicle.Schema.js'; 

const vehicleService = new VehicleService(orm.em);

async function add(req: Request, res: Response) {
  const vehicleInput = await VehicleSchema.safeParseAsync(req.body);

  if (!vehicleInput.success) {
    return res.status(400).json({ 
      message: "Validation error", 
      error: vehicleInput.error, 
    });
  }

  try {
    const vehicle = await vehicleService.createVehicle(vehicleInput.data);

    return res.status(201).json({ 
      message: "Vehicle created successfully", 
      data: vehicle, 
    });
  } catch (error: any) {
    return res.status(500).json({ 
      message: "Error creating vehicle", 
      error: error.message,
    });
  }
}

async function findAll(req: Request, res: Response) {
  try {
    const vehicleList = await vehicleService.findAllVehicle();

    const message =
      vehicleList.length === 0
        ? 'No vehicles found'
        : 'Vehicles found';
    
    return res.status(200).json({
      message,
      data: vehicleList,
    });
  } catch (error: any) {
    return res.status(500).json({ 
      error: error.message,
    });
  }
}

async function findOneById(req: Request, res: Response) {
  const idInput = await VehicleIdSchema.safeParseAsync(req.params);

  if (!idInput.success) {
    return res.status(400).json({ 
      message: "Validation error", 
      error: idInput.error,
    });
  }

  try {
    const vehicle = await vehicleService.findVehicleById(idInput.data);

    if(!vehicle) {
      return res.status(404).json({
        message: 'Vehicle not found'
      })
    }

    return res.status(200).json({ 
      message: 'Vehicle found', 
      data: vehicle, 
    });
  } catch (error: any) {
    return res.status(500).json({ 
      error: error.message,
    });
  }
}

async function update(req: Request, res: Response) {
  const idInput = await VehicleIdSchema.safeParseAsync(req.params);

  if (!idInput.success) {
    return res.status(400).json({
      message: "ID validation error",
      error: idInput.error,
    });
  }

  const vehicleInput = await UpdateVehicleSchema.safeParseAsync(req.body);
  
  if (!vehicleInput.success) {
    return res.status(400).json({
      message: "Vehicle validation error",
      error: vehicleInput.error,
    });
  }

  try {
    const vehicle = await vehicleService.updateVehicle(
      idInput.data, 
      vehicleInput.data
    );

    if(!vehicle) {
      return res.status(404).json({
        message: 'Vehicle not found',
      });
    }

    return res.status(200).json({
      message: 'Vehicle updated successfully',
      data: vehicle,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: error.message, 
    });
  }
}

async function remove(req: Request, res: Response) {
  const idInput = await VehicleIdSchema.safeParseAsync(req.params);

  if (!idInput.success) {
    return res.status(400).json({ 
      message: "Validation error", 
      error: idInput.error,
    });
  }
  
  try {
    const deleted = await vehicleService.deleteVehicle(idInput.data);

    if (!deleted) {
      return res.status(404).json({ 
        message: 'Vehicle not found', 
      });
    }

    return res.status(200).json({ 
      message: "Vehicle deleted successfully", 
    });
  } catch (error: any) {
    return res.status(500).json({ 
      error: error.message,
    });
  }
}

export { add, findAll, findOneById, update, remove };