import { Request, Response } from "express";
import { ServicePriceService } from "./ServicePrice.Service.js";

export class ServicePriceController {
  constructor(private service: ServicePriceService) {}

  public findAll = async (_req: Request, res: Response) => {
    try {
      const prices = await this.service.findAll();
      res.status(200).json({ data: prices });
    } catch (error: any) {
      res.status(500).json({ message: "Error al obtener tarifas", error: error.message });
    }
  };

  public findOne = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const price = await this.service.findOne(id);
      if (!price) return res.status(404).json({ message: "Registro del precio no encontrado" });

      res.status(200).json({ data: price });
    } catch (error: any) {
      res.status(500).json({ message: "Error al obtener precio", error: error.message });
    }
  };

  public create = async (req: Request, res: Response) => {
    try {
      const parkingId = req.params.parkingId as string;
      const { serviceCatalogId, price } = req.body;

      const newPrice = await this.service.create(parkingId, serviceCatalogId, price);
      res.status(201).json({ message: "Precio de servicio registrado exitosamente", data: newPrice });
    } catch (error: any) {
      res.status(400).json({ message: "Error al registrar el precio", error: error.message });
    }
  };

  public findByParking = async (req: Request, res: Response) => {
    try {
      const parkingId = req.params.parkingId as string;
      const prices = await this.service.findPricesByParking(parkingId);
      res.status(200).json({ data: prices });
    } catch (error: any) {
      res.status(500).json({ message: "Error al obtener tarifas", error: error.message });
    }
  };

  public findActive = async (req: Request, res: Response) => {
    try {
      const parkingId = req.params.parkingId as string;
      const serviceCatalogId = req.params.serviceCatalogId as string;

      const price = await this.service.findActivePrice(parkingId, serviceCatalogId);
      if (!price) return res.status(404).json({ message: "No hay precio activo vigente para este servicio" });

      res.status(200).json({ data: price });
    } catch (error: any) {
      res.status(500).json({ message: "Error al consultar precio activo", error: error.message });
    }
  };

  public remove = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const deactivated = await this.service.remove(id);
      if (!deactivated) return res.status(404).json({ message: "Precio no encontrado" });

      res.status(200).json({ message: "Tarifa dada de baja exitosamente" });
    } catch (error: any) {
      res.status(500).json({ message: "Error al dar de baja la tarifa", error: error.message });
    }
  };
}