import { NextResponse } from 'next/server';
import { GetDashboardStats } from '@/core/use-cases/GetDashboardStats';
import { PrismaDashboardRepository } from '@/infrastructure/database/PrismaDashboardRepository';

export async function GET() {
  try {
    const dashboardRepository = new PrismaDashboardRepository();
    const getDashboardStats = new GetDashboardStats(dashboardRepository);

    const stats = await getDashboardStats.execute();

    return NextResponse.json({ success: true, data: stats });
  } catch (error: any) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Erro ao carregar estatísticas.' },
      { status: 500 }
    );
  }
}
