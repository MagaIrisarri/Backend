import { Router } from 'express';
import { validateSchema } from '../Shared/middlewares/ValidateSchemas.js';
import { auth, self, ownParking, ownReservation, ownVehicle } from '../Shared/middlewares/auth.js';
import { UserType } from '../Shared/constants/status.js';
import { orm } from '../Shared/db/orm.js';

import { ReservationController } from './Reservation.Controller.js';
import { ReservationRepository } from './Reservation.Repository.js';
import { ReservationService } from './Reservation.Service.js';
import { createReservationSchema, updateReservationSchema, reservationIdSchema, changeSpaceSchema, extendReservationSchema, reservationServicesSchema, rateReservationSchema, walkInSchema } from './Reservation.Schema.js';

import { InvoiceRepository } from '../Invoice/Invoice.Repository.js';
import { ParkingPriceRepository } from '../ParkingPrice/ParkingPrice.Repository.js';
import { ParkingSpaceRepository } from '../ParkingSpace/ParkingSpace.Repository.js';
import { scheduleService } from '../EmployeeShift/EmployeeShift.Route.js';
import { notificationService } from '../Notification/Notification.Route.js';

export const reservationRouter = Router();

const reservationRepository = new ReservationRepository(orm.em);
const invoiceRepository = new InvoiceRepository(orm.em);
const parkingPriceRepository = new ParkingPriceRepository(orm.em);
const parkingSpaceRepository = new ParkingSpaceRepository(orm.em);
export const reservationService = new ReservationService(reservationRepository, invoiceRepository, parkingPriceRepository, parkingSpaceRepository, scheduleService, notificationService);
const reservationController = new ReservationController(reservationService);

reservationRouter.get('/', auth(UserType.ADMINISTRADOR), reservationController.findAll);
reservationRouter.get('/client/:clientId', auth(), self('clientId'), reservationController.findByClientId);
reservationRouter.get('/parking/:parkingId', auth(UserType.DUENO, UserType.EMPLEADO), ownParking((req) => req.params.parkingId, true), reservationController.findByParkingId);
reservationRouter.get('/owner/:ownerId', auth(UserType.DUENO), self('ownerId'), reservationController.findByOwnerId);
reservationRouter.get('/:id', auth(), ownReservation, validateSchema(reservationIdSchema), reservationController.findOne);
reservationRouter.post('/', auth(UserType.CLIENTE), ownVehicle((req) => req.body?.vehicleId), validateSchema(createReservationSchema), reservationController.create);
reservationRouter.post('/walk-in', auth(UserType.DUENO, UserType.EMPLEADO), validateSchema(walkInSchema), reservationController.walkIn);
reservationRouter.patch('/:id/confirm', auth(UserType.DUENO, UserType.EMPLEADO), validateSchema(reservationIdSchema), reservationController.confirm);
reservationRouter.patch('/:id/space', auth(UserType.DUENO, UserType.EMPLEADO), validateSchema(changeSpaceSchema), reservationController.changeSpace);
reservationRouter.patch('/:id/end', auth(UserType.DUENO, UserType.EMPLEADO), validateSchema(extendReservationSchema), reservationController.extend);
reservationRouter.patch('/:id/rating', auth(UserType.CLIENTE), validateSchema(rateReservationSchema), reservationController.rate);
reservationRouter.put('/:id/services', auth(UserType.DUENO, UserType.EMPLEADO), validateSchema(reservationServicesSchema), reservationController.setServices);
reservationRouter.post('/:id/check-in', auth(UserType.DUENO, UserType.EMPLEADO), validateSchema(reservationIdSchema), reservationController.checkIn);
reservationRouter.post('/:id/check-out', auth(UserType.DUENO, UserType.EMPLEADO), validateSchema(reservationIdSchema), reservationController.checkOut);
reservationRouter.put('/:id', auth(UserType.DUENO, UserType.EMPLEADO), validateSchema(reservationIdSchema), validateSchema(updateReservationSchema), reservationController.assignEmployee);
reservationRouter.patch('/:id', auth(UserType.DUENO, UserType.EMPLEADO), validateSchema(reservationIdSchema), validateSchema(updateReservationSchema), reservationController.assignEmployee);
reservationRouter.delete('/:id', auth(), validateSchema(reservationIdSchema), reservationController.remove);

export default reservationRouter;