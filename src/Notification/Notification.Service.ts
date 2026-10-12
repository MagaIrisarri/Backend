import { NotificationRepository, type NewNotification } from './Notification.Repository.js';
import { AppError } from '../Shared/utils/AppError.js';

export class NotificationService {
  constructor(private repo: NotificationRepository) {}

  // Nunca lanza: el hecho que se avisa (una reserva, una cancelación) ya se guardó y un fallo acá no debe revertirlo ni responder error.
  async notify(recipientIds: string[], data: NewNotification): Promise<void> {
    const ids = [...new Set(recipientIds.filter(Boolean))];
    if (!ids.length) return;
    try {
      await this.repo.createMany(ids, data);
    } catch (err) {
      console.error(`No se pudo crear la notificación ${data.type}:`, err);
    }
  }

  // El dueño y los empleados activos de la sucursal; `exceptId` es quien hizo la acción y no necesita el aviso.
  async notifyStaff(parking: { id: string; owner: { id: string } }, data: NewNotification, exceptId?: string): Promise<void> {
    try {
      const ids = (await this.repo.findStaffIds(parking)).filter((id) => id !== exceptId);
      await this.notify(ids, data);
    } catch (err) {
      console.error(`No se pudo avisar al personal (${data.type}):`, err);
    }
  }

  async list(userId: string) {
    const [data, unread] = await Promise.all([this.repo.listFor(userId), this.repo.countUnread(userId)]);
    return { data, unread };
  }

  async markRead(id: string, userId: string): Promise<void> {
    const notification = await this.repo.findOne(id);
    if (!notification) throw new AppError('Notificación no encontrada', 404);
    if (notification.recipient.id !== userId) throw new AppError('Esta notificación es de otro usuario', 403);
    await this.repo.markRead(id, new Date());
  }

  async markAllRead(userId: string): Promise<void> {
    await this.repo.markAllRead(userId, new Date());
  }
}
