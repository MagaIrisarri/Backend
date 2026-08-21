import { Router } from 'express';
import { InsuranceController } from './Insurance.Controller.js';
import { InsuranceService } from './Insurance.Service.js';
import { InsuranceRepository } from './Insurance.Repository.js';
import { orm } from '../../Shared/db/orm.js'; 
import { validateSchema } from '../../Shared/middlewares/ValidateSchemas.js';
import { createInsuranceSchema, insuranceIdSchema } from './Insurance.Schema.js';

export const insuranceRouter = Router();

const em = orm.em.fork();
const insuranceRepository = new InsuranceRepository(em);
const insuranceService = new InsuranceService(insuranceRepository);
const controller = new InsuranceController(insuranceService);

insuranceRouter.get('/', controller.getAll);
insuranceRouter.post('/', validateSchema(createInsuranceSchema), controller.create);
insuranceRouter.delete('/:id', validateSchema(insuranceIdSchema), controller.delete);