import { Router } from 'express';
import { orm } from '../Shared/db/orm.js';
import { validateSchema } from '../Shared/middlewares/ValidateSchemas.js';
import { auth, self, ownParking } from '../Shared/middlewares/auth.js';
import { UserType } from '../Shared/constants/status.js';

import { ParkingController } from './Parking.Controller.js';
import { ParkingRepository } from './Parking.Repository.js';
import { ParkingService } from './Parking.Service.js';
import { ParkingSpaceRepository } from '../ParkingSpace/ParkingSpace.Repository.js';
import { notificationService } from '../Notification/Notification.Route.js';
import { createParkingSchema, updateParkingSchema, parkingIdSchema, parkingIdOwnerSchema, listParkingsQuerySchema, pauseParkingSchema } from './Parking.Schema.js';

export const parkingRouter = Router();

const parkingRepository = new ParkingRepository(orm.em);
const parkingSpaceRepository = new ParkingSpaceRepository(orm.em);
// Compartido con las reservas: el aviso de sucursal llena usa sus plazas libres en vivo.
export const parkingService = new ParkingService(parkingRepository, parkingSpaceRepository, notificationService);
const parkingController = new ParkingController(parkingService);

parkingRouter.get('/', auth(UserType.ADMINISTRADOR), validateSchema(listParkingsQuerySchema), parkingController.findAll);
parkingRouter.get('/active', parkingController.findActive);
parkingRouter.get('/:id/metrics', auth(UserType.DUENO, UserType.ADMINISTRADOR), ownParking((req) => req.params.id), validateSchema(parkingIdSchema), parkingController.getMetrics);
parkingRouter.post('/:id/reactivate', auth(UserType.DUENO), ownParking((req) => req.params.id), validateSchema(parkingIdSchema), parkingController.reactivate);
parkingRouter.get('/owner/:ownerId', auth(UserType.DUENO, UserType.ADMINISTRADOR), self('ownerId'), validateSchema(parkingIdOwnerSchema), parkingController.findByOwnerId);
parkingRouter.get('/:id', validateSchema(parkingIdSchema), parkingController.findOne);
parkingRouter.post('/', auth(UserType.DUENO), self('ownerId'), validateSchema(createParkingSchema), parkingController.create);
parkingRouter.put('/:id', auth(UserType.DUENO), ownParking((req) => req.params.id), validateSchema(parkingIdSchema), validateSchema(updateParkingSchema), parkingController.update);
parkingRouter.delete('/:id', auth(UserType.DUENO), ownParking((req) => req.params.id), validateSchema(pauseParkingSchema), parkingController.remove);


export default parkingRouter;