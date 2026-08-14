import { Router } from 'express';
import { InsuranceController } from './Insurance.Controller.js';
import { orm } from '../../Shared/db/orm.js'; 

export const insuranceRouter = Router();
const controller = new InsuranceController(orm.em.fork());

insuranceRouter.get('/', controller.getAll);
insuranceRouter.post('/', controller.create);
insuranceRouter.delete('/:id', controller.delete);