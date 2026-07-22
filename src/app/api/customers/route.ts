import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { mlCustomerId: { contains: search } },
        { city: { contains: search } },
      ];
    }

    const customers = await prisma.customer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { sales: true, complaints: true } },
      },
    });

    return NextResponse.json({ success: true, data: customers, total: customers.length });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Erro ao buscar clientes.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, city, state, mlCustomerId } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, message: 'Nome do cliente é obrigatório.' },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.create({
      data: {
        name: name.trim(),
        email: email || null,
        phone: phone || null,
        city: city || null,
        state: state || null,
        mlCustomerId: mlCustomerId || null,
      },
    });

    return NextResponse.json(
      { success: true, message: 'Cliente criado com sucesso!', data: customer },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Erro ao criar cliente.' },
      { status: 400 }
    );
  }
}
