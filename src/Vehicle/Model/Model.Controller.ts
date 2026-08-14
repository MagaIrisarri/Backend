import { Request, Response } from 'express';
import { EntityManager } from '@mikro-orm/core';
import { Model } from './Model.Entity.js'; // Ajusta el nombre de tu entidad

export class ModelController {
  constructor(private em: EntityManager) {}

  getAll = async (req: Request, res: Response) => {
    try {
      // El 'populate' hace la magia de traer los datos de las tablas relacionadas
      const modelos = await this.em.find(Model, {}, { 
        populate: ['brand', 'vehicleType'] 
      });
      res.status(200).json(modelos);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  };
}