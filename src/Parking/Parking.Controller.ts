import { Request, Response } from 'express';
import {  orm } from '../Shared/db/orm.js'
import { ParkingService } from './Parking.Service.js';
import {
  ParkingSchema,
  ParkingIdSchema,
  UpdateParkingSchema,
} from './Parking.Schema.js';

const parkingService = new ParkingService(orm.em);

async function add(req: Request, res: Response) {
  const parkingInput = await ParkingSchema.safeParseAsync(req.body);

  if (!parkingInput.success) {
    return res.status(400).json({ 
      message: "Validation error", 
      error: parkingInput.error, 
    });
  }

  try {
    const parking = await parkingService.createParking(parkingInput.data);

    return res.status(201).json({ 
      message: "Parking created successfully", 
      data: parking, 
    });
  } catch (error: any) {
    return res.status(500).json({ 
      message: "Error creating parking", 
      error: error.message,
    });
  }
}

async function findAll(req: Request, res: Response) {
  try {
    const parkingList = await parkingService.findAllParking();

    const message =
      parkingList.length === 0
        ? 'No parkings found'
        : 'Parkings found';
    
    return res.status(200).json({
      message,
      data: parkingList,
    });
  } catch (error: any) {
    return res.status(500).json({ 
      error: error.message,
    });
  }
}

async function findOneById(req: Request, res: Response) {
  const idInput = await ParkingIdSchema.safeParseAsync(req.params);

  if (!idInput.success) {
    return res.status(400).json({ 
      message: "Validation error", 
      error: idInput.error,
    });
  }

  try {
    const parking = await parkingService.findParkingById(idInput.data);

    if(!parking) {
      return res.status(404).json({
        message: 'Parking not found'
      })
    }

    return res.status(200).json({ 
      message: 'Parking found', 
      data: parking, 
    });
  } catch (error: any) {
    return res.status(500).json({ 
      error: error.message,
    });
  }
}

async function update(req: Request, res: Response) {
  const idInput = await ParkingIdSchema.safeParseAsync(req.params);

  if (!idInput.success) {
    return res.status(400).json({
      message: "ID validation error",
      error: idInput.error,
    });
  }

  const parkingInput = await UpdateParkingSchema.safeParseAsync(req.body);
  
  if (!parkingInput.success) {
    return res.status(400).json({
      message: "Parking validation error",
      error: parkingInput.error,
    });
  }

  try {
    const parking = await parkingService.updateParking(
      idInput.data, 
      parkingInput.data
    );

    if(!parking) {
      return res.status(404).json({
        message: 'Parking not found',
      });
    }

    return res.status(200).json({
      message: 'Parking updated successfully',
      data: parking,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: error.message, 
    });
  }
}

async function remove(req: Request, res: Response) {
  const idInput = await ParkingIdSchema.safeParseAsync(req.params);

  if (!idInput.success) {
    return res.status(400).json({ 
      message: "Validation error", 
      error: idInput.error,
    });
  }
  
  try {
    const deleted = await parkingService.deleteParking(idInput.data);

    if (!deleted) {
      return res.status(404).json({ 
        message: 'Parking not found', 
      });
    }

    return res.status(200).json({ 
      message: "Parking deleted successfully", 
    });
  } catch (error: any) {
    return res.status(500).json({ 
      error: error.message,
    });
  }
}

export { add, findAll, findOneById, update, remove };

