import { IUserRepository } from '../../core/repositories/IUserRepository';
import { User, UserRole } from '../../core/entities/User';
import { prisma } from '../../lib/prisma';

export class PrismaUserRepository implements IUserRepository {
  private mapToDomain(dbUser: any): User {
    return new User(
      dbUser.id,
      dbUser.name,
      dbUser.email,
      dbUser.passwordHash,
      dbUser.role as UserRole,
      dbUser.createdAt,
      dbUser.updatedAt
    );
  }

  async findByEmail(email: string): Promise<User | null> {
    const dbUser = await prisma.user.findUnique({
      where: { email },
    });
    if (!dbUser) return null;
    return this.mapToDomain(dbUser);
  }

  async findById(id: string): Promise<User | null> {
    const dbUser = await prisma.user.findUnique({
      where: { id },
    });
    if (!dbUser) return null;
    return this.mapToDomain(dbUser);
  }

  async create(user: { name: string; email: string; passwordHash: string; role?: string }): Promise<User> {
    const dbUser = await prisma.user.create({
      data: {
        name: user.name,
        email: user.email,
        passwordHash: user.passwordHash,
        role: user.role || 'ADMIN',
      },
    });
    return this.mapToDomain(dbUser);
  }

  async update(id: string, data: Partial<{ name: string; passwordHash: string; role: string }>): Promise<User> {
    const dbUser = await prisma.user.update({
      where: { id },
      data,
    });
    return this.mapToDomain(dbUser);
  }
}
