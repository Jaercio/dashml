export type UserRole = 'ADMIN' | 'EMPLOYEE' | 'FINANCE' | 'VIEWER';

export class User {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly email: string,
    public readonly passwordHash: string,
    public readonly role: UserRole,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}
}
