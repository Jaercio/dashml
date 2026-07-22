import { NextResponse } from 'next/server';
import { RecoverPassword } from '@/core/use-cases/RecoverPassword';
import { PrismaUserRepository } from '@/infrastructure/database/PrismaUserRepository';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    const userRepository = new PrismaUserRepository();
    const recoverUseCase = new RecoverPassword(userRepository);

    const result = await recoverUseCase.execute({ email });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Erro ao processar solicitação de recuperação.',
      },
      { status: 400 }
    );
  }
}
