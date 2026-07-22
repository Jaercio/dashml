import { NextResponse, NextRequest } from 'next/server';
import { DisconnectMLIntegration } from '@/core/use-cases/DisconnectMLIntegration';

export async function POST(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ success: false, message: 'Não autenticado.' }, { status: 401 });
    }

    const disconnectMLIntegration = new DisconnectMLIntegration();
    const result = await disconnectMLIntegration.execute(userId);

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Erro ao desconectar.' },
      { status: 500 }
    );
  }
}
