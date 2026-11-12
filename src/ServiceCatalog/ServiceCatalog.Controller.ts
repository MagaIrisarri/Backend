import { Request, Response } from 'express';
import { ServiceCatalogService } from './ServiceCatalog.Service.js';
import { AppError } from '../Shared/utils/AppError.js';

export class ServiceCatalogController {
  constructor(private service: ServiceCatalogService) {}

  public findAll = async (_req: Request, res: Response) => {
    const services = await this.service.findAll();
    res.status(200).json({ data: services });
  };

  public findOne = async (req: Request, res: Response) => {
    const service = await this.service.findOne(req.params.id as string);
    if (!service) throw new AppError('Servicio no encontrado', 404);
    res.status(200).json({ data: service });
  };

  public create = async (req: Request, res: Response) => {
    const service = await this.service.create(req.body);
    res.status(201).json({ message: 'Servicio creado exitosamente', data: service });
  };

  public update = async (req: Request, res: Response) => {
    const service = await this.service.update(req.params.id as string, req.body);
    if (!service) throw new AppError('Servicio no encontrado', 404);
    res.status(200).json({ message: 'Servicio actualizado exitosamente', data: service });
  };

  public remove = async (req: Request, res: Response) => {
    const deleted = await this.service.remove(req.params.id as string);
    if (!deleted) throw new AppError('Servicio no encontrado', 404);
    res.status(200).json({ message: 'Servicio eliminado correctamente' });
  };
}