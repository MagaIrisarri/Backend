import { UserRepository } from './User.Repository.js';
import { User } from './User.Entity.js';
import argon2 from 'argon2';

export class UserService {
  constructor(private userRepository: UserRepository) {}

  async findAll(): Promise<Omit<User, 'password'>[]> {
    const users = await this.userRepository.findAll();
    return users.map((user: User) => {
      const { password, ...rest } = user;
      return rest;
    });
  }

  async findOne(params: { id: string }): Promise<Omit<User, 'password'> | null> {
    const user = await this.userRepository.findOne(params);
    if (!user) return null;
    const { password, ...rest } = user;
    return rest;
  }

  async addPublicUser(userData: Partial<User>): Promise<Omit<User, 'password'>> {
    const existing = await this.userRepository.findOneForEmail(userData.email!);
    if (existing) throw new Error('El email ya está registrado');

    userData.password = await argon2.hash(userData.password!);
    userData.status = 'ACTIVO';
    userData.type = userData.type || 'CLIENTE';

    const user = await this.userRepository.add(userData);
    const { password, ...rest } = user;
    return rest;
  }

  async addEmployee(userData: Partial<User>, ownerId: string): Promise<Omit<User, 'password'>> {
    const existing = await this.userRepository.findOneForEmail(userData.email!);
    if (existing) throw new Error('El email ya está registrado');

    const owner = await this.userRepository.findOne({ id: ownerId });
    if (!owner || owner.status !== 'ACTIVO' || owner.type !== 'DUEÑO') {
      throw new Error('Dueño no válido o inactivo');
    }

    userData.password = await argon2.hash(userData.password!);
    userData.type = 'EMPLEADO';
    userData.status = 'ACTIVO';
    userData.ownerId = ownerId;

    const user = await this.userRepository.add(userData);
    const { password, ...rest } = user;
    return rest;
  }

  async update(params: { id: string }, userData: Partial<User>): Promise<Omit<User, 'password'> | null> {
    if (userData.password) {
      userData.password = await argon2.hash(userData.password);
    }
    const user = await this.userRepository.update(params.id, userData);
    if (!user) return null;
    const { password, ...rest } = user;
    return rest;
  }

  async updatePassword(id: string, currentPass: string, newPass: string): Promise<boolean> {
    const user = await this.userRepository.findOne({ id });
    if (!user) return false;

    const isValid = await argon2.verify(user.password, currentPass);
    if (!isValid) return false;

    const hashedNew = await argon2.hash(newPass);
    await this.userRepository.update(id, { password: hashedNew });
    return true;
  }

  async remove(params: { id: string }): Promise<boolean> {
    return await this.userRepository.remove(params);
  }

  async login(email: string, pass: string): Promise<Omit<User, 'password'> | { error: string }> {
    const user = await this.userRepository.findOneForEmail(email);
    if (!user) return { error: 'not found' };
    if (user.status !== 'ACTIVO') return { error: 'user not ACTIVO' };

    const isValid = await argon2.verify(user.password, pass);
    if (!isValid) return { error: 'password incorrect' };

    const { password, ...rest } = user;
    return rest;
  }

  async findEmployeesByOwner(ownerId: string): Promise<Omit<User, 'password'>[]> {
    const users = await this.userRepository.findByOwner(ownerId);
    return users.map((user: User) => {
      const { password, ...rest } = user;
      return rest;
    });
  }
}