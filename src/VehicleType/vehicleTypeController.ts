import { Request, Response } from 'express';
import {vehicleType} from '../vehicleType.js';

const vehicleTypes: vehicleType[] = [];

export const createVehicleType = (req: Request, res: Response): void => {
  const newVehicleType: vehicleType = { ...req.body };
  vehicleTypes.push(newVehicleType);
  res.status(201).json(newVehicleType);
};

export const getVehicleTypes = (req: Request, res: Response): void => {
  res.status(200).json(vehicleTypes);
};

export const getVehicleTypeCode = (req: Request, res: Response): void => {
  const code = parseInt(req.params['code'] as string);
  const vehicleType = vehicleTypes.find(vt => vt.code === code);

  if (!vehicleType) {
    res.status(404).json({ mensaje: 'vehicle type not found' });
    return;
  }

  res.status(200).json(vehicleType);
};

export const updateVehicleType = (req: Request, res: Response): void => {
  const code = parseInt(req.params['code'] as string);
  const vtIndex = vehicleTypes.findIndex(vt => vt.code === code);

  if (vtIndex === -1) {
    res.status(404).json({ mensaje: 'vehicle type not found' });
    return;
  }

  vehicleTypes[vtIndex] = { ...vehicleTypes[vtIndex], ...req.body, code };
  res.status(200).json(vehicleTypes[vtIndex]);
};

export const deleteVehicleType = (req: Request, res: Response): void => {
  const code = parseInt(req.params['code'] as string);
  const vtIndex = vehicleTypes.findIndex(vt => vt.code === code);

    if (vtIndex === -1) {
    res.status(404).json({ mensaje: 'vehicle type not found' });
    return;
  }
  vehicleTypes.splice(vtIndex, 1);
  res.status(204).send();
};
