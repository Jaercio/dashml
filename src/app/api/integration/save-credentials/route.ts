import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, clientSecret } = body;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { success: false, message: 'Client ID e Client Secret são obrigatórios.' },
        { status: 400 }
      );
    }

    await prisma.systemSetting.upsert({
      where: { key: 'ML_CLIENT_ID' },
      update: { value: clientId },
      create: { key: 'ML_CLIENT_ID', value: clientId },
    });

    await prisma.systemSetting.upsert({
      where: { key: 'ML_CLIENT_SECRET' },
      update: { value: clientSecret },
      create: { key: 'ML_CLIENT_SECRET', value: clientSecret },
    });

    return NextResponse.json({
      success: true,
      message: 'Credenciais salvas com sucesso.',
    });
  } catch (error: any) {
    console.error('[ML Credentials] Erro ao salvar:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Erro ao salvar credenciais.' },
      { status: 500 }
    );
  }
}
