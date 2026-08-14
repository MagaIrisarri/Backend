import { Request, Response } from 'express';
import { EntityManager } from '@mikro-orm/core';
import { Insurance } from './Insurance.Entity.js'; 

export class InsuranceController {
  constructor(private em: EntityManager) {}

  // Obtener todos los seguros
  getAll = async (req: Request, res: Response) => {
    try {
      const seguros = await this.em.find(Insurance, {});
      res.status(200).json(seguros);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  // Crear un nuevo seguro
  create = async (req: Request, res: Response) => {
    try {
      const seguro = this.em.create(Insurance, req.body);
      await this.em.flush();
      res.status(201).json({ message: 'Aseguradora creada con éxito', data: seguro });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };

  // Eliminar un seguro
  delete = async (req: Request, res: Response) => {
    try {
      const seguro = await this.em.findOne(Insurance, { id: req.params.id });
      if (!seguro) {
        return res.status(404).json({ message: 'Aseguradora no encontrada' });
      }
      this.em.remove(seguro);
      await this.em.flush();
      res.status(200).json({ message: 'Aseguradora eliminada correctamente' });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}