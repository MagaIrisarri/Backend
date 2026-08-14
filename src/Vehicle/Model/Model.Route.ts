import { Router } from 'express';
import { ModelController  } from './Model.Controller.js';
import { orm } from '../../Shared/db/orm.js';
import { Model } from './Model.Entity.js';

export const modelRouter = Router();

const controller = new ModelController(orm.em.fork());

modelRouter.get('/', controller.getAll);

// Si el frontend necesita buscar modelos por marca (ej: cuando eliges "Toyota"):
modelRouter.get('/brand/:brandId', async (req, res) => {
  const em = orm.em.fork();
  try {
    const modelos = await em.find(Model, { brand: req.params.brandId }, {
      populate: ['vehicleType']
    });
    res.status(200).json(modelos);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});