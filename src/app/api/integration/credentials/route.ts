import { NextResponse } from 'next/server';
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
