import { EntityManager } from '@mikro-orm/core';
import { Repository } from '../Shared/base.Repository.js';
import { User } from './User.Entity.js';

export class UserRepository implements Repository<User> {
  constructor(private em: EntityManager) {}

  async findAll(): Promise<User[]> {
    return await this.em.find(User, {});
  }

  async findOne(item: { id: string }): Promise<User | null> {
    return await this.em.findOne(User, { id: item.id });
  }

  async add(item: Partial<User>): Promise<User> {
    const user = this.em.create(User, item as any);
    await this.em.flush();
    return user;
  }

  async update(id: string, item: Partial<User>): Promise<User | null> {
    const user = await this.em.findOne(User, { id });
    if (!user) return null;

    this.em.assign(user, item);
    await this.em.flush();
    return user;
  }

  async remove(item: { id: string }): Promise<boolean> {
    const user = await this.em.findOne(User, { id: item.id });
    if (!user) return false;

    this.em.remove(user);
    await this.em.flush();
    return true;
  }
}