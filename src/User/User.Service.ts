import { Repository } from '../Shared/base.Repository.js';
import { User } from './User.Entity.js';

export class UserService {
  constructor(private userRepository: Repository<User>) {}

  async findAll(): Promise<User[]> {
    return await this.userRepository.findAll();
  }

  async findOne(params: { id: string }): Promise<User | null> {
    return await this.userRepository.findOne(params);
  }

  async add(userData: Partial<User>): Promise<User> {
    return await this.userRepository.add(userData);
  }

  async update(params: { id: string }, userData: Partial<User>): Promise<User | null> {
    return await this.userRepository.update(params.id, userData);
  }

  async remove(params: { id: string }): Promise<boolean> {
    return await this.userRepository.remove(params);
  }
}