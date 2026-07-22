import { IUserRepository } from '../repositories/IUserRepository';

interface RecoverPasswordRequest {
  email: string;
}

export class RecoverPassword {
  constructor(private userRepository: IUserRepository) {}

  async execute(request: RecoverPasswordRequest): Promise<{ success: boolean; message: string }> {
    const { email } = request;

    if (!email) {
      throw new Error('E-mail é obrigatório.');
    }

    // Verify if user exists (internally)
    const user = await this.userRepository.findByEmail(email.toLowerCase());

    if (user) {
      // Simulation: Log password recovery attempt
      console.log(`[PASSWORD RECOVERY] Enviado link de recuperação para o e-mail: ${email}`);
      // In a real application, we would use a mailer service here.
    }

    // Always return a success message to prevent user enumeration
    return {
      success: true,
      message: 'Se o e-mail estiver cadastrado em nosso sistema, você receberá um link de recuperação em breve.',
    };
  }
}
