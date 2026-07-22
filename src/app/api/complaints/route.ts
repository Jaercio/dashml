import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;

    const where: any = {};
    if (status) where.status = status;

    const complaints = await prisma.complaint.findMany({
      where,
      include: {
        sale: { select: { mlOrderId: true } },
        product: { select: { name: true, sku: true } },
        customer: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: complaints, total: complaints.length });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Erro ao buscar reclamações.' },
      { status: 500 }
    );
  }
}
