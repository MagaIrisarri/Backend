import { Router } from 'express';
import { ReservationController } from './Reservation.Controller.js';
import { ReservationService } from './Reservation.Service.js';
import { ReservationRepository } from './Reservation.Repository.js';
import { orm } from '../Shared/db/orm.js';
import { validateSchema } from '../Shared/middlewares/ValidateSchemas.js';
import {
  createReservationSchema,
  updateReservationSchema,
  reservationIdSchema,
} from './Reservation.Schema.js';

export const reservationRouter = Router();

const em = orm.em.fork();
const repository = new ReservationRepository(em);
const service = new ReservationService(repository);
const controller = new ReservationController(service);

reservationRouter.get('/', controller.findAll);
reservationRouter.get('/:id', validateSchema(reservationIdSchema), controller.findOne);
reservationRouter.post('/', validateSchema(createReservationSchema), controller.create);
reservationRouter.put('/:id', validateSchema(reservationIdSchema), validateSchema(updateReservationSchema), controller.update);
reservationRouter.patch('/:id', validateSchema(reservationIdSchema), validateSchema(updateReservationSchema), controller.update);
reservationRouter.delete('/:id', validateSchema(reservationIdSchema), controller.remove);

export default reservationRouter;