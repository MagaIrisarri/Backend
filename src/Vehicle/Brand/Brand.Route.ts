import { Router } from 'express';
import { BrandController } from './Brand.Controller.js';
import { orm } from '../../Shared/db/orm.js';

export const brandRouter = Router();
const controller = new BrandController(orm.em.fork());

brandRouter.get('/', controller.getAll);