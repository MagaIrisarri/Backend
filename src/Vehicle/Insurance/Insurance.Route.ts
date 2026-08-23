import { Router } from 'express';
import { orm } from '../../Shared/db/orm.js'; 
import { validateSchema } from '../../Shared/middlewares/ValidateSchemas.js';

import { InsuranceController } from './Insurance.Controller.js';
import { InsuranceRepository } from './Insurance.Repository.js';
import { InsuranceService } from './Insurance.Service.js';
import { createInsuranceSchema, insuranceIdSchema } from './Insurance.Schema.js';


export const insuranceRouter = Router();

const insuranceRepository = new InsuranceRepository(orm.em);
const insuranceService = new InsuranceService(insuranceRepository);
const insuranceController = new InsuranceController(insuranceService);

insuranceRouter.get('/', insuranceController.getAll);
insuranceRouter.post('/', validateSchema(createInsuranceSchema), insuranceController.create);
insuranceRouter.delete('/:id', validateSchema(insuranceIdSchema), insuranceController.delete);