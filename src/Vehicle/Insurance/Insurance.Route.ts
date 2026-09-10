import { Router } from 'express';
import { orm } from '../../Shared/db/orm.js'; 
import { validateSchema } from '../../Shared/middlewares/ValidateSchemas.js';

import { InsuranceController } from './Insurance.Controller.js';
import { InsuranceRepository } from './Insurance.Repository.js';
import { InsuranceService } from './Insurance.Service.js';
import { createInsuranceSchema, updateInsuranceSchema, insuranceIdSchema } from './Insurance.Schema.js';

export const insuranceRouter = Router();

const insuranceRepository = new InsuranceRepository(orm.em);
const insuranceService = new InsuranceService(insuranceRepository);
const insuranceController = new InsuranceController(insuranceService);

insuranceRouter.get('/', insuranceController.findAll);
insuranceRouter.get('/:id', validateSchema(insuranceIdSchema), insuranceController.findOne);
insuranceRouter.post('/', validateSchema(createInsuranceSchema), insuranceController.create);
insuranceRouter.put('/:id', validateSchema(insuranceIdSchema), validateSchema(updateInsuranceSchema), insuranceController.update);
insuranceRouter.patch('/:id', validateSchema(insuranceIdSchema), validateSchema(updateInsuranceSchema), insuranceController.update);
insuranceRouter.delete('/:id', validateSchema(insuranceIdSchema), insuranceController.remove);

export default insuranceRouter;