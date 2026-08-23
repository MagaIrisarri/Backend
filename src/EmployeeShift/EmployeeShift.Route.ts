import { Router } from "express";
import { validateSchema } from "../Shared/middlewares/ValidateSchemas.js";
import { orm } from "../Shared/db/orm.js";

import { EmployeeShiftController } from "./EmployeeShift.Controller.js";
import { EmployeeShiftRepository } from "./EmployeeShift.Repository.js";
import { EmployeeShiftService } from "./EmployeeShift.Service.js";
import { createShiftSchema, shiftIdSchema, parkingDaySchema } from "./EmployeeShift.Schema.js";

export const employeeShiftRouter = Router();

const employeeShiftRepository = new EmployeeShiftRepository(orm.em);
const employeeShiftService = new EmployeeShiftService(employeeShiftRepository);
const employeeShiftController = new EmployeeShiftController(employeeShiftService);

employeeShiftRouter.get('/coverage/:parkingId/:dayOfWeek', validateSchema(parkingDaySchema), employeeShiftController.getCoverage);
employeeShiftRouter.post('/', validateSchema(createShiftSchema), employeeShiftController.create);
employeeShiftRouter.delete('/:id', validateSchema(shiftIdSchema), employeeShiftController.remove);

export default employeeShiftRouter;