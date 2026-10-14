import { Router } from 'express';
import { orm } from '../../Shared/db/orm.js'; 
import { validateSchema } from '../../Shared/middlewares/ValidateSchemas.js';
import { auth } from '../../Shared/middlewares/auth.js';
import { UserType } from '../../Shared/constants/status.js';

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
insuranceRouter.post('/', auth(UserType.ADMINISTRADOR), validateSchema(createInsuranceSchema), insuranceController.create);
insuranceRouter.put('/:id', auth(UserType.ADMINISTRADOR), validateSchema(insuranceIdSchema), validateSchema(updateInsuranceSchema), insuranceController.update);
insuranceRouter.patch('/:id', auth(UserType.ADMINISTRADOR), validateSchema(insuranceIdSchema), validateSchema(updateInsuranceSchema), insuranceController.update);
insuranceRouter.delete('/:id', auth(UserType.ADMINISTRADOR), validateSchema(insuranceIdSchema), insuranceController.remove);

export default insuranceRouter;