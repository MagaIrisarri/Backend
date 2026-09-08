import { Request, Response } from 'express';
import { ParkingService } from './Parking.Service.js';
import { catchAsync } from '../Shared/utils/catchAsync.js';
import { AppError } from '../Shared/utils/AppError.js';

export class ParkingController {
  constructor(private parkingService: ParkingService) {}
  
  public findAll = catchAsync(async (_req: Request, res: Response) => {
    const parkings = await this.parkingService.findAll();
    return res.status(200).json({
      message: parkings.length === 0 ? 'No se encontraron estacionamientos' : 'Estacionamientos encontrados',
      data: parkings,
    });
  });

  public findActive = catchAsync(async (_req: Request, res: Response) => {
    const parkings = await this.parkingService.findActive();
    return res.status(200).json({
      message: parkings.length === 0 ? 'No se encontraron estacionamientos activos' : 'Estacionamientos encontrados',
      data: parkings,
    });
  });

  public findOne = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const parking = await this.parkingService.findOne(id);

    if (!parking) {
      throw new AppError('Estacionamiento no encontrado', 404);
    }

    return res.status(200).json({
      message: 'Estacionamiento encontrado',
      data: parking,
    });
  });
  
  public findByOwnerId = catchAsync(async (req: Request, res: Response) => {
    const parkings = await this.parkingService.findByOwnerId(req.params.ownerId as string);
    return res.status(200).json({
      message: parkings.length === 0 ? 'No se encontraron estacionamientos' : 'Estacionamientos encontrados',
      data: parkings,
    });
  });

  public getMetrics = catchAsync(async (req: Request, res: Response) => {
    const metrics = await this.parkingService.getMetrics(req.params.id as string);
    return res.status(200).json({
      message: 'Métricas calculadas',
      data: metrics,
    });
  });

  public reactivate = catchAsync(async (req: Request, res: Response) => {
    const reactivated = await this.parkingService.reactivate(req.params.id as string);
    if (!reactivated) throw new AppError('Estacionamiento no encontrado', 404);
    return res.status(200).json({
      message: 'Estacionamiento reactivado con éxito',
      data: reactivated,
    });
  });
  
  public create = catchAsync(async (req: Request, res: Response) => {
    const parking = await this.parkingService.create(req.body);
    return res.status(201).json({
      message: 'Estacionamiento creado con éxito',
      data: parking,
    });
  });

  public update = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const updatedParking = await this.parkingService.update(id, req.body);

    if (!updatedParking) {
      throw new AppError('Estacionamiento no encontrado', 404);
    }

    return res.status(200).json({
      message: 'Estacionamiento actualizado con éxito',
      data: updatedParking,
    });
  });

  public remove = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const deleted = await this.parkingService.remove(id);

    if (!deleted) {
      throw new AppError('Estacionamiento no encontrado', 404);
    }

    return res.status(200).json({
      message: 'Estacionamiento dado de baja con éxito',
    });
  });
}