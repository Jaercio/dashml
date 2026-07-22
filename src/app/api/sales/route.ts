import { NextResponse } from 'next/server';
import { SaleRepository } from '@/infrastructure/database/SaleRepository';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const summary = searchParams.get('summary') === 'true';

    const repository = new SaleRepository();

    if (summary) {
      const data = await repository.getSummary({ search, status, startDate, endDate });
      return NextResponse.json({ success: true, data });
    }

    const sales = await repository.findAll({ search, status, startDate, endDate });
    return NextResponse.json({ success: true, data: sales, total: sales.length });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Erro ao buscar vendas.' },
      { status: 500 }
    );
  }
}
