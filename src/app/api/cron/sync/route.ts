import { NextResponse } from 'next/server';
import { SyncMLData } from '@/core/use-cases/SyncMLData';
import { prisma } from '@/lib/prisma';

export const maxDuration = 60;

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const integrations = await prisma.mLIntegration.findMany();
    if (integrations.length === 0) {
      return NextResponse.json({ success: true, message: 'No ML integration found' });
    }

    const results: Array<{ userId: string; success: boolean; data?: any; error?: string }> = [];
    const syncMLData = new SyncMLData();

    for (const integration of integrations) {
      try {
        const result = await syncMLData.execute(integration.userId);
        results.push({ userId: integration.userId, success: true, data: result });
      } catch (error: any) {
        results.push({ userId: integration.userId, success: false, error: error.message });
      }
    }

    return NextResponse.json({ success: true, data: results });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Sync error' },
      { status: 500 }
    );
  }
}
