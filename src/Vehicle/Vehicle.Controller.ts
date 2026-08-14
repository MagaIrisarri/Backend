import { Request, Response } from 'express';
import { orm } from '../Shared/db/orm.js';
import { VehicleService } from './Vehicle.Service.js';

const vehicleService = new VehicleService(orm.em);

async function add(req: Request, res: Response) {
  try {
    const vehicle = await vehicleService.createVehicle(req.body);

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

    const message = vehicleList.length === 0
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
  try {
    const vehicle = await vehicleService.findVehicleById({ id: req.params.id as string});

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
  try {
    const vehicle = await vehicleService.updateVehicle(
      { id: req.params.id as string }, 
      req.body
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
  try {
    const deleted = await vehicleService.deleteVehicle({ id: req.params.id as string });

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