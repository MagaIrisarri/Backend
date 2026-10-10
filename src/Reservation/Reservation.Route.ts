import { Router } from 'express';
import { validateSchema } from '../Shared/middlewares/ValidateSchemas.js';
import { orm } from '../Shared/db/orm.js';

import { ReservationController } from './Reservation.Controller.js';
import { ReservationRepository } from './Reservation.Repository.js';
import { ReservationService } from './Reservation.Service.js';
import { createReservationSchema, updateReservationSchema, reservationIdSchema, changeSpaceSchema } from './Reservation.Schema.js';

import { InvoiceRepository } from '../Invoice/Invoice.Repository.js';
import { ParkingPriceRepository } from '../ParkingPrice/ParkingPrice.Repository.js';
import { ParkingSpaceRepository } from '../ParkingSpace/ParkingSpace.Repository.js';
import { scheduleService } from '../EmployeeShift/EmployeeShift.Route.js';

export const reservationRouter = Router();

const reservationRepository = new ReservationRepository(orm.em);
const invoiceRepository = new InvoiceRepository(orm.em);
const parkingPriceRepository = new ParkingPriceRepository(orm.em);
const parkingSpaceRepository = new ParkingSpaceRepository(orm.em);
export const reservationService = new ReservationService(reservationRepository, invoiceRepository, parkingPriceRepository, parkingSpaceRepository, scheduleService);
const reservationController = new ReservationController(reservationService);

reservationRouter.get('/', reservationController.findAll);
reservationRouter.get('/client/:clientId', reservationController.findByClientId);
reservationRouter.get('/parking/:parkingId', reservationController.findByParkingId);
reservationRouter.get('/owner/:ownerId', reservationController.findByOwnerId);
reservationRouter.get('/:id', validateSchema(reservationIdSchema), reservationController.findOne);
reservationRouter.post('/', validateSchema(createReservationSchema), reservationController.create);
reservationRouter.patch('/:id/confirm', validateSchema(reservationIdSchema), reservationController.confirm);
reservationRouter.patch('/:id/space', validateSchema(changeSpaceSchema), reservationController.changeSpace);
reservationRouter.post('/:id/check-in', validateSchema(reservationIdSchema), reservationController.checkIn);
reservationRouter.post('/:id/check-out', validateSchema(reservationIdSchema), reservationController.checkOut);
reservationRouter.put('/:id', validateSchema(reservationIdSchema), validateSchema(updateReservationSchema), reservationController.update);
reservationRouter.patch('/:id', validateSchema(reservationIdSchema), validateSchema(updateReservationSchema), reservationController.update);
reservationRouter.delete('/:id', validateSchema(reservationIdSchema), reservationController.remove);

export default reservationRouter;