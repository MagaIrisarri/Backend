import { Router } from "express";
import { validateSchema } from "../Shared/middlewares/ValidateSchemas.js";
import { auth, self, ownParking, parkingOf } from '../Shared/middlewares/auth.js';
import { EmployeeShift } from './EmployeeShift.Entity.js';
import { ShiftClosure } from './ShiftClosure.Entity.js';
import { UserType } from '../Shared/constants/status.js';
import { orm } from "../Shared/db/orm.js";
import { notificationService } from '../Notification/Notification.Route.js';

import { EmployeeShiftController } from "./EmployeeShift.Controller.js";
import { EmployeeShiftRepository } from "./EmployeeShift.Repository.js";
import { EmployeeShiftService } from "./EmployeeShift.Service.js";
import { createShiftSchema, updateShiftSchema, shiftIdSchema, parkingDaySchema } from "./EmployeeShift.Schema.js";
import { ScheduleController } from "./Schedule.Controller.js";
import { ScheduleRepository } from "./Schedule.Repository.js";
import { ScheduleService } from "./Schedule.Service.js";
import { dayParamsSchema, saveDaySchema, createClosureSchema, closureIdSchema, parkingIdParamSchema, rangeSchema, saveTemplateDaySchema } from "./Schedule.Schema.js";

export const employeeShiftRouter = Router();

export const scheduleService = new ScheduleService(new ScheduleRepository(orm.em), notificationService);

const employeeShiftRepository = new EmployeeShiftRepository(orm.em);
const employeeShiftService = new EmployeeShiftService(employeeShiftRepository, scheduleService);
const employeeShiftController = new EmployeeShiftController(employeeShiftService);
const scheduleController = new ScheduleController(scheduleService);

// Calendario por fecha y cierres de la semana tipo (antes de '/:id')
employeeShiftRouter.get('/config', auth(UserType.DUENO), scheduleController.config);
employeeShiftRouter.get('/day/:parkingId/:date', auth(UserType.DUENO), ownParking((req) => req.params.parkingId), validateSchema(dayParamsSchema), scheduleController.getDay);
employeeShiftRouter.put('/day/:parkingId/:date', auth(UserType.DUENO), ownParking((req) => req.params.parkingId), validateSchema(saveDaySchema), scheduleController.saveDay);
employeeShiftRouter.delete('/day/:parkingId/:date', auth(UserType.DUENO), ownParking((req) => req.params.parkingId), validateSchema(dayParamsSchema), scheduleController.resetDay);
employeeShiftRouter.get('/range/:parkingId', auth(UserType.DUENO), ownParking((req) => req.params.parkingId), validateSchema(rangeSchema), scheduleController.getRange);
employeeShiftRouter.get('/template/:parkingId', auth(UserType.DUENO), ownParking((req) => req.params.parkingId), validateSchema(parkingIdParamSchema), scheduleController.getTemplate);
employeeShiftRouter.put('/template/:parkingId/:dayOfWeek', auth(UserType.DUENO), ownParking((req) => req.params.parkingId), validateSchema(saveTemplateDaySchema), scheduleController.saveTemplateDay);
employeeShiftRouter.get('/closures/:parkingId', auth(UserType.DUENO), ownParking((req) => req.params.parkingId), validateSchema(parkingIdParamSchema), scheduleController.listClosures);
employeeShiftRouter.post('/closures', auth(UserType.DUENO), ownParking((req) => req.body?.parkingId), validateSchema(createClosureSchema), scheduleController.createClosure);
employeeShiftRouter.delete('/closures/:id', auth(UserType.DUENO), ownParking(parkingOf(ShiftClosure)), validateSchema(closureIdSchema), scheduleController.removeClosure);


employeeShiftRouter.get('/coverage/:parkingId/:dayOfWeek', auth(UserType.DUENO), ownParking((req) => req.params.parkingId), validateSchema(parkingDaySchema), employeeShiftController.getCoverage);
employeeShiftRouter.get('/employee/:employeeId', auth(), self('employeeId'), employeeShiftController.findByEmployeeId);


employeeShiftRouter.get('/', auth(UserType.ADMINISTRADOR), employeeShiftController.findAll); // todas las cocheras
employeeShiftRouter.get('/:id', auth(UserType.DUENO), ownParking(parkingOf(EmployeeShift)), validateSchema(shiftIdSchema), employeeShiftController.findOne);
employeeShiftRouter.post('/', auth(UserType.DUENO), ownParking((req) => req.body?.parkingId), validateSchema(createShiftSchema), employeeShiftController.create);
employeeShiftRouter.put('/:id', auth(UserType.DUENO), ownParking(parkingOf(EmployeeShift)), validateSchema(shiftIdSchema), validateSchema(updateShiftSchema), employeeShiftController.update);
employeeShiftRouter.patch('/:id', auth(UserType.DUENO), ownParking(parkingOf(EmployeeShift)), validateSchema(shiftIdSchema), validateSchema(updateShiftSchema), employeeShiftController.update);
employeeShiftRouter.delete('/:id', auth(UserType.DUENO), ownParking(parkingOf(EmployeeShift)), validateSchema(shiftIdSchema), employeeShiftController.remove);

export default employeeShiftRouter;