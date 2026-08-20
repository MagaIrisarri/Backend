import { Request, Response } from 'express';
import { InsuranceService } from './Insurance.Service.js';

export class InsuranceController {
  
  constructor(private insuranceService: InsuranceService) {}

  getAll = async (req: Request, res: Response) => {
    try {
      const seguros = await this.insuranceService.findAll();
      res.status(200).json(seguros);
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

  delete = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const isDeleted = await this.insuranceService.delete(id);
      
      if (!isDeleted) {
        return res.status(404).json({ message: 'Aseguradora no encontrada' });
      }
      
      res.status(200).json({ message: 'Aseguradora eliminada correctamente' });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}