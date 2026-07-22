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

    const integration = await prisma.mLIntegration.findFirst();
    if (!integration) {
      return NextResponse.json({ success: true, message: 'No ML integration found' });
    }

    const syncMLData = new SyncMLData();
    const result = await syncMLData.execute(integration.userId);

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Sync error' },
      { status: 500 }
    );
  }
}
