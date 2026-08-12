import { Request, Response } from 'express';
import { orm } from '../Shared/db/orm.js';
import { ParkingPriceService } from './ParkingPrice.Service.js';
import { ParkingPriceSchema, ParkingPriceIdSchema, ActivePriceSchema } from './ParkingPrice.Schema.js'
import { ParkingIdSchema } from '../Parking/Parking.Schema.js';

const parkingpriceService = new ParkingPriceService(orm.em);

async function add(req: Request, res: Response) {

  const parkingIdInput = await ParkingIdSchema.safeParseAsync(req.params);

  if (!parkingIdInput.success) {
    
    return res.status(400).json({
      message: 'Parking ID validation error',
      error: parkingIdInput.error,
    }); 
  }

  const priceInput = await ParkingPriceSchema.safeParseAsync(req.body);

  if (!priceInput.success) {

    return res.status(400).json({
      message: 'Price validation error',
      error: priceInput.error,
    });
  }

  try {

    const price = await parkingpriceService.createParkingPrice(
      parkingIdInput.data,
      priceInput.data
    );

    return res.status(201).json({
      message: 'Parking price created successfully',
      data: price,
    });

  } catch (error: any) {

    return res.status(500).json({
      message: 'Error creating parking price',
      error: error.message,
    });
  }
}

async function findPricesByParking( req: Request, res: Response) {

  const parkingIdInput = await ParkingIdSchema.safeParseAsync(req.params);

  if (!parkingIdInput.success) {
    return res.status(400).json({
      message: 'Parking ID validation error',
      error: parkingIdInput.error
    });
  }

  try {

    const prices = await parkingpriceService.findPricesByParking(parkingIdInput.data);
    
    const message =
      prices.length === 0
        ? 'No prices found for this parking'
        : 'Prices found';

    return res.status(200).json({
      message,
      data: prices,
    });

  } catch (error: any) {

    return res.status(500).json({
      message: 'Error getting parking prices',
      error: error.message,
    });
  }
}

async function findPrice( req: Request, res: Response) {

  const priceIdInput = await ParkingPriceIdSchema.safeParseAsync(req.params);

  if (!priceIdInput.success) {
    return res.status(400).json({
      message: 'Price ID validation error',
      error: priceIdInput.error,
    });
  } 

  try {

    const price = await parkingpriceService.findPrice(priceIdInput.data);

    if(!price) {
      return res.status(404).json({
        message: 'Parking price not found',
      });
    }

    return res.status(200).json({
      message: 'Parking price found',
      data: price,
    });

  } catch (error: any) {

    return res.status(500).json({
      message: 'Error getting parking price',
      error: error.message,
    });
  }
}

async function findActivePrice( req: Request, res: Response) {

  const activePriceInput = await ActivePriceSchema.safeParseAsync(req.params);

  if (!activePriceInput.success) {
    return res.status(400).json({
      message: 'Parameters validation error',
      error: activePriceInput.error,
    });
  }

  try {

    const price = await parkingpriceService.findActivePrice(
      { id: activePriceInput.data.id },
      activePriceInput.data.vehicleType
    );

    if (!price) {
      return res.status(404).json({
        message: 'No active price found for this vehicle type',
      });
    }

    return res.status(200).json({
      message: 'Active price found',
      data: price,
    });

  } catch (error: any) {

    return res.status(500).json({
      message: 'Error getting active price',
      error: error.message,
    });
  }
}

export { add, findPricesByParking, findPrice, findActivePrice};