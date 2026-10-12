import { EntityManager } from '@mikro-orm/core';
import { Notification } from './Notification.Entity.js';
import { User } from '../User/User.Entity.js';
import { UserStatus, UserType } from '../Shared/constants/status.js';

export interface NewNotification {
  type: string;
  title: string;
  message: string;
  reservationId?: string | null;
}

export const NOTIFICATIONS_LIMIT = 50; // shortcut: L-31, últimas 50 sin purga ni paginación, paginar cuando haya uso real

// Todo va con un fork: lo llaman también los timers de R-17 y R-28, que corren sin RequestContext.
export class NotificationRepository {
  constructor(private entityManager: EntityManager) {}

  async createMany(recipientIds: string[], data: NewNotification): Promise<void> {
    const em = this.entityManager.fork();
    for (const id of recipientIds) em.create(Notification, { ...data, recipient: em.getReference(User, id) });
    await em.flush();
  }

  async listFor(userId: string): Promise<Notification[]> {
    return await this.entityManager.fork().find(Notification, { recipient: userId }, { orderBy: { createdAt: 'DESC' }, limit: NOTIFICATIONS_LIMIT });
  }

  async countUnread(userId: string): Promise<number> {
    return await this.entityManager.fork().count(Notification, { recipient: userId, readAt: null });
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
  async findStaffIds(parking: { id: string; owner: { id: string } }): Promise<string[]> {
    const employees = await this.entityManager.fork().find(User, { type: UserType.EMPLEADO, parkingId: parking.id, status: UserStatus.ACTIVO });
    return [parking.owner.id, ...employees.map((e) => e.id)];
  }
}
