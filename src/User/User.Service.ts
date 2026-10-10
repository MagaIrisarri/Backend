import { UserRepository } from './User.Repository.js';
import { User } from './User.Entity.js';
import { AppError } from '../Shared/utils/AppError.js';
import { UserStatus, UserType } from '../Shared/constants/status.js';
import argon2 from 'argon2';

export class UserService {
  constructor(private userRepository: UserRepository) {}

  private async createUser(userData: Partial<User>, overrides: Partial<User> = {}): Promise<Omit<User, 'password'>> {
    const existing = await this.userRepository.findOneForEmail(userData.email!);
    if (existing) throw new AppError('El email ya está registrado', 409);

    userData.password = await argon2.hash(userData.password!);
    userData.status = UserStatus.ACTIVO;

    const user = await this.userRepository.add({ ...userData, ...overrides });
    const { password, ...rest } = user;
    return rest;
  }

  private excludePassword(user: User): Omit<User, 'password'> {
    const { password, ...rest } = user;
    return rest;
  }

  async findAll(): Promise<Omit<User, 'password'>[]> {
    const users = await this.userRepository.findAll();
    return users.map((user) => this.excludePassword(user));
  }

  async findOne(params: { id: string }): Promise<Omit<User, 'password'> | null> {
    const user = await this.userRepository.findOne(params);
    if (!user) return null;
    return this.excludePassword(user);
  }

  async findEmployeesByOwner(ownerId: string, status = UserStatus.ACTIVO): Promise<Omit<User, 'password'>[]> {
    const users = await this.userRepository.findByOwner(ownerId, status);
    return users.map((user) => this.excludePassword(user));
  }

  async addPublicUser(userData: Partial<User>): Promise<Omit<User, 'password'>> {
    if (userData.type === UserType.ADMINISTRADOR || userData.type === UserType.EMPLEADO) {
      throw new AppError('No podés registrarte con ese tipo de usuario', 400);
    }
    return this.createUser(userData, { type: userData.type || UserType.CLIENTE });
  }

  async addEmployee(userData: Partial<User>, ownerId: string): Promise<Omit<User, 'password'>> {
    const owner = await this.userRepository.findOne({ id: ownerId });
    if (!owner || owner.status !== UserStatus.ACTIVO || owner.type !== UserType.DUENO) {
      throw new AppError('Dueño no válido o inactivo', 400);
    }
    if (!(await this.userRepository.ownsParking(ownerId, userData.parkingId!))) {
      throw new AppError('El estacionamiento no pertenece a este dueño', 400);
    }

    return this.createUser(userData, { type: UserType.EMPLEADO, ownerId });
  }

  // El empleado debe existir, tener ese estado y pertenecer al dueño
  private async findOwnedEmployee(ownerId: string, id: string, status = UserStatus.ACTIVO): Promise<User> {
    const employee = await this.userRepository.findOne({ id });
    if (!employee || employee.type !== UserType.EMPLEADO || employee.ownerId !== ownerId || employee.status !== status) {
      throw new AppError('Empleado no encontrado', 404);
    }
    return employee;
  }

  async updateEmployee(ownerId: string, id: string, userData: Partial<User>): Promise<Omit<User, 'password'>> {
    await this.findOwnedEmployee(ownerId, id);
    if (userData.parkingId && !(await this.userRepository.ownsParking(ownerId, userData.parkingId))) {
      throw new AppError('El estacionamiento no pertenece a este dueño', 400);
    }
    if (userData.email) {
      const existing = await this.userRepository.findOneForEmail(userData.email);
      if (existing && existing.id !== id) throw new AppError('El email ya está registrado', 409);
    }
    const user = await this.userRepository.update(id, userData);
    return this.excludePassword(user!);
  }

  async removeEmployee(ownerId: string, id: string): Promise<void> {
    await this.findOwnedEmployee(ownerId, id);
    await this.userRepository.remove({ id });
  }

  async reactivateEmployee(ownerId: string, id: string): Promise<Omit<User, 'password'>> {
    await this.findOwnedEmployee(ownerId, id, UserStatus.BAJA);
    const user = await this.userRepository.update(id, { status: UserStatus.ACTIVO });
    return this.excludePassword(user!);
  }

  async update(params: { id: string }, userData: Partial<User>): Promise<Omit<User, 'password'> | null> {
    if (userData.password) {
      userData.password = await argon2.hash(userData.password);
    }
    const user = await this.userRepository.update(params.id, userData);
    if (!user) return null;
    return this.excludePassword(user);
  }

  async reactivate(params: { id: string }): Promise<Omit<User, 'password'> | null> {
    const user = await this.userRepository.update(params.id, { status: 'ACTIVO' });
    if (!user) return null;
    return this.excludePassword(user);
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

  // R-20: la baja (la pida el administrador o el propio usuario) no deja reservas ni sucursales activas sin responsable.
  async remove(params: { id: string }): Promise<boolean> {
    const user = await this.userRepository.findOne(params);
    if (!user) return false;

    if (user.type === UserType.CLIENTE) {
      const n = await this.userRepository.countActiveReservationsOfClient(user.id);
      if (n) throw new AppError(`No se puede dar de baja: tiene ${n} reserva(s) pendiente(s), confirmada(s) o en curso. Cancelalas o esperá a que terminen.`, 409);
    }
    if (user.type === UserType.DUENO) {
      const n = await this.userRepository.countActiveParkingsOfOwner(user.id);
      if (n) throw new AppError(`No se puede dar de baja: tiene ${n} sucursal(es) activa(s). Pausalas primero desde su panel.`, 409);
    }
    return await this.userRepository.remove(params);
  }

  async login(email: string, password: string): Promise<Omit<User, 'password'> | { error: string }> {
    const user = await this.userRepository.findOneForEmail(email);
    if (!user) return { error: 'Usuario no encontrado' };
    if (user.status !== UserStatus.ACTIVO) return { error: 'El usuario no está activo' };

    const isValid = await argon2.verify(user.password, password);
    if (!isValid) return { error: 'Contraseña incorrecta' };

    return this.excludePassword(user);
  }
}