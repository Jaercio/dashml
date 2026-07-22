import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

const ML_AUTH_URL = 'https://auth.mercadolivre.com.br';

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ success: false, message: 'Usuário não identificado.' }, { status: 400 });
    }

    const clientIdRow = await prisma.systemSetting.findUnique({ where: { key: 'ML_CLIENT_ID' } });
    if (!clientIdRow) {
      return NextResponse.json({ success: false, message: 'Credenciais do ML não configuradas.' }, { status: 400 });
    }

    const redirectUri = process.env.ML_REDIRECT_URI || '';

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientIdRow.value,
      redirect_uri: redirectUri,
      state: userId,
    });

    return NextResponse.json({ success: true, url: `${ML_AUTH_URL}/authorization?${params.toString()}` });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Erro ao gerar link de conexão.' }, { status: 500 });
  }
}
