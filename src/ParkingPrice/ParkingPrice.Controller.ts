import { Request, Response } from 'express';
import { ParkingPriceService } from './ParkingPrice.Service.js';

export class ParkingPriceController {
  constructor(private service: ParkingPriceService) {}

  public add = async (req: Request, res: Response) => {
    try {
      const parkingId = req.params.id as string;
      const price = await this.service.createParkingPrice(parkingId, req.body);

      return res.status(201).json({
        message: 'Tarifa creada con éxito',
        data: price,
      });
    } catch (error: any) {
      return res.status(500).json({
        message: 'Error al crear la tarifa',
        error: error.message,
      });
    }
  };

  public findPricesByParking = async (req: Request, res: Response) => {
    try {
      const parkingId = req.params.id as string;
      const prices = await this.service.findPricesByParking(parkingId);

      const message = prices.length === 0
        ? 'No se encontraron tarifas para este estacionamiento'
        : 'Tarifas encontradas';

      return res.status(200).json({
        message,
        data: prices,
      });
    } catch (error: any) {
      return res.status(500).json({
        message: 'Error al obtener tarifas',
        error: error.message,
      });
    }
  };

  public findPrice = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const price = await this.service.findPrice(id);

      if (!price) {
        return res.status(404).json({
          message: 'Tarifa no encontrada',
        });
      }

      return res.status(200).json({
        message: 'Tarifa encontrada',
        data: price,
      });
    } catch (error: any) {
      return res.status(500).json({
        message: 'Error al consultar tarifa',
        error: error.message,
      });
    }
  };

  public findActivePrice = async (req: Request, res: Response) => {
    try {
      const parkingId = req.params.id as string;
      const vehicleType = req.params.vehicleType as string;

      const price = await this.service.findActivePrice(parkingId, vehicleType);

      if (!price) {
        return res.status(404).json({
          message: 'No hay tarifa activa vigente para este tipo de vehículo',
        });
      }

      return res.status(200).json({
        message: 'Tarifa activa encontrada',
        data: price,
      });
    } catch (error: any) {
      return res.status(500).json({
        message: 'Error al consultar tarifa activa',
        error: error.message,
      });
    }
  };

  public remove = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const deactivated = await this.service.deactivatePrice(id);

      if (!deactivated) {
        return res.status(404).json({
          message: 'Tarifa no encontrada o ya inactiva',
        });
      }

      return res.status(200).json({
        message: 'Tarifa dada de baja exitosamente',
      });
    } catch (error: any) {
      return res.status(500).json({
        message: 'Error al dar de baja la tarifa',
        error: error.message,
      });
    }
  };
}