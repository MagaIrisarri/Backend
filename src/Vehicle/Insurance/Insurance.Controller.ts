import { Request, Response } from 'express';
import { InsuranceService } from './Insurance.Service.js';

export class InsuranceController {
  constructor(private insuranceService: InsuranceService) {}

  findAll = async (_req: Request, res: Response) => {
    try {
      const seguros = await this.insuranceService.findAll();
      res.status(200).json({ data: seguros });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  findOne = async (req: Request, res: Response) => {
    try {
      const seguro = await this.insuranceService.findOne(req.params.id as string);
      if (!seguro) {
        return res.status(404).json({ message: 'Aseguradora no encontrada' });
      }
      res.status(200).json({ data: seguro });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  create = async (req: Request, res: Response) => {
    try {
      const seguro = await this.insuranceService.create(req.body);
      res.status(201).json({ message: 'Aseguradora creada con éxito', data: seguro });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  update = async (req: Request, res: Response) => {
    try {
      const seguro = await this.insuranceService.update(req.params.id as string, req.body);
      if (!seguro) {
        return res.status(404).json({ message: 'Aseguradora no encontrada' });
      }
      res.status(200).json({ message: 'Aseguradora actualizada exitosamente', data: seguro });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  remove = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const isDeleted = await this.insuranceService.remove(id);
      
      if (!isDeleted) {
        return res.status(404).json({ message: 'Aseguradora no encontrada' });
      }
      
      res.status(200).json({ message: 'Aseguradora eliminada correctamente' });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}