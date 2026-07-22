import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const clientIdSetting = await prisma.systemSetting.findUnique({
      where: { key: 'ML_CLIENT_ID' },
    });
    const clientSecretSetting = await prisma.systemSetting.findUnique({
      where: { key: 'ML_CLIENT_SECRET' },
    });

    return NextResponse.json({
      success: true,
      data: {
        configured: !!(clientIdSetting && clientSecretSetting),
        clientId: clientIdSetting?.value || null,
        hasClientSecret: !!clientSecretSetting,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Erro ao verificar credenciais.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, clientSecret } = body;

    console.log('[ML Credentials] POST recebido:', { clientId: clientId?.substring(0, 10) + '...', hasSecret: !!clientSecret });

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

    console.log('[ML Credentials] Credenciais salvas com sucesso');

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
