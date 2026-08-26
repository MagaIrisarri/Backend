import { Request, Response } from 'express';
import { ModelService } from './Model.Service.js';

export class ModelController {
  constructor(private modelService: ModelService) {}

  public findAll = async (req: Request, res: Response) => {
    try {
      const brandId = req.query.brandId as string; 
      const models = await this.modelService.findAll(brandId);
      
      res.status(200).json({ data: models });
    } catch (error: any) {
      res.status(500).json({ message: 'Error encontrando modelos', error: error.message });
    }
  };

  public findOne = async (req: Request, res: Response) => {
    try {
      const model = await this.modelService.findOne(req.params.id as string);
      
      if (!model) {
        return res.status(404).json({ message: 'Modelo no encontrado' });
      }
      
      res.status(200).json({ data: model });
    } catch (error: any) {
      res.status(500).json({ message: 'Error encontrando modelo', error: error.message });
    }
  };

  public create = async (req: Request, res: Response) => {
    try {
      const model = await this.modelService.create(req.body);
      res.status(201).json({ message: 'Modelo creado Exitosamente', data: model });
    } catch (error: any) {
      res.status(500).json({ message: 'Error al crear modelo', error: error.message });
    }
  };

  public update = async (req: Request, res: Response) => {
    try {
      const updatedModel = await this.modelService.update(req.params.id as string, req.body);
      
      if (!updatedModel) {
        return res.status(404).json({ message: 'Modelo no Encontrado' });
      }
      
      res.status(200).json({ message: 'Modelo actualizado Exitosamente', data: updatedModel });
    } catch (error: any) {
      res.status(500).json({ message: 'Error actualizando modelo', error: error.message });
    }
  };

  public remove = async (req: Request, res: Response) => {
    try {
      const deleted = await this.modelService.remove(req.params.id as string);
      
      if (!deleted) {
        return res.status(404).json({ message: 'Modelo no encontrado' });
      }
      
      res.status(200).json({ message: 'Modelo Elimnado Exitosamente' });
    } catch (error: any) {
      res.status(500).json({ message: 'Error Eliminando modelo', error: error.message });
    }
  };

  

}