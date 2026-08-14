import { Request, Response } from 'express';
import { EntityManager } from '@mikro-orm/core';
import { Brand } from './Brand.Entity.js'; // Ajusta la ruta si es necesario

export class BrandController {
  constructor(private em: EntityManager) {}

  // Obtener todas las marcas
  getAll = async (req: Request, res: Response) => {
    try {
      const marcas = await this.em.find(Brand, {});
      res.status(200).json(marcas);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  // Crear una nueva marca
  create = async (req: Request, res: Response) => {
    try {
      const marca = this.em.create(Brand, req.body);
      await this.em.flush();
      res.status(201).json({ message: 'Marca creada con éxito', data: marca });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  // Eliminar una marca
  delete = async (req: Request, res: Response) => {
    try {
      const marca = await this.em.findOne(Brand, { id: req.params.id });
      if (!marca) {
        return res.status(404).json({ message: 'Marca no encontrada' });
      }
      this.em.remove(marca);
      await this.em.flush();
      res.status(200).json({ message: 'Marca eliminada correctamente' });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}