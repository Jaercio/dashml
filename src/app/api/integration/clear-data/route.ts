import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ success: false, message: 'Não autenticado.' }, { status: 401 });
    }

    await prisma.$transaction([
      prisma.return.deleteMany(),
      prisma.complaint.deleteMany(),
      prisma.sale.deleteMany(),
      prisma.stockMovement.deleteMany(),
      prisma.listing.deleteMany(),
      prisma.product.deleteMany(),
      prisma.customer.deleteMany(),
      prisma.financialRecord.deleteMany(),
      prisma.notification.deleteMany(),
      prisma.systemLog.deleteMany(),
    ]);

    return NextResponse.json({ success: true, message: 'Dados limpos com sucesso.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Erro ao limpar dados.' }, { status: 500 });
  }
}
