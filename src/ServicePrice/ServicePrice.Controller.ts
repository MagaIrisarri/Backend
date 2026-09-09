import { Request, Response } from "express";
import { ServicePriceService } from "./ServicePrice.Service.js";
import { catchAsync } from "../Shared/utils/catchAsync.js";
import { AppError } from "../Shared/utils/AppError.js";

export class ServicePriceController {
  constructor(private service: ServicePriceService) {}

  public findAll = catchAsync(async (_req: Request, res: Response) => {
    const prices = await this.service.findAll();
    res.status(200).json({ data: prices });
  });

  public findOne = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const price = await this.service.findOne(id);
    if (!price) throw new AppError("Registro del precio no encontrado", 404);

    res.status(200).json({ data: price });
  });

  public create = catchAsync(async (req: Request, res: Response) => {
    const parkingId = req.params.parkingId as string;
    const { serviceCatalogId, price } = req.body;

    const newPrice = await this.service.create(parkingId, serviceCatalogId, price);
    res.status(201).json({ message: "Precio de servicio registrado exitosamente", data: newPrice });
  });

  public findByParking = catchAsync(async (req: Request, res: Response) => {
    const parkingId = req.params.parkingId as string;
    const prices = await this.service.findPricesByParking(parkingId);
    res.status(200).json({ data: prices });
  });

  public findActive = catchAsync(async (req: Request, res: Response) => {
    const parkingId = req.params.parkingId as string;
    const serviceCatalogId = req.params.serviceCatalogId as string;

    const price = await this.service.findActivePrice(parkingId, serviceCatalogId);
    if (!price) throw new AppError("No hay precio activo vigente para este servicio", 404);

    res.status(200).json({ data: price });
  });

  public remove = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const deactivated = await this.service.remove(id);
    if (!deactivated) throw new AppError("Precio no encontrado", 404);

    res.status(200).json({ message: "Tarifa dada de baja exitosamente" });
  });
}