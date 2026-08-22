import { Request, Response } from 'express';
import { ServiceCatalogService } from './ServiceCatalog.Service.js';

export class ServiceCatalogController {
  constructor(private service: ServiceCatalogService) {}

  public findAll = async (_req: Request, res: Response) => {
    try {
      const services = await this.service.findAll();
      res.status(200).json({ data: services });
    } catch (error: any) {
      res.status(500).json({ message: "Error al obtener el catálogo de servicios", error: error.message });
    }
  };

  public findOne = async (req: Request, res: Response) => {
    try {
      const service = await this.service.findOne(req.params.id as string);
      if (!service) return res.status(404).json({ message: "Servicio no encontrado" });
      res.status(200).json({ data: service });
    } catch (error: any) {
      res.status(500).json({ message: "Error al obtener el servicio", error: error.message });
    }
  };

  public create = async (req: Request, res: Response) => {
    try {
      const service = await this.service.create(req.body);
      res.status(201).json({ message: "Servicio creado exitosamente", data: service });
    } catch (error: any) {
      res.status(400).json({ message: "Error al crear el servicio", error: error.message });
    }
  };

  public update = async (req: Request, res: Response) => {
    try {
      const service = await this.service.update(req.params.id as string, req.body);
      if (!service) return res.status(404).json({ message: "Servicio no encontrado" });
      res.status(200).json({ message: "Servicio actualizado exitosamente", data: service });
    } catch (error: any) {
      res.status(500).json({ message: "Error al actualizar el servicio", error: error.message });
    }
  };

  public remove = async (req: Request, res: Response) => {
    try {
      const deleted = await this.service.remove(req.params.id as string);
      if (!deleted) return res.status(404).json({ message: "Servicio no encontrado" });
      res.status(200).json({ message: "Servicio eliminado correctamente" });
    } catch (error: any) {
      res.status(500).json({ message: "Error al eliminar el servicio", error: error.message });
    }
  };
}