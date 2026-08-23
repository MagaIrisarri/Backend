import { Router } from 'express';
import { validateSchema } from '../Shared/middlewares/ValidateSchemas.js';
import { orm } from '../Shared/db/orm.js';

import { ReservationController } from './Reservation.Controller.js';
import { ReservationRepository } from './Reservation.Repository.js';
import { ReservationService } from './Reservation.Service.js';
import { createReservationSchema, updateReservationSchema, reservationIdSchema} from './Reservation.Schema.js';

export const reservationRouter = Router();

const reservationRepository = new ReservationRepository(orm.em);
const reservationService = new ReservationService(reservationRepository);
const reservationController = new ReservationController(reservationService);

reservationRouter.get('/', reservationController.findAll);
reservationRouter.get('/:id', validateSchema(reservationIdSchema), reservationController.findOne);
reservationRouter.post('/', validateSchema(createReservationSchema), reservationController.create);
reservationRouter.put('/:id', validateSchema(reservationIdSchema), validateSchema(updateReservationSchema), reservationController.update);
reservationRouter.patch('/:id', validateSchema(reservationIdSchema), validateSchema(updateReservationSchema), reservationController.update);
reservationRouter.delete('/:id', validateSchema(reservationIdSchema), reservationController.remove);

export default reservationRouter;