import { Request, Response } from 'express';
import { BrandService } from './Brand.Service.js';

export class BrandController {
  constructor(private brandService: BrandService) {}

  getAll = async (req: Request, res: Response) => {
    try {
      const marcas = await this.brandService.findAll();
      res.status(200).json(marcas);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  create = async (req: Request, res: Response) => {
    try {
      const marca = await this.brandService.create(req.body);
      res.status(201).json({ message: 'Marca creada con éxito', data: marca });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const isDeleted = await this.brandService.delete(id);
      
      if (!isDeleted) {
        return res.status(404).json({ message: 'Marca no encontrada' });
      }
      
      res.status(200).json({ message: 'Marca eliminada correctamente' });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}