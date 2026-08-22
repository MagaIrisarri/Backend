import { Router } from "express";
import { EmployeeShiftController } from "./EmployeeShift.Controller.js";
import { EmployeeShiftService } from "./EmployeeShift.Service.js";
import { EmployeeShiftRepository } from "./EmployeeShift.Repository.js";
import { orm } from "../Shared/db/orm.js";
import { validateSchema } from "../Shared/middlewares/ValidateSchemas.js";
import { createShiftSchema, shiftIdSchema, parkingDaySchema } from "./EmployeeShift.Schema.js";

export const employeeShiftRouter = Router();

const em = orm.em.fork();
const repository = new EmployeeShiftRepository(em);
const service = new EmployeeShiftService(repository);
const controller = new EmployeeShiftController(service);

employeeShiftRouter.post('/', validateSchema(createShiftSchema), controller.create);
employeeShiftRouter.get('/parkings/:parkingId/coverage/:dayOfWeek', validateSchema(parkingDaySchema), controller.getCoverage);
employeeShiftRouter.delete('/:id', validateSchema(shiftIdSchema), controller.remove);

export default employeeShiftRouter;