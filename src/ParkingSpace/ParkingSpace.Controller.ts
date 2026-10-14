import { Request, Response } from 'express';
import { ParkingSpaceService } from './ParkingSpace.Service.js';
import { catchAsync } from '../Shared/utils/catchAsync.js';
import { AppError } from '../Shared/utils/AppError.js';

export class ParkingSpaceController {
  constructor(private parkingSpaceService: ParkingSpaceService) {}

  findByParking = catchAsync(async (req: Request, res: Response) => {
    const parkingId = req.params.parkingId as string;
    const spaces = await this.parkingSpaceService.findByParking(parkingId);
    
    return res.status(200).json({
      message: spaces.length === 0 ? 'No se encontraron plazas' : 'Plazas encontradas',
      data: spaces,
    });
  });

  findOne = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const space = await this.parkingSpaceService.findOne(id);

    if (!space) {
      throw new AppError('Plaza no encontrada', 404);
    }

    return res.status(200).json({
      message: 'Plaza encontrada',
      data: space,
    });
  });

  create = catchAsync(async (req: Request, res: Response) => {
    const parkingId = req.params.parkingId as string;
    const space = await this.parkingSpaceService.create(parkingId, req.body);

    return res.status(201).json({
      message: 'Plaza creada con éxito',
      data: space,
    });
  });

  createBulk = catchAsync(async (req: Request, res: Response) => {
    const parkingId = req.params.parkingId as string;
    await this.parkingSpaceService.createBulkManual(parkingId, req.body);

    return res.status(201).json({
      message: 'Plazas generadas en lote con éxito',
    });
  });

  update = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const { space, moved } = await this.parkingSpaceService.update(id, req.body);

    if (!space) {
      throw new AppError('Plaza no encontrada', 404);
    }

    return res.status(200).json({
      message: 'Plaza actualizada con éxito',
      data: space,
      moved, // reservas que se pasaron a otra plaza (R-19)
    });
  });

  // ?relocate=true confirma pasar las reservas futuras a otras plazas libres (R-19).
  remove = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const { moved } = await this.parkingSpaceService.remove(id, req.query.relocate === 'true');

    return res.status(200).json({
      message: 'Plaza dada de baja con éxito',
      moved,
    });
  });

  checkAvailability = catchAsync(async (req: Request, res: Response) => {
    const parkingId = req.params.parkingId as string;
    const vehicleTypeId = req.query.vehicleTypeId as string;
    const startTime = req.query.startTime as unknown as Date;
    const endTime = req.query.endTime as unknown as Date;

    const spaces = await this.parkingSpaceService.checkAvailability(parkingId, vehicleTypeId, startTime, endTime);

    return res.status(200).json({
      message: 'Plazas disponibles encontradas',
      data: spaces,
    });
  });
}