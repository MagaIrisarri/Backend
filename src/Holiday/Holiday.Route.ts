import { Router } from 'express';
import { validateSchema } from '../Shared/middlewares/ValidateSchemas.js';
import { auth, ownParking } from '../Shared/middlewares/auth.js';
import { UserType } from '../Shared/constants/status.js';
import { orm } from '../Shared/db/orm.js';
import { scheduleService } from '../EmployeeShift/EmployeeShift.Route.js';
import { notificationService } from '../Notification/Notification.Route.js';
import { HolidayController } from './Holiday.Controller.js';
import { HolidayService } from './Holiday.Service.js';
import { listHolidaysSchema, createHolidaySchema, holidayIdSchema, holidayOpenSchema, importHolidaysSchema } from './Holiday.Schema.js';

export const holidayRouter = Router();
// Compartido con el timer de sincronización del calendario oficial (index.ts).
export const holidayService = new HolidayService(orm.em, notificationService);
const controller = new HolidayController(holidayService, scheduleService);

// R-10: los nacionales los cargan y quitan el administrador; los propios, cada dueño (el servicio decide cuál según quién pide).
holidayRouter.get('/', auth(UserType.DUENO, UserType.ADMINISTRADOR), ownParking((req) => req.query.parkingId), validateSchema(listHolidaysSchema), controller.list);
holidayRouter.post('/', auth(UserType.DUENO, UserType.ADMINISTRADOR), validateSchema(createHolidaySchema), controller.create);
holidayRouter.post('/import', auth(UserType.ADMINISTRADOR), validateSchema(importHolidaysSchema), controller.importOfficial);
holidayRouter.delete('/:id', auth(UserType.DUENO, UserType.ADMINISTRADOR), validateSchema(holidayIdSchema), controller.remove);
holidayRouter.put('/:id/parkings/:parkingId', auth(UserType.DUENO), ownParking((req) => req.params.parkingId), validateSchema(holidayOpenSchema), controller.setOpen);

export default holidayRouter;
