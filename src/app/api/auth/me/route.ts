import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { JwtTokenService } from '@/infrastructure/services/JwtTokenService';
import { PrismaUserRepository } from '@/infrastructure/database/PrismaUserRepository';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Não autenticado.' },
        { status: 401 }
      );
    }

    const tokenService = new JwtTokenService();
    const decoded = await tokenService.verify(token);

    if (!decoded || !decoded.sub) {
      return NextResponse.json(
        { success: false, message: 'Sessão inválida ou expirada.' },
        { status: 401 }
      );
    }

    const userRepository = new PrismaUserRepository();
    const user = await userRepository.findById(decoded.sub);

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Usuário não encontrado.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Erro interno ao validar sessão.' },
      { status: 500 }
    );
  }
}
