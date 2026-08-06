import { Request, Response } from 'express';
import { ParkingService } from './ParkingService.js';
import {
  ParkingSchema,
  ParkingIdSchema,
  Parking, //Tipo inferido desde el schema
} from './ParkingSchema.js';

/*
const parkings: Parking[] = []; //Almacenamiento en memoria

async function add(req: Request, res: Response) {
  const parkingBody = await ParkingSchema.safeParseAsync(req.body);
  if (!parkingBody.success) {
    return res
      .status(400)
      .json({ message: 'Validation error', error: parkingBody.error });   
  }
  
  const parking: Parking = parkingBody.data; //Objeto validado y tipado
  parkings.push(parking); // Guarda en memoria
  return res // Responde al cliente
    .status(201)
    .json({ message: 'Parking created successfully', data:parking });
}

async function findAll(req: Request, res: Response) {
  return res
    .status(200)
    .json({ message: 'Parkings found', data:parkings });
}

async function findOneById(req: Request, res: Response) {
  const idInput = await ParkingIdSchema.safeParseAsync(req.params);
  if (!idInput.success) {
    return res
      .status(400)
      .json({ message: 'Validation error', error: idInput.error});
  }

  const parking = parkings.find(p => p.id === idInput.data.id);
  if (!parking) {
    return res
      .status(404)
      .json({ message: 'Parking not found' });
  }
  return res
  .status(200)
  .json({ message: 'Parking found', data: parking });
}

async function update(req: Request, res: Response) {
  const idInput = await ParkingIdSchema.safeParseAsync(req.params);
  if (!idInput.success) {
    return res
      .status(400)
      .json({ message: 'ID validation error', error: idInput.error });
  }

  const bodyInput = await ParkingSchema.safeParseAsync(req.body);
  if (!bodyInput.success) {
    return res
      .status(400)
      .json({ message: 'Body validation error', error: bodyInput.error });      
  }
  
  const index = parkings.findIndex(p => p.id === idInput.data.id);
  if (index === -1) {
    return res
      .status(404)
      .json({ message: 'Parking not found' });
  }

  parkings[index] = { ...parkings[index], ...bodyInput.data, id: idInput.data.id };
  return res
    .status(200)
    .json({ message: 'Parking updated successfully', data: parkings[index] });
}

async function remove(req: Request, res: Response) {
  const idInput = await ParkingIdSchema.safeParseAsync(req.params);
  if (!idInput.success) {
    return res
      .status(400)
      .json({ message: 'Validation error', error: idInput.error });
  }

  const index = parkings.findIndex(p => p.id === idInput.data.id);
  if (index === -1) {
    return res
      .status(404)
      .json({ message: 'Parking not found' });
  }

  parkings.splice(index, 1);
  return res
    .status(200)
    .json({ message: 'Parking deleted successfully' });
}

export { add, findAll, findOneById, update, remove };
*/


// 👇 Instancia del servicio en memoria
const parkingService = new ParkingService();

async function add(req: Request, res: Response) {
  const parkingBody = await ParkingSchema.safeParseAsync(req.body);
  if (!parkingBody.success) {
    return res.status(400).json({
      message: "Validation error",
      error: parkingBody.error,
    });
  }

  try {
    const parking = await parkingService.createParking(parkingBody.data);
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
    const parkings = await parkingService.findAllParking();
    const msg =
      (parkings?.length ?? 0) === 0 ? "No parkings found" : "Parkings found";
    return res.status(200).json({ message: msg, data: parkings ?? [] });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
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
    const msg = parking === null ? "Parking not found" : "Parking found";
    return res.status(200).json({ message: msg, data: parking });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
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

  const bodyInput = await ParkingSchema.safeParseAsync(req.body);
  if (!bodyInput.success) {
    return res.status(400).json({
      message: "Body validation error",
      error: bodyInput.error,
    });
  }

  try {
    const updated = await parkingService.updateParking(idInput.data, bodyInput.data);
    if (!updated) {
      return res.status(404).json({ message: "Parking not found" });
    }
    return res.status(200).json({
      message: "Parking updated successfully",
      data: updated,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
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
      return res.status(404).json({ message: "Parking not found" });
    }
    return res.status(200).json({ message: "Parking deleted successfully" });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export { add, findAll, findOneById, update, remove };

