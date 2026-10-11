import { Router } from "express";
import { validateSchema } from "../Shared/middlewares/ValidateSchemas.js";
import { orm } from "../Shared/db/orm.js";

import { EmployeeShiftController } from "./EmployeeShift.Controller.js";
import { EmployeeShiftRepository } from "./EmployeeShift.Repository.js";
import { EmployeeShiftService } from "./EmployeeShift.Service.js";
import { createShiftSchema, updateShiftSchema, shiftIdSchema, parkingDaySchema } from "./EmployeeShift.Schema.js";
import { ScheduleController } from "./Schedule.Controller.js";
import { ScheduleRepository } from "./Schedule.Repository.js";
import { ScheduleService } from "./Schedule.Service.js";
import { dayParamsSchema, saveDaySchema, createClosureSchema, closureIdSchema, parkingIdParamSchema, rangeSchema, saveTemplateDaySchema } from "./Schedule.Schema.js";

export const employeeShiftRouter = Router();

export const scheduleService = new ScheduleService(new ScheduleRepository(orm.em));

const employeeShiftRepository = new EmployeeShiftRepository(orm.em);
const employeeShiftService = new EmployeeShiftService(employeeShiftRepository, scheduleService);
const employeeShiftController = new EmployeeShiftController(employeeShiftService);
const scheduleController = new ScheduleController(scheduleService);

// Calendario por fecha y cierres de la semana tipo (antes de '/:id')
employeeShiftRouter.get('/config', scheduleController.config);
employeeShiftRouter.get('/day/:parkingId/:date', validateSchema(dayParamsSchema), scheduleController.getDay);
employeeShiftRouter.put('/day/:parkingId/:date', validateSchema(saveDaySchema), scheduleController.saveDay);
employeeShiftRouter.delete('/day/:parkingId/:date', validateSchema(dayParamsSchema), scheduleController.resetDay);
employeeShiftRouter.get('/range/:parkingId', validateSchema(rangeSchema), scheduleController.getRange);
employeeShiftRouter.get('/template/:parkingId', validateSchema(parkingIdParamSchema), scheduleController.getTemplate);
employeeShiftRouter.put('/template/:parkingId/:dayOfWeek', validateSchema(saveTemplateDaySchema), scheduleController.saveTemplateDay);
employeeShiftRouter.get('/closures/:parkingId', validateSchema(parkingIdParamSchema), scheduleController.listClosures);
employeeShiftRouter.post('/closures', validateSchema(createClosureSchema), scheduleController.createClosure);
employeeShiftRouter.delete('/closures/:id', validateSchema(closureIdSchema), scheduleController.removeClosure);


employeeShiftRouter.get('/coverage/:parkingId/:dayOfWeek', validateSchema(parkingDaySchema), employeeShiftController.getCoverage);
employeeShiftRouter.get('/employee/:employeeId', employeeShiftController.findByEmployeeId);


employeeShiftRouter.get('/', employeeShiftController.findAll);
employeeShiftRouter.get('/:id', validateSchema(shiftIdSchema), employeeShiftController.findOne);
employeeShiftRouter.post('/', validateSchema(createShiftSchema), employeeShiftController.create);
employeeShiftRouter.put('/:id', validateSchema(shiftIdSchema), validateSchema(updateShiftSchema), employeeShiftController.update);
employeeShiftRouter.patch('/:id', validateSchema(shiftIdSchema), validateSchema(updateShiftSchema), employeeShiftController.update);
employeeShiftRouter.delete('/:id', validateSchema(shiftIdSchema), employeeShiftController.remove);

export default employeeShiftRouter;