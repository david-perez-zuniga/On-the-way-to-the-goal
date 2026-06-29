import { User } from '../entities/User';

// Métodos para crear y buscar
export interface IUserRepository{
  create(user: User): Promise<void>;
  findById(id: string): Promise<User | null>;
  findAll(userId: string): Promise<User[]>
}
