import { NextResponse } from 'next/server';
import { LoginUser } from '@/core/use-cases/LoginUser';
import { PrismaUserRepository } from '@/infrastructure/database/PrismaUserRepository';
import { BcryptHashService } from '@/infrastructure/services/BcryptHashService';
import { JwtTokenService } from '@/infrastructure/services/JwtTokenService';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    const userRepository = new PrismaUserRepository();
    const hashService = new BcryptHashService();
    const tokenService = new JwtTokenService();
    const loginUseCase = new LoginUser(userRepository, hashService, tokenService);

    const { user, token } = await loginUseCase.execute({
      email,
      passwordHash: password,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Login realizado com sucesso!',
      user,
    });

    // Configura o JWT em um cookie HttpOnly seguro
    const isHTTPS = request.url.startsWith('https');
    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: isHTTPS,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 horas
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Credenciais inválidas.',
      },
      { status: 401 }
    );
  }
}
