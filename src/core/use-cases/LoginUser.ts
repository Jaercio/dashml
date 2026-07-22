import { IUserRepository } from '../repositories/IUserRepository';
import { IHashService } from '../services/IHashService';
import { ITokenService } from '../services/ITokenService';
import { User } from '../entities/User';

interface LoginUserRequest {
  email: string;
  passwordHash: string; // Plain password passed from client, named passwordHash here to match entity param input
}

interface LoginUserResponse {
  user: Omit<User, 'passwordHash'>;
  token: string;
}

export class LoginUser {
  constructor(
    private userRepository: IUserRepository,
    private hashService: IHashService,
    private tokenService: ITokenService
  ) {}

  async execute(request: LoginUserRequest): Promise<LoginUserResponse> {
    const { email, passwordHash: plainPassword } = request;

    if (!email || !plainPassword) {
      throw new Error('E-mail e senha são obrigatórios.');
    }

    const user = await this.userRepository.findByEmail(email.toLowerCase());
    if (!user) {
      throw new Error('E-mail ou senha incorretos.');
    }

    const isPasswordValid = await this.hashService.compare(plainPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('E-mail ou senha incorretos.');
    }

    // Generate JWT token
    const token = await this.tokenService.sign({
      sub: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    const { passwordHash, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
    };
  }
}
