import { Request, Response } from 'express';
import { NotificationService } from './Notification.Service.js';
import { catchAsync } from '../Shared/utils/catchAsync.js';
import { actorId } from '../Shared/utils/actorId.js';

export class NotificationController {
  constructor(private service: NotificationService) {}

  public list = catchAsync(async (req: Request, res: Response) => {
    const { data, unread } = await this.service.list(actorId(req, 'ver las notificaciones'));
    res.status(200).json({ message: data.length === 0 ? 'No hay notificaciones' : 'Notificaciones encontradas', data, unread });
  });

  public markRead = catchAsync(async (req: Request, res: Response) => {
    await this.service.markRead(req.params.id as string, actorId(req, 'marcar la notificación'));
    res.status(200).json({ message: 'Notificación leída' });
  });

  public markAllRead = catchAsync(async (req: Request, res: Response) => {
    await this.service.markAllRead(actorId(req, 'marcar las notificaciones'));
    res.status(200).json({ message: 'Notificaciones leídas' });
  });
}
