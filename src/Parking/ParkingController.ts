import { Request, Response } from 'express';
import {
  ParkingSchema,
  ParkingIdSchema,
  Parking, //Tipo inferido desde el schema
} from './ParkingSchema.js';

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
