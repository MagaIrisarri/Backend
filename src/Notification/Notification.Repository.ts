import { EntityManager } from '@mikro-orm/core';
import { Notification } from './Notification.Entity.js';
import { User } from '../User/User.Entity.js';
import { UserStatus, UserType } from '../Shared/constants/status.js';
import { NOTIFICATIONS_PAGE_SIZE, NOTIFICATIONS_WINDOW_DAYS } from '../Shared/constants/notifications.js';

export interface NewNotification {
  type: string;
  title: string;
  message: string;
  reservationId?: string | null;
  parkingId?: string | null;
}

// Posición en la lista: fecha y id del último aviso de la página anterior (el id desempata los de la misma fecha).
export interface NotificationCursor { at: Date; id: string }

const DAY_MS = 86_400_000;
// L-31: lista y contador miran la misma ventana, así el número de la campana coincide con lo que se ve.
export const windowStart = (now = Date.now()) => new Date(now - NOTIFICATIONS_WINDOW_DAYS * DAY_MS);

// Todo va con un fork: lo llaman también los timers de R-17 y R-28, que corren sin RequestContext.
export class NotificationRepository {
  constructor(private entityManager: EntityManager) {}

  async createMany(recipientIds: string[], data: NewNotification): Promise<void> {
    const em = this.entityManager.fork();
    for (const id of recipientIds) em.create(Notification, { ...data, recipient: em.getReference(User, id) });
    await em.flush();
  }

  // Una página de la ventana, de la más nueva a la más vieja; `unreadOnly` filtra en el servidor para que no falte ninguna.
  async listFor(userId: string, opts: { unreadOnly?: boolean; after?: NotificationCursor } = {}): Promise<{ items: Notification[]; hasMore: boolean }> {
    const where: any = { recipient: userId, createdAt: { $gte: windowStart() }, ...(opts.unreadOnly && { readAt: null }) };
    if (opts.after) where.$or = [{ createdAt: { $lt: opts.after.at } }, { createdAt: opts.after.at, id: { $lt: opts.after.id } }];
    const rows = await this.entityManager.fork().find(Notification, where,
      { orderBy: { createdAt: 'DESC', id: 'DESC' }, limit: NOTIFICATIONS_PAGE_SIZE + 1 });
    return { items: rows.slice(0, NOTIFICATIONS_PAGE_SIZE), hasMore: rows.length > NOTIFICATIONS_PAGE_SIZE };
  }

  async countUnread(userId: string): Promise<number> {
    return await this.entityManager.fork().count(Notification, { recipient: userId, readAt: null, createdAt: { $gte: windowStart() } });
  }

  // Borra los avisos más viejos que `before` (de todos los usuarios).
  async purgeBefore(before: Date): Promise<number> {
    return await this.entityManager.fork().nativeDelete(Notification, { createdAt: { $lt: before } });
  }

  // null si no existe; con `recipient` para que el servicio verifique de quién es.
  async findOne(id: string): Promise<Notification | null> {
    return await this.entityManager.fork().findOne(Notification, { id });
  }

  async markRead(id: string, at: Date): Promise<void> {
    await this.entityManager.fork().nativeUpdate(Notification, { id, readAt: null }, { readAt: at });
  }

  async markAllRead(userId: string, at: Date): Promise<void> {
    await this.entityManager.fork().nativeUpdate(Notification, { recipient: userId, readAt: null }, { readAt: at });
  }

  // El dueño de la sucursal y sus empleados activos.
  // Los que apagaron ese tipo de aviso desde su perfil (User.mutedNotifications).
  async mutedRecipients(ids: string[], type: string): Promise<Set<string>> {
    const users = await this.entityManager.fork().find(User, { id: { $in: ids } }, { fields: ['id', 'mutedNotifications'] as any });
    return new Set(users.filter((u) => u.mutedNotifications?.includes(type)).map((u) => u.id));
  }

  async findStaffIds(parking: { id: string; owner: { id: string } }): Promise<string[]> {
    const employees = await this.entityManager.fork().find(User, { type: UserType.EMPLEADO, parkingId: parking.id, status: UserStatus.ACTIVO });
    return [parking.owner.id, ...employees.map((e) => e.id)];
  }
}
