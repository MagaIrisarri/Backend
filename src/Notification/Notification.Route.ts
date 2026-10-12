import { Router } from 'express';
import { validateSchema } from '../Shared/middlewares/ValidateSchemas.js';
import { orm } from '../Shared/db/orm.js';

import { NotificationController } from './Notification.Controller.js';
import { NotificationRepository } from './Notification.Repository.js';
import { NotificationService } from './Notification.Service.js';
import { notificationIdSchema } from './Notification.Schema.js';

export const notificationRouter = Router();

const notificationRepository = new NotificationRepository(orm.em);
// Compartido con las reservas, que son quienes generan los avisos.
export const notificationService = new NotificationService(notificationRepository);
const notificationController = new NotificationController(notificationService);

notificationRouter.get('/', notificationController.list);
notificationRouter.post('/read-all', notificationController.markAllRead);
notificationRouter.patch('/:id/read', validateSchema(notificationIdSchema), notificationController.markRead);

export default notificationRouter;
