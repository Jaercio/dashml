import { User } from '../entities/User';

export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(user: { name: string; email: string; passwordHash: string; role?: string }): Promise<User>;
  update(id: string, data: Partial<{ name: string; passwordHash: string; role: string }>): Promise<User>;
}
