import { NextResponse } from 'next/server';
import { RegisterUser } from '@/core/use-cases/RegisterUser';
import { PrismaUserRepository } from '@/infrastructure/database/PrismaUserRepository';
import { BcryptHashService } from '@/infrastructure/services/BcryptHashService';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, role } = body;

    const userRepository = new PrismaUserRepository();
    const hashService = new BcryptHashService();
    const registerUseCase = new RegisterUser(userRepository, hashService);

    const user = await registerUseCase.execute({
      name,
      email,
      passwordHash: password, // client sends plain password as 'password'
      role,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Usuário registrado com sucesso!',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Erro interno do servidor ao registrar usuário.',
      },
      { status: 400 }
    );
  }
}
