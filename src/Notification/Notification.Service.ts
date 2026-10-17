import { NotificationRepository, type NewNotification, type NotificationCursor } from './Notification.Repository.js';
import { AppError } from '../Shared/utils/AppError.js';
import { NOTIFICATIONS_RETENTION_DAYS } from '../Shared/constants/notifications.js';

// Cursor de la API: "<fecha ISO>_<id>" del último aviso de la página anterior.
const encodeCursor = (n: { createdAt?: Date; id: string }) => `${n.createdAt!.toISOString()}_${n.id}`;
export const decodeCursor = (raw: string): NotificationCursor => {
  const [iso, id] = raw.split('_');
  const at = new Date(iso ?? '');
  if (!id || Number.isNaN(at.getTime())) throw new AppError('Cursor de notificaciones inválido', 400);
  return { at, id };
};

export class NotificationService {
  constructor(private repo: NotificationRepository) {}

  // Nunca lanza: el hecho que se avisa (una reserva, una cancelación) ya se guardó y un fallo acá no debe revertirlo ni responder error.
  async notify(recipientIds: string[], data: NewNotification): Promise<void> {
    const unique = [...new Set(recipientIds.filter(Boolean))];
    if (!unique.length) return;
    try {
      const muted = await this.repo.mutedRecipients(unique, data.type); // quien apagó ese aviso en su perfil
      const ids = unique.filter((id) => !muted.has(id));
      if (!ids.length) return;
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

  // L-31: últimos NOTIFICATIONS_WINDOW_DAYS días, de a páginas (`next` sigue la lista); `unread` cuenta sobre la misma ventana.
  async list(userId: string, opts: { unreadOnly?: boolean; cursor?: string } = {}) {
    const after = opts.cursor ? decodeCursor(opts.cursor) : undefined;
    const [{ items, hasMore }, unread] = await Promise.all([this.repo.listFor(userId, { unreadOnly: opts.unreadOnly, after }), this.repo.countUnread(userId)]);
    return { data: items, unread, next: hasMore ? encodeCursor(items[items.length - 1]!) : null };
  }

  // Borra los avisos de más de NOTIFICATIONS_RETENTION_DAYS días; lo corre un timer al arrancar y una vez por día.
  async purgeOld(now = Date.now()): Promise<number> {
    return await this.repo.purgeBefore(new Date(now - NOTIFICATIONS_RETENTION_DAYS * 86_400_000));
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
