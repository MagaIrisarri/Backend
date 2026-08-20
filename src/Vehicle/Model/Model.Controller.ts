import { Request, Response } from 'express';
import { ModelService } from './Model.Service.js';

export class ModelController {
 constructor(private modelService: ModelService) {}

  public findAll = async (req: Request, res: Response) => {
    try {
      const brandId = req.query.brandId as string; 
      const models = await this.modelService.findAllModels(brandId);
      
      res.status(200).json({ data: models });
    } catch (error: any) {
      res.status(500).json({ message: 'Error fetching models', error: error.message });
    }
  };

  public findById = async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const model = await this.modelService.findModelById({id: req.params.id as string});
      
      if (!model) {
        return res.status(404).json({ message: 'Model not found' });
      }
      
      res.status(200).json({ data: model });
    } catch (error: any) {
      res.status(500).json({ message: 'Error fetching model', error: error.message });
    }
  };

  public create = async (req: Request, res: Response) => {
    try {
      const model = await this.modelService.createModel(req.body);
      res.status(201).json({ message: 'Model created successfully', data: model });
    } catch (error: any) {
      res.status(500).json({ message: 'Error creating model', error: error.message });
    }
  };

  public update = async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const updatedModel = await this.modelService.updateModel({ id: req.params.id as string }, req.body);
      
      if (!updatedModel) {
        return res.status(404).json({ message: 'Model not found' });
      }
      
      res.status(200).json({ message: 'Model updated successfully', data: updatedModel });
    } catch (error: any) {
      res.status(500).json({ message: 'Error updating model', error: error.message });
    }
  };

  public delete = async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const deleted = await this.modelService.deleteModel({ id: req.params.id as string });
      
      if (!deleted) {
        return res.status(404).json({ message: 'Model not found' });
      }
      
      res.status(200).json({ message: 'Model deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ message: 'Error deleting model', error: error.message });
    }
  };
}