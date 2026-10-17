import { Router } from 'express';
import { validateSchema } from '../../Shared/middlewares/ValidateSchemas.js';
import { auth } from '../../Shared/middlewares/auth.js';
import { UserType } from '../../Shared/constants/status.js';
import { orm } from '../../Shared/db/orm.js'; 

import { VehicleTypeController } from './VehicleType.Controller.js';
import { VehicleTypeRepository } from './VehicleType.Repository.js';
import { VehicleTypeService } from './VehicleType.Service.js';
import {
  createVehicleTypeSchema, notAdmittedDescriptionsSchema, updateVehicleTypeSchema, vehicleTypeDescriptionsSchema, vehicleTypeIdSchema,
} from './VehicleType.Schema.js';

export const vehicleTypeRouter = Router();

const vehicleTypeRepository = new VehicleTypeRepository(orm.em);
const vehicleTypeService = new VehicleTypeService(vehicleTypeRepository);
const vehicleTypeController = new VehicleTypeController(vehicleTypeService);

vehicleTypeRouter.get('/', vehicleTypeController.findAll);
// L-33: descripciones del DNRPA no admitidas (la importación omite sus modelos). Antes de /:id.
vehicleTypeRouter.get('/not-admitted/descriptions', auth(UserType.ADMINISTRADOR), vehicleTypeController.descriptions);
vehicleTypeRouter.put('/not-admitted/descriptions', auth(UserType.ADMINISTRADOR), validateSchema(notAdmittedDescriptionsSchema), vehicleTypeController.setDescriptions);
vehicleTypeRouter.get('/:id', validateSchema(vehicleTypeIdSchema), vehicleTypeController.findOne);
vehicleTypeRouter.post('/', auth(UserType.ADMINISTRADOR), validateSchema(createVehicleTypeSchema), vehicleTypeController.create);
vehicleTypeRouter.put('/:id', auth(UserType.ADMINISTRADOR), validateSchema(vehicleTypeIdSchema), validateSchema(updateVehicleTypeSchema), vehicleTypeController.update);
vehicleTypeRouter.patch('/:id', auth(UserType.ADMINISTRADOR), validateSchema(vehicleTypeIdSchema), validateSchema(updateVehicleTypeSchema), vehicleTypeController.update);
// RA-26: qué descripciones del DNRPA van a este tipo (reasigna modelos y vehículos; 409 con reservas activas).
vehicleTypeRouter.get('/:id/descriptions', auth(UserType.ADMINISTRADOR), validateSchema(vehicleTypeIdSchema), vehicleTypeController.descriptions);
vehicleTypeRouter.put('/:id/descriptions', auth(UserType.ADMINISTRADOR), validateSchema(vehicleTypeDescriptionsSchema), vehicleTypeController.setDescriptions);
vehicleTypeRouter.delete('/:id', auth(UserType.ADMINISTRADOR), validateSchema(vehicleTypeIdSchema), vehicleTypeController.remove);

export default vehicleTypeRouter;