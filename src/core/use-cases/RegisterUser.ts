import { IUserRepository } from '../repositories/IUserRepository';
import { IHashService } from '../services/IHashService';
import { User, UserRole } from '../entities/User';

interface RegisterUserRequest {
  name: string;
  email: string;
  passwordHash: string;
  role?: string;
}

export class RegisterUser {
  constructor(
    private userRepository: IUserRepository,
    private hashService: IHashService
  ) {}

  async execute(request: RegisterUserRequest): Promise<User> {
    const { name, email, passwordHash, role } = request;

    if (!name || !email || !passwordHash) {
      throw new Error('Todos os campos obrigatórios devem ser preenchidos.');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Formato de e-mail inválido.');
    }

    if (passwordHash.length < 6) {
      throw new Error('A senha deve conter no mínimo 6 caracteres.');
    }

    const existingUser = await this.userRepository.findByEmail(email.toLowerCase());
    if (existingUser) {
      throw new Error('E-mail já cadastrado no sistema.');
    }

    // Hash the password before saving
    const hashedPassword = await this.hashService.hash(passwordHash);

    const userRole = role || 'ADMIN'; // Default role is ADMIN for first user or direct signup

    return this.userRepository.create({
      name,
      email: email.toLowerCase(),
      passwordHash: hashedPassword,
      role: userRole,
    });
  }
}
