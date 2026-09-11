import { Request, Response } from 'express';
import { ParkingPriceService } from './ParkingPrice.Service.js';
import { catchAsync } from '../Shared/utils/catchAsync.js';
import { AppError } from '../Shared/utils/AppError.js';

export class ParkingPriceController {
  constructor(private service: ParkingPriceService) {}

  public create = catchAsync(async (req: Request, res: Response) => {
    const parkingId = req.params.id as string;
    const price = await this.service.create(parkingId, req.body);

    return res.status(201).json({ message: 'Tarifa creada con éxito', data: price });
  });

  public findByParking = catchAsync(async (req: Request, res: Response) => {
    const parkingId = req.params.id as string;
    const prices = await this.service.findByParking(parkingId);

    const message = prices.length === 0
      ? 'No se encontraron tarifas para este estacionamiento'
      : 'Tarifas encontradas';

    return res.status(200).json({ message, data: prices });
  });

  public findOne = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const price = await this.service.findOne(id);

    if (!price) throw new AppError('Tarifa no encontrada', 404);
    return res.status(200).json({ message: 'Tarifa encontrada', data: price });
  });

  public findActive = catchAsync(async (req: Request, res: Response) => {
    const parkingId = req.params.id as string;
    const vehicleType = req.params.vehicleType as string;

    const price = await this.service.findActive(parkingId, vehicleType);

    if (!price) throw new AppError('No hay tarifa activa vigente para este tipo de vehículo', 404);
    return res.status(200).json({ message: 'Tarifa activa encontrada', data: price });
  });

  public update = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const price = await this.service.update(id, req.body);

    return res.status(200).json({ message: 'Tarifa actualizada con éxito', data: price });
  });

  public remove = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const deactivated = await this.service.remove(id);

    if (!deactivated) throw new AppError('Tarifa no encontrada o ya inactiva', 404);
    return res.status(200).json({ message: 'Tarifa dada de baja exitosamente' });
  });
}