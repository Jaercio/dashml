import { NextResponse, NextRequest } from 'next/server';
import { GetMLIntegrationStatus } from '@/core/use-cases/GetMLIntegrationStatus';

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ success: false, message: 'Não autenticado.' }, { status: 401 });
    }

    const getMLIntegrationStatus = new GetMLIntegrationStatus();
    const status = await getMLIntegrationStatus.execute(userId);

    return NextResponse.json({ success: true, data: status });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Erro ao verificar integração.' },
      { status: 500 }
    );
  }
}
