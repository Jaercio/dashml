import { NextResponse, NextRequest } from 'next/server';
import { SyncMLData } from '@/core/use-cases/SyncMLData';

export async function POST(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ success: false, message: 'Não autenticado.' }, { status: 401 });
    }

    const syncMLData = new SyncMLData();
    const result = await syncMLData.execute(userId);

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Erro ao sincronizar dados.' },
      { status: 500 }
    );
  }
}
