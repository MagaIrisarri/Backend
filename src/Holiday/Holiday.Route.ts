import { Router } from 'express';
import { validateSchema } from '../Shared/middlewares/ValidateSchemas.js';
import { orm } from '../Shared/db/orm.js';
import { scheduleService } from '../EmployeeShift/EmployeeShift.Route.js';
import { HolidayController } from './Holiday.Controller.js';
import { HolidayService } from './Holiday.Service.js';
import { listHolidaysSchema, createHolidaySchema, holidayIdSchema, holidayOpenSchema } from './Holiday.Schema.js';

export const holidayRouter = Router();
const controller = new HolidayController(new HolidayService(orm.em), scheduleService);

holidayRouter.get('/', validateSchema(listHolidaysSchema), controller.list);
holidayRouter.post('/', validateSchema(createHolidaySchema), controller.create);
holidayRouter.delete('/:id', validateSchema(holidayIdSchema), controller.remove);
holidayRouter.put('/:id/parkings/:parkingId', validateSchema(holidayOpenSchema), controller.setOpen);

export default holidayRouter;
