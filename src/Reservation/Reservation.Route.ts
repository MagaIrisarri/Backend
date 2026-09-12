import { Router } from 'express';
import { validateSchema } from '../Shared/middlewares/ValidateSchemas.js';
import { orm } from '../Shared/db/orm.js';

import { ReservationController } from './Reservation.Controller.js';
import { ReservationRepository } from './Reservation.Repository.js';
import { ReservationService } from './Reservation.Service.js';
import { createReservationSchema, updateReservationSchema, reservationIdSchema} from './Reservation.Schema.js';

import { InvoiceRepository } from '../Invoice/Invoice.Repository.js';

export const reservationRouter = Router();

const reservationRepository = new ReservationRepository(orm.em);
const invoiceRepository = new InvoiceRepository(orm.em);
const reservationService = new ReservationService(reservationRepository, invoiceRepository);
const reservationController = new ReservationController(reservationService);

reservationRouter.get('/', reservationController.findAll);
reservationRouter.get('/client/:clientId', reservationController.findByClientId);
reservationRouter.get('/parking/:parkingId', reservationController.findByParkingId);
reservationRouter.get('/owner/:ownerId', reservationController.findByOwnerId);
reservationRouter.get('/:id', validateSchema(reservationIdSchema), reservationController.findOne);
reservationRouter.post('/', validateSchema(createReservationSchema), reservationController.create);
reservationRouter.post('/:id/check-in', validateSchema(reservationIdSchema), reservationController.checkIn);
reservationRouter.post('/:id/check-out', validateSchema(reservationIdSchema), reservationController.checkOut);
reservationRouter.put('/:id', validateSchema(reservationIdSchema), validateSchema(updateReservationSchema), reservationController.update);
reservationRouter.patch('/:id', validateSchema(reservationIdSchema), validateSchema(updateReservationSchema), reservationController.update);
reservationRouter.delete('/:id', validateSchema(reservationIdSchema), reservationController.remove);

export default reservationRouter;